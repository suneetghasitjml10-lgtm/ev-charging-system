const path = require("node:path");
const crypto = require("node:crypto");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DB_FILE = process.env.DB_FILE || path.join(__dirname, "ev-csms.sqlite");
const db = new sqlite3.Database(DB_FILE);
const resetTokens = new Map();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordIsValid = password => typeof password === "string" && password.length >= 12;
const required = (value) => typeof value === "string" && value.trim().length > 0;
const sendError = (res, status, message, field = null) =>
  res.status(status).json({ error: message, ...(field ? { field } : {}) });
const hashPassword = password => new Promise((resolve, reject) => {
  const salt = crypto.randomBytes(16).toString("hex");
  crypto.scrypt(password, salt, 64, (error, derivedKey) => {
    if (error) reject(error);
    else resolve(`scrypt$${salt}$${derivedKey.toString("hex")}`);
  });
});
const verifyPassword = (password, stored) => new Promise((resolve, reject) => {
  if (!stored || !stored.startsWith("scrypt$")) return resolve(password === stored);
  const [, salt, hash] = stored.split("$");
  crypto.scrypt(password, salt, 64, (error, derivedKey) => {
    if (error) reject(error);
    else resolve(crypto.timingSafeEqual(Buffer.from(hash, "hex"), derivedKey));
  });
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) reject(error);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => error ? reject(error) : resolve(row));
  });
}

