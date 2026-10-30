const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const dbFile = path.join(__dirname, "api-test.sqlite");
try { fs.unlinkSync(dbFile); } catch {}
process.env.DB_FILE = dbFile;
process.env.PORT = "0";
const { app, db, ready } = require("../server");

let server;
let baseUrl;

test.before(async () => {
  await ready;
  server = await new Promise(resolve => {
    const instance = app.listen(0, () => resolve(instance));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise(resolve => server.close(resolve));
  await new Promise(resolve => db.close(resolve));
  try { fs.unlinkSync(dbFile); } catch {}
});

async function request(pathname, options) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    headers: { "content-type": "application/json" },
    ...options,
    body: options?.body ? JSON.stringify(options.body) : undefined
  });
  return { response, body: await response.json() };
}

test("rejects passwords shorter than twelve characters", async () => {
  const { response, body } = await request("/api/register", {
    method: "POST",
    body: { name: "Driver", email: "short@example.com", password: "too-short" }
  });
  assert.equal(response.status, 400);
  assert.equal(body.field, "password");
});

test("registers a driver with a selected account role", async () => {
  const { response, body } = await request("/api/register", {
    method: "POST",
    body: { name: "Role Driver", email: "role@example.com", password: "valid-password-123", role: "EVDriver" }
  });
  assert.equal(response.status, 201);
  assert.equal(body.message, "Registration successful");
});

test("signs in with a seeded test driver account", async () => {
  const { response, body } = await request("/api/login", {
    method: "POST",
    body: { email: "driver@example.com", password: "DriverTest!2026", role: "EVDriver" }
  });
  assert.equal(response.status, 200);
  assert.equal(body.user.role, "EVDriver");
});

test("rejects malformed email addresses on sign in", async () => {
  const { response, body } = await request("/api/login", {
    method: "POST",
    body: { email: "not-an-email", password: "DriverTest!2026", role: "EVDriver" }
  });
  assert.equal(response.status, 400);
  assert.equal(body.field, "email");
});

test("validates forgot-password and reset-password requests", async () => {
  const forgot = await request("/api/forgot-password", { method: "POST", body: { email: "bad-email" } });
  const reset = await request("/api/reset-password", {
    method: "POST",
    body: { email: "driver@example.com", password: "short" }
  });
  assert.equal(forgot.response.status, 400);
  assert.equal(reset.response.status, 400);
  assert.equal(reset.body.field, "password");
});

test("resets a password with a token and allows immediate login", async () => {
  const forgot = await request("/api/forgot-password", {
    method: "POST",
    body: { email: "driver@example.com" }
  });
  const reset = await request("/api/reset-password", {
    method: "POST",
    body: {
      email: "driver@example.com",
      token: forgot.body.token,
      password: "ResetDriver!2026",
      confirmPassword: "ResetDriver!2026"
    }
  });
  const login = await request("/api/login", {
    method: "POST",
    body: { email: "driver@example.com", password: "ResetDriver!2026", role: "EVDriver" }
  });
  assert.equal(reset.response.status, 200);
  assert.equal(login.response.status, 200);
});

test("creates a charger draft and calculates tariff cost", async () => {
  const operator = await request("/api/login", {
    method: "POST",
    body: { email: "test1@example.com", password: "test1Test!2026", role: "ChargingStationOperator" }
  });
  const registration = await request("/api/register", {
    method: "POST",
    body: { name: "Driver", email: "profile.driver@example.com", password: "valid-password-123" }
  });
  const draft = await request("/api/chargers", {
    method: "POST",
    body: { chargerId: "CH-1", connectorType: "CCS2", capacityKW: 60, userId: operator.body.user.userId, role: "ChargingStationOperator" }
  });
  const cost = await request("/api/sessions/cost", {
    method: "POST",
    body: { energyKWh: 20, ratePerKWh: 18.5, fixedCharge: 50 }
  });
  assert.equal(draft.response.status, 201);
  assert.equal(draft.body.status, "DRAFT");
  assert.equal(cost.body.totalCost, 420);
  const profile = await request("/api/profile", {
    method: "PATCH",
    body: { userId: registration.body.userId, name: "Updated Driver", phone: "9999999999" }
  });
  assert.equal(profile.response.status, 200);
  assert.equal(profile.body.name, "Updated Driver");
  const password = await request("/api/profile/password", {
    method: "POST",
    body: {
      userId: registration.body.userId,
      currentPassword: "valid-password-123",
      newPassword: "ProfileReset!2026",
      confirmPassword: "ProfileReset!2026"
    }
  });
  assert.equal(password.response.status, 200);
});

test("persists a tariff rate and fixed charge", async () => {
  const created = await request("/api/tariffs", {
    method: "POST",
    body: { ratePerKWh: 18.5, fixedCharge: 50, role: "ChargingStationOperator" }
  });

  const listed = await request("/api/tariffs");
  assert.equal(created.response.status, 201);
  assert.equal(listed.body.tariffs.some(tariff => tariff.tariff_id === created.body.tariffId), true);
});

test("forbids system administrators from modifying tariffs", async () => {
  const response = await request("/api/tariffs", {
    method: "POST",
    body: { ratePerKWh: 20, fixedCharge: 40, role: "SystemAdministrator" }
  });
  assert.equal(response.response.status, 403);
});

test("seeds three operators with distinct station assignments", async () => {
  for (const [email, password, station] of [
    ["test1@example.com", "test1Test!2026", "ST-1"],
    ["test2@example.com", "test2Test!2026", "ST-2"],
    ["test3@example.com", "test3Test!2026", "ST-3"]
  ]) {
    const response = await request("/api/login", {
      method: "POST",
      body: { email, password, role: "ChargingStationOperator" }
    });
    assert.equal(response.response.status, 200);
    assert.equal(response.body.user.assignedStationId, station);
  }
});

test("creates a reservation for a forward time interval", async () => {
  const { response, body } = await request("/api/reservations", {
    method: "POST",
    body: { startTime: "2026-10-30T12:00:00Z", endTime: "2026-10-30T13:00:00Z" }
  });
  assert.equal(response.status, 201);
  assert.equal(body.status, "Pending");
  const session = await request("/api/sessions/start", {
    method: "POST",
    body: {
      reservationId: body.reservationId,
      connectorType: "CCS2",
      paymentAuthorized: true
    }
  });
  assert.equal(session.response.status, 201);
  assert.equal(session.body.status, "Active");
});

test("rejects reversed reservation and search intervals", async () => {
  const reservation = await request("/api/reservations", {
    method: "POST",
    body: { startTime: "2026-10-30T12:00:00Z", endTime: "2026-10-30T11:00:00Z" }
  });
  const search = await request("/api/chargers/search?startTime=2026-10-30T12:00:00Z&endTime=2026-10-30T11:00:00Z");
  assert.equal(reservation.response.status, 400);
  assert.equal(search.response.status, 400);
});

test("rejects charger search when end time is missing", async () => {
  const { response, body } = await request("/api/chargers/search?startTime=2026-10-30T12:00:00Z");
  assert.equal(response.status, 400);
  assert.match(body.error, /start and end time are required/i);
});