async function addColumnIfMissing(table, column, definition) {
  const columns = await new Promise((resolve, reject) => db.all(`PRAGMA table_info(${table})`, [], (error, rows) =>
    error ? reject(error) : resolve(rows.map(row => row.name))
  ));
  if (!columns.includes(column)) await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

async function initializeDatabase() {
  await run("PRAGMA foreign_keys = ON");
  await run(`CREATE TABLE IF NOT EXISTS Users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'EVDriver', phone TEXT, account_status TEXT NOT NULL DEFAULT 'Active',
    assigned_station_id TEXT
  )`);
  await addColumnIfMissing("Users", "assigned_station_id", "TEXT");
  await run(`CREATE TABLE IF NOT EXISTS Stations (
    station_id TEXT PRIMARY KEY, name TEXT NOT NULL, location TEXT, status TEXT NOT NULL DEFAULT 'DRAFT'
  )`);
  await run(`CREATE TABLE IF NOT EXISTS Chargers (
    charger_id TEXT PRIMARY KEY, station_id TEXT NOT NULL, connector_type TEXT NOT NULL,
    capacity_kw REAL NOT NULL, status TEXT NOT NULL DEFAULT 'DRAFT',
    FOREIGN KEY (station_id) REFERENCES Stations(station_id)
  )`);
  await run(`CREATE TABLE IF NOT EXISTS Tariffs (
    tariff_id INTEGER PRIMARY KEY AUTOINCREMENT, station_id TEXT, rate_per_kwh REAL NOT NULL,
    fixed_charge REAL NOT NULL DEFAULT 0, FOREIGN KEY (station_id) REFERENCES Stations(station_id)
  )`);
  await run(`CREATE TABLE IF NOT EXISTS Reservations (
    reservation_id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, charger_id TEXT,
    start_time TEXT NOT NULL, end_time TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Pending',
    FOREIGN KEY (user_id) REFERENCES Users(user_id), FOREIGN KEY (charger_id) REFERENCES Chargers(charger_id)
  )`);
  await run(`CREATE TABLE IF NOT EXISTS ChargingSessions (
    session_id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, charger_id TEXT,
    start_time TEXT NOT NULL, end_time TEXT, energy_kwh REAL NOT NULL DEFAULT 0,
    total_cost REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'Active'
  )`);
  await run(`CREATE TABLE IF NOT EXISTS MaintenanceWorkOrders (
    work_order_id INTEGER PRIMARY KEY AUTOINCREMENT, charger_id TEXT, issue_description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open', resolution_notes TEXT
  )`);
  const seedUsers = [
    ["Test Driver", "driver@example.com", "DriverTest!2026", "EVDriver"],
    ["Test Operator", "operator@example.com", "OperatorTest!2026", "ChargingStationOperator"],
    ["Test Engineer", "engineer@example.com", "EngineerTest!2026", "MaintenanceEngineer"],
    ["Test Fleet Manager", "manager@example.com", "ManagerTest!2026", "FleetManager"],
    ["Test Administrator", "admin@example.com", "AdminTest!2026", "SystemAdministrator"]
  ];
  for (const [name, email, password, role] of seedUsers) {
    await run("INSERT OR IGNORE INTO Users (name,email,password,role) VALUES (?,?,?,?)",
      [name, email, await hashPassword(password), role]);
  }
  const sampleStations = [
    ["ST-1", "Bandra Kurla Complex Hub", "BKC, Mumbai"],
    ["ST-2", "Powai Tech Park", "Powai, Mumbai"],
    ["ST-3", "Andheri West Station", "Andheri, Mumbai"]
  ];
  for (const station of sampleStations) {
    await run("INSERT OR IGNORE INTO Stations (station_id,name,location,status) VALUES (?,?,?,'Operational')", station);
  }
  const operators = [
    ["test1", "Operator 1", "test1@example.com", "ST-1"],
    ["test2", "Operator 2", "test2@example.com", "ST-2"],
    ["test3", "Operator 3", "test3@example.com", "ST-3"]
  ];
  for (const [emailPrefix, name, email, stationId] of operators) {
    await run("INSERT OR IGNORE INTO Users (name,email,password,role,assigned_station_id) VALUES (?,?,?,?,?)",
      [name, email, await hashPassword(`${emailPrefix}Test!2026`), "ChargingStationOperator", stationId]);
    await run("UPDATE Users SET assigned_station_id = ? WHERE email = ?", [stationId, email]);
  }
  const legacyUsers = await new Promise((resolve, reject) => db.all("SELECT user_id, password FROM Users", [], (error, rows) =>
    error ? reject(error) : resolve(rows)
  ));
  for (const user of legacyUsers) {
    if (!user.password.startsWith("scrypt$")) {
      await run("UPDATE Users SET password = ? WHERE user_id = ?", [await hashPassword(user.password), user.user_id]);
    }
  }
}

function validInterval(startTime, endTime) {
  const start = Date.parse(startTime);
  const end = Date.parse(endTime);
  return Number.isFinite(start) && Number.isFinite(end) && end > start;
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/register", async (req, res) => {
  const { name, email, password, phone = null, role = "EVDriver" } = req.body;
  if (!required(name)) return sendError(res, 400, "Name is required", "name");
  if (!emailPattern.test(String(email || ""))) return sendError(res, 400, "Enter a valid email address", "email");
  if (!passwordIsValid(password)) return sendError(res, 400, "Password must be at least 12 characters", "password");
  if (!["EVDriver", "ChargingStationOperator", "MaintenanceEngineer", "FleetManager", "SystemAdministrator"].includes(role)) {
    return sendError(res, 400, "Select a valid account type", "role");
  }
  try {
    const result = await run("INSERT INTO Users (name,email,password,role,phone) VALUES (?,?,?,?,?)",
      [name.trim(), email.toLowerCase(), await hashPassword(password), role, phone]);
    res.status(201).json({ userId: result.id, message: "Registration successful" });
  } catch (error) {
    if (error.message.includes("UNIQUE")) return sendError(res, 409, "An account with this email already exists", "email");
    res.status(500).json({ error: "Unable to create account" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password, role } = req.body;
  if (!emailPattern.test(String(email || ""))) return sendError(res, 400, "Enter a valid email address", "email");
  if (!required(password)) return sendError(res, 400, "Password is required", "password");
  if (!["EVDriver", "ChargingStationOperator", "MaintenanceEngineer", "FleetManager", "SystemAdministrator"].includes(role)) {
    return sendError(res, 400, "Select a valid account type", "role");
  }
  const user = await get(`SELECT user_id AS userId, name, email, password, role, phone,
    assigned_station_id AS assignedStationId,
    (SELECT name FROM Stations WHERE station_id = Users.assigned_station_id) AS assignedStationName
    FROM Users WHERE email = ? AND role = ?`, [email.toLowerCase(), role]);
  if (!user || !(await verifyPassword(password, user.password))) return sendError(res, 401, "Invalid email or password");
  delete user.password;
  res.json({ user, message: "Sign in successful" });
});

app.post("/api/forgot-password", async (req, res) => {
  const email = String(req.body.email || "").toLowerCase();
  if (!emailPattern.test(email)) return sendError(res, 400, "Enter a valid email address", "email");
  const user = await get("SELECT user_id FROM Users WHERE email = ?", [email]);
  if (!user) return sendError(res, 404, "Account not found", "email");
  const token = crypto.randomBytes(24).toString("hex");
  resetTokens.set(token, { email, expiresAt: Date.now() + 15 * 60 * 1000 });
  res.json({ message: "Email verified; submit the new password", token });
});

app.post("/api/reset-password", async (req, res) => {
  const { email, token, password, confirmPassword } = req.body;
  if (!emailPattern.test(String(email || ""))) return sendError(res, 400, "Enter a valid email address", "email");
  if (!passwordIsValid(password)) return sendError(res, 400, "Password must be at least 12 characters", "password");
  if (password !== confirmPassword) return sendError(res, 400, "Passwords do not match", "confirmPassword");
  const reset = resetTokens.get(token);
  if (!reset || reset.email !== email.toLowerCase() || reset.expiresAt < Date.now()) {
    return sendError(res, 400, "Reset token is invalid or expired", "token");
  }
  const result = await run("UPDATE Users SET password = ? WHERE email = ?", [await hashPassword(password), email.toLowerCase()]);
  if (!result.changes) return sendError(res, 404, "Account not found", "email");
  resetTokens.delete(token);
  res.json({ message: "Password reset successful" });
});

app.patch("/api/profile", async (req, res) => {
  const { userId, name, phone } = req.body;
  if (!userId || !required(name)) return sendError(res, 400, "User ID and name are required");
  const result = await run("UPDATE Users SET name = ?, phone = ? WHERE user_id = ?", [name.trim(), phone || null, userId]);
  if (!result.changes) return sendError(res, 404, "User not found");
  res.json({ message: "Profile updated successfully", name: name.trim(), phone: phone || null });
});

app.post("/api/profile/password", async (req, res) => {
  const { userId, currentPassword, newPassword, confirmPassword } = req.body;
  if (!userId || !required(currentPassword)) return sendError(res, 400, "Current password is required", "currentPassword");
  if (!passwordIsValid(newPassword)) return sendError(res, 400, "Password must be at least 12 characters", "newPassword");
  if (newPassword !== confirmPassword) return sendError(res, 400, "Passwords do not match", "confirmPassword");
  const user = await get("SELECT password FROM Users WHERE user_id = ?", [userId]);
  if (!user || !(await verifyPassword(currentPassword, user.password))) return sendError(res, 401, "Current password is incorrect", "currentPassword");
  await run("UPDATE Users SET password = ? WHERE user_id = ?", [await hashPassword(newPassword), userId]);
  res.json({ message: "Password updated successfully" });
});

app.post("/api/chargers", async (req, res) => {
  const { stationId, stationName, chargerId, connectorType, capacityKW, userId, role } = req.body;
  if (role !== "ChargingStationOperator" || !userId) return sendError(res, 403, "Only assigned station operators can add chargers");
  const operator = await get("SELECT assigned_station_id AS assignedStationId FROM Users WHERE user_id = ? AND role = 'ChargingStationOperator'", [userId]);
  if (!operator || !operator.assignedStationId) return sendError(res, 403, "Operator has no assigned station");
  const assignedStation = await get("SELECT station_id AS stationId, name AS stationName FROM Stations WHERE station_id = ?", [operator.assignedStationId]);
  if (!assignedStation || !required(chargerId) || !required(connectorType) || Number(capacityKW) <= 0) {
    return sendError(res, 400, "Station ID, charger ID, connector type, and positive capacity are required");
  }
  try {
    await run("INSERT INTO Chargers (charger_id,station_id,connector_type,capacity_kw,status) VALUES (?,?,?,?,'DRAFT')",
      [chargerId.trim(), assignedStation.stationId, connectorType.trim(), Number(capacityKW)]);
    res.status(201).json({ stationId: assignedStation.stationId, stationName: assignedStation.stationName, chargerId, status: "DRAFT" });
  } catch (error) {
    if (error.message.includes("UNIQUE")) return sendError(res, 409, "Station or charger already exists");
    res.status(500).json({ error: "Unable to create charger draft" });
  }
});

app.get("/api/tariffs", async (_req, res) => {
  const rows = await new Promise((resolve, reject) => db.all("SELECT * FROM Tariffs ORDER BY tariff_id", [], (error, data) =>
    error ? reject(error) : resolve(data)
  ));
  res.json({ tariffs: rows });
});

app.post("/api/tariffs", async (req, res) => {
  const { stationId = null, ratePerKWh, fixedCharge = 0, role } = req.body;
  if (role !== "ChargingStationOperator") return sendError(res, 403, "System administrators cannot modify tariffs");
  if (!Number.isFinite(Number(ratePerKWh)) || Number(ratePerKWh) < 0 ||
      !Number.isFinite(Number(fixedCharge)) || Number(fixedCharge) < 0) {
    return sendError(res, 400, "Rate per kWh and fixed charge must be non-negative numbers");
  }
  const result = await run("INSERT INTO Tariffs (station_id,rate_per_kwh,fixed_charge) VALUES (?,?,?)",
    [stationId, Number(ratePerKWh), Number(fixedCharge)]);
  res.status(201).json({ tariffId: result.id, stationId, ratePerKWh: Number(ratePerKWh), fixedCharge: Number(fixedCharge) });
});

app.get("/api/chargers/search", async (req, res) => {
  const { startTime, endTime } = req.query;
  if (!startTime || !endTime) return sendError(res, 400, "Start and end time are required");
  if (!validInterval(startTime, endTime)) return sendError(res, 400, "End time must be after start time");
  const rows = await new Promise((resolve, reject) => db.all(
    "SELECT * FROM Chargers WHERE status = 'DRAFT' OR status = 'Available'", [], (error, data) => error ? reject(error) : resolve(data)
  ));
  res.json({ chargers: rows, startTime, endTime });
});

app.get("/api/reservations", async (req, res) => {
  const params = req.query.userId ? [req.query.userId] : [];
  const where = req.query.userId ? "WHERE r.user_id = ?" : "";
  const rows = await new Promise((resolve, reject) => db.all(
    `SELECT r.reservation_id AS reservationId, r.charger_id AS chargerId, r.start_time AS startTime,
      r.end_time AS endTime, r.status, s.name AS stationName
     FROM Reservations r LEFT JOIN Chargers c ON c.charger_id = r.charger_id
     LEFT JOIN Stations s ON s.station_id = c.station_id ${where} ORDER BY r.reservation_id DESC`,
    params, (error, data) => error ? reject(error) : resolve(data)
  ));
  res.json({ reservations: rows });
});

app.post("/api/reservations", async (req, res) => {
  const { userId = null, chargerId = null, startTime, endTime } = req.body;
  if (!validInterval(startTime, endTime)) return sendError(res, 400, "End time must be after start time");
  const result = await run("INSERT INTO Reservations (user_id,charger_id,start_time,end_time) VALUES (?,?,?,?)",
    [userId, chargerId, new Date(startTime).toISOString(), new Date(endTime).toISOString()]);
  const station = chargerId ? await get(`SELECT s.name AS stationName FROM Chargers c
    JOIN Stations s ON s.station_id = c.station_id WHERE c.charger_id = ?`, [chargerId]) : null;
  res.status(201).json({ reservationId: result.id, chargerId, stationName: station?.stationName || null, startTime, endTime, status: "Pending" });
});

app.post("/api/sessions/cost", async (req, res) => {
  const energyKWh = Number(req.body.energyKWh);
  const ratePerKWh = Number(req.body.ratePerKWh);
  const fixedCharge = Number(req.body.fixedCharge);
  if (![energyKWh, ratePerKWh, fixedCharge].every(Number.isFinite) || energyKWh < 0 || ratePerKWh < 0 || fixedCharge < 0) {
    return sendError(res, 400, "Energy, rate, and fixed charge must be non-negative numbers");
  }
  res.json({ totalCost: Number((fixedCharge + energyKWh * ratePerKWh).toFixed(2)) });
});

app.post("/api/sessions/start", async (req, res) => {
  const { reservationId, connectorType, paymentAuthorized = false, userId = null } = req.body;
  if (!Number.isInteger(Number(reservationId)) || !required(connectorType)) {
    return sendError(res, 400, "Reservation ID and connector type are required");
  }
  if (paymentAuthorized !== true) return sendError(res, 402, "Payment authorization is required");
  const reservation = await get(`SELECT r.*, c.connector_type AS expectedConnector
    FROM Reservations r LEFT JOIN Chargers c ON c.charger_id = r.charger_id
    WHERE r.reservation_id = ? AND (r.user_id = ? OR ? IS NULL)`, [Number(reservationId), userId, userId]);
  if (!reservation) return sendError(res, 404, "Reservation not found", "reservationId");
  if (reservation.expectedConnector && reservation.expectedConnector !== connectorType) {
    return sendError(res, 400, "Connector type does not match the reservation", "connectorType");
  }
  const result = await run(
    "INSERT INTO ChargingSessions (user_id,charger_id,start_time,status) VALUES (?,?,?,'Active')",
    [userId, reservation.charger_id, new Date().toISOString()]
  );
  res.status(201).json({ sessionId: result.id, reservationId: Number(reservationId), connectorType, status: "Active" });
});

app.use(express.static(__dirname));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

const ready = initializeDatabase();
if (require.main === module) ready.then(() => app.listen(PORT, () => console.log(`EV CSMS listening on http://localhost:${PORT}`)));

module.exports = { app, db, ready };
