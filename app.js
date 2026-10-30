/**
 * EV ChargeHub - Application Logic
 * Uses the exact classes from classes.js
 */

// ========== SAMPLE DATA ==========

const paymentGateway = new PaymentGateway();
const ocppService = new OCPPService();

// Users
const users = {
  EVDriver: new EVDriver(1, "Test Driver", "driver@example.com", "DriverTest!2026", 101, 250),
  ChargingStationOperator: Object.assign(
    new ChargingStationOperator(2, "Operator 1", "test1@example.com", "test1Test!2026", 201),
    { assignedStationId: "ST-1", assignedStationName: "Bandra Kurla Complex Hub" }
  ),
  MaintenanceEngineer: new MaintenanceEngineer(3, "Test Engineer", "engineer@example.com", "EngineerTest!2026", 301, "Power Electronics"),
  FleetManager: new FleetManager(4, "Test Fleet Manager", "manager@example.com", "ManagerTest!2026", 401),
  SystemAdministrator: new SystemAdministrator(5, "Test Administrator", "admin@example.com", "AdminTest!2026", 501)
};

// Vehicles
const vehicles = [
  new Vehicle(1, "Tata", "Nexon EV", "CCS2", 40.5),
  new Vehicle(2, "MG", "ZS EV", "CCS2", 50.3),
  new Vehicle(3, "Hyundai", "Kona Electric", "CCS2", 39.2),
  new Vehicle(4, "Tata", "Tigor EV", "Type2", 26.0),
  new Vehicle(5, "BYD", "Atto 3", "CCS2", 60.5)
];

// Chargers
const chargers = [
  new Charger(1, "CCS2", "DC Fast", 60, "Available"),
  new Charger(2, "CCS2", "DC Fast", 50, "Busy"),
  new Charger(3, "Type2", "AC", 22, "Available"),
  new Charger(4, "CCS2", "DC Fast", 120, "Available"),
  new Charger(5, "Type2", "AC", 11, "Fault"),
  new Charger(6, "CCS2", "DC Fast", 60, "Available"),
  new Charger(7, "CCS2", "DC Ultra", 150, "Busy"),
  new Charger(8, "Type2", "AC", 22, "Offline")
];

// Charging Stations
const stations = [
  new ChargingStation(1, "Bandra Kurla Complex Hub", "BKC, Mumbai", "Operational"),
  new ChargingStation(2, "Powai Tech Park", "Powai, Mumbai", "Operational"),
  new ChargingStation(3, "Andheri West Station", "Andheri, Mumbai", "Maintenance")
];

stations[0].addCharger(chargers[0]);
stations[0].addCharger(chargers[1]);
stations[0].addCharger(chargers[2]);
stations[1].addCharger(chargers[3]);
stations[1].addCharger(chargers[4]);
stations[1].addCharger(chargers[5]);
stations[2].addCharger(chargers[6]);
stations[2].addCharger(chargers[7]);

// Reservations
let reservations = [
  new Reservation(1, new Date(Date.now() + 3600000), new Date(Date.now() + 7200000), "Confirmed", 15, 450),
  new Reservation(2, new Date(Date.now() + 86400000), new Date(Date.now() + 90000000), "Pending", 15, 320)
];
reservations[0].chargerId = 1;
reservations[0].driverId = 101;
reservations[0].stationName = "Bandra Kurla Complex Hub";
reservations[1].chargerId = 4;
reservations[1].driverId = 101;
reservations[1].stationName = "Powai Tech Park";

// Charging Sessions
let sessions = [
  new ChargingSession(1, new Date(Date.now() - 1800000), null, 18.5, "Active", 0),
  new ChargingSession(2, new Date(Date.now() - 86400000), new Date(Date.now() - 82800000), 32.0, "Completed", 680)
];
sessions[0].chargerId = 2;
sessions[0].driverId = 101;
sessions[1].chargerId = 1;
sessions[1].driverId = 101;

// Payments
let payments = [
  new Payment(1, 680, "Captured", "TXN-2024-88421"),
  new Payment(2, 450, "Pending", "TXN-2024-88455")
];

// Subscription Plans
const subscriptionPlans = [
  new SubscriptionPlan(1, "Basic", 299, "Monthly"),
  new SubscriptionPlan(2, "Premium", 599, "Monthly"),
  new SubscriptionPlan(3, "Fleet Pro", 2499, "Monthly")
];

// Subscriptions
let subscriptions = [
  new Subscription(1, new Date("2024-09-01"), new Date("2024-12-01"), "Active")
];
subscriptions[0].planId = 2;
subscriptions[0].driverId = 101;

// Fleets
const fleets = [
  new Fleet(1, "City Logistics Fleet"),
  new Fleet(2, "Corporate Pool")
];
fleets[0].addVehicle(vehicles[0]);
fleets[0].addVehicle(vehicles[1]);
fleets[1].addVehicle(vehicles[2]);
fleets[1].addVehicle(vehicles[3]);

// Maintenance Work Orders
let workOrders = [
  new MaintenanceWorkOrder(1, "Charger 5 showing fault code E-42 (connector overheating)", "Open"),
  new MaintenanceWorkOrder(2, "Routine inspection for Station 2", "In Progress", "Parts ordered"),
  new MaintenanceWorkOrder(3, "Firmware update required on Charger 7", "Resolved", "Updated to v2.4.1")
];
workOrders[0].chargerId = 5;
workOrders[1].chargerId = 4;
workOrders[2].chargerId = 7;

// Tariffs
const tariffs = [
  new Tariff(1, 18.5, 50),
  new Tariff(2, 22.0, 75),
  new Tariff(3, 15.0, 30)
];
stations[0].tariff = tariffs[0];
stations[1].tariff = tariffs[1];
stations[2].tariff = tariffs[2];

// Analytics Reports
let analyticsReports = [
  new AnalyticsReport(1, "Monthly Usage Summary", new Date("2024-10-01")),
  new AnalyticsReport(2, "Revenue Report Q3", new Date("2024-10-15")),
  new AnalyticsReport(3, "Charger Utilization", new Date("2024-10-20"))
];

// Virtual Assistant
const virtualAssistant = new VirtualAssistant(1, "ChargeBot");

// ========== APP STATE ==========

let currentUser = null;
let currentRole = null;
let reservationsLoading = false;
let nextId = { reservation: 3, session: 3, payment: 3, workOrder: 4, report: 4 };

// ========== UI HELPERS ==========

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const colors = {
    success: "bg-emerald-600",
    error: "bg-rose-600",
    info: "bg-sky-600",
    warning: "bg-amber-500"
  };
  const toast = document.createElement("div");
  toast.className = `toast ${colors[type]} text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[280px]`;
  toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i><span class="text-sm font-medium">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function formatDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function statusBadge(status) {
  const map = {
    Available: "bg-emerald-100 text-emerald-800",
    Busy: "bg-amber-100 text-amber-800",
    Fault: "bg-rose-100 text-rose-800",
    Offline: "bg-slate-100 text-slate-600",
    Operational: "bg-emerald-100 text-emerald-800",
    Maintenance: "bg-amber-100 text-amber-800",
    Active: "bg-sky-100 text-sky-800",
    Completed: "bg-slate-100 text-slate-700",
    Confirmed: "bg-emerald-100 text-emerald-800",
    Pending: "bg-amber-100 text-amber-800",
    Cancelled: "bg-rose-100 text-rose-800",
    Open: "bg-rose-100 text-rose-800",
    "In Progress": "bg-amber-100 text-amber-800",
    Resolved: "bg-emerald-100 text-emerald-800",
    Captured: "bg-emerald-100 text-emerald-800",
    Refunded: "bg-slate-100 text-slate-600"
  };
  return `<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-slate-100 text-slate-600'}">${status}</span>`;
}

// ========== AUTH ==========

function togglePassword() {
  const input = document.getElementById("login-password");
  const icon = document.getElementById("password-toggle-icon");
  if (input.type === "password") {
    input.type = "text";
    icon.classList.replace("fa-eye", "fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.replace("fa-eye-slash", "fa-eye");
  }
}

function showLoginError(msg) {
  const box = document.getElementById("login-error");
  document.getElementById("login-error-text").textContent = msg;
  box.classList.remove("hidden");
}

function hideLoginError() {
  document.getElementById("login-error").classList.add("hidden");
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showAuthForm(formName) {
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("register-screen").classList.add("hidden");
  document.getElementById("forgot-password-screen").classList.add("hidden");
  document.getElementById("auth-forms").classList.remove("hidden");
  if (formName === "forgot-password") document.getElementById("forgot-password-screen").classList.remove("hidden");
}

function showRegisterScreen() {
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("auth-forms").classList.add("hidden");
  document.getElementById("forgot-password-screen").classList.add("hidden");
  document.getElementById("register-screen").classList.remove("hidden");
}

function showLoginScreen() {
  document.getElementById("register-screen").classList.add("hidden");
  document.getElementById("forgot-password-screen").classList.add("hidden");
  document.getElementById("auth-forms").classList.add("hidden");
  document.getElementById("login-screen").classList.remove("hidden");
}

async function handleForgotPassword(event) {
  event.preventDefault();
  const email = document.getElementById("forgot-password-email").value.trim();
  const password = document.getElementById("forgot-password-new-password").value;
  const confirmPassword = document.getElementById("forgot-password-confirm-password").value;
  const error = document.getElementById("forgot-password-error");
  const success = document.getElementById("forgot-password-success");
  if (!validEmail(email)) {
    error.textContent = "Enter a valid email address";
    error.classList.remove("hidden");
    return;
  }
  if (password.length < 12) {
    error.textContent = "Password must be at least 12 characters";
    error.classList.remove("hidden");
    return;
  }
  if (password !== confirmPassword) {
    error.textContent = "Passwords do not match";
    error.classList.remove("hidden");
    return;
  }
  try {
    const request = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const resetRequest = await request.json();
    if (!request.ok) throw new Error(resetRequest.error || "Unable to start password reset");
    const response = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token: resetRequest.token, password, confirmPassword })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to reset password");
    success.textContent = result.message;
    event.target.reset();
    error.textContent = "";
    error.classList.add("hidden");
  } catch (requestError) {
    error.textContent = requestError.message;
    error.classList.remove("hidden");
  }
}

async function submitApiForm(event, endpoint, formName) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.target).entries());
  const error = document.getElementById(`${formName}-error`) ||
    document.getElementById(`${formName}-password-error`) ||
    document.getElementById(`${formName}-email-error`);
  const success = document.getElementById(`${formName}-success`);
  if (values.email && !validEmail(values.email)) {
    if (error) error.textContent = "Enter a valid email address";
    return;
  }
  if (values.password !== undefined && values.password.length < 12) {
    if (error) error.textContent = "Password must be at least 12 characters";
    return;
  }
  if (values.password && values.confirmPassword && values.password !== values.confirmPassword) {
    if (error) error.textContent = "Passwords do not match";
    return;
  }
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const result = await response.json();
    if (!response.ok) {
      const fieldError = result.field && document.getElementById(`${formName}-${result.field}-error`);
      if (fieldError) fieldError.textContent = result.error;
      throw new Error(result.error || "Request failed");
    }
    if (success) success.textContent = result.message;
    if (error) error.textContent = "";
  } catch (requestError) {
    if (error) error.textContent = requestError.message;
  }
}

async function handleLogin(event) {
  if (event) event.preventDefault();
  hideLoginError();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const role = document.getElementById("login-role").value;

  if (!email || !validEmail(email)) {
    showLoginError("Please enter a valid email address");
    return;
  }
  if (!password) {
    showLoginError("Please enter your password");
    return;
  }

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Invalid credentials");
    const user = users[result.user.role];
    if (!user) throw new Error("The selected account role is not available in this client");
    user.userId = result.user.userId;
    user.name = result.user.name;
    user.email = result.user.email;
    user.password = password;
    user.phone = result.user.phone;
    user.assignedStationId = result.user.assignedStationId;
    user.assignedStationName = result.user.assignedStationName;
    loginAs(result.user.role);
  } catch (error) {
    showLoginError(error.message);
  }
}

function quickLogin(role) {
  hideLoginError();
  // Prefill the form so user sees the credentials
  const user = users[role];
  document.getElementById("login-email").value = user.email;
  document.getElementById("login-password").value = user.password;
  document.getElementById("login-role").value = role;
  loginAs(role);
}

function loginAs(role) {
  currentRole = role;
  currentUser = users[role];
  currentUser.login(); // real User.login()

  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  document.getElementById("user-name").textContent = currentUser.name;
  document.getElementById("user-role").textContent = role.replace(/([A-Z])/g, " $1").trim();
  document.getElementById("user-avatar").textContent = currentUser.name.split(" ").map(n => n[0]).join("");

  buildSidebar();
  navigate("dashboard");
  showToast(`Welcome, ${currentUser.name}!`, "success");
}

function handleLogout() {
  if (currentUser) currentUser.logout(); // real User.logout()
  currentUser = null;
  currentRole = null;
  document.getElementById("app").classList.add("hidden");
  document.getElementById("login-screen").classList.remove("hidden");
  hideLoginError();
  // Clear password field for security
  document.getElementById("login-password").value = "";
}

// ========== NAVIGATION ==========

const roleMenus = {
  EVDriver: [
    { id: "dashboard", icon: "fa-home", label: "Dashboard" },
    { id: "vehicles", icon: "fa-car", label: "My Vehicles" },
    { id: "stations", icon: "fa-charging-station", label: "Find Chargers" },
    { id: "reservations", icon: "fa-calendar-check", label: "Reservations" },
    { id: "sessions", icon: "fa-bolt", label: "Charging Sessions" },
    { id: "payments", icon: "fa-credit-card", label: "Payments" },
    { id: "subscription", icon: "fa-crown", label: "Subscription" },
    { id: "assistant", icon: "fa-robot", label: "Virtual Assistant" },
    { id: "profile", icon: "fa-user", label: "Profile Settings" }
  ],
  ChargingStationOperator: [
    { id: "dashboard", icon: "fa-home", label: "Dashboard" },
    { id: "stations", icon: "fa-charging-station", label: "Stations" },
    { id: "chargers", icon: "fa-plug", label: "Chargers" },
    { id: "sessions", icon: "fa-bolt", label: "Live Sessions" },
    { id: "tariffs", icon: "fa-tags", label: "Tariffs & Pricing" }
  ],
  MaintenanceEngineer: [
    { id: "dashboard", icon: "fa-home", label: "Dashboard" },
    { id: "workorders", icon: "fa-wrench", label: "Work Orders" },
    { id: "chargers", icon: "fa-plug", label: "Chargers" }
  ],
  FleetManager: [
    { id: "dashboard", icon: "fa-home", label: "Dashboard" },
    { id: "fleets", icon: "fa-truck", label: "Fleets" },
    { id: "vehicles", icon: "fa-car", label: "Vehicles" },
    { id: "analytics", icon: "fa-chart-bar", label: "Analytics" },
    { id: "subscription", icon: "fa-crown", label: "Fleet Subscription" }
  ],
  SystemAdministrator: [
    { id: "dashboard", icon: "fa-home", label: "Dashboard" },
    { id: "stations", icon: "fa-charging-station", label: "Stations" },
    { id: "chargers", icon: "fa-plug", label: "Chargers" },
    { id: "analytics", icon: "fa-chart-bar", label: "Analytics" },
    { id: "users", icon: "fa-users", label: "Users" },
    { id: "profile", icon: "fa-user", label: "Profile Settings" }
  ]
};

function buildSidebar() {
  const nav = document.getElementById("sidebar-nav");
  const menu = roleMenus[currentRole] || [];
  nav.innerHTML = menu.map(item => `
    <a href="#" onclick="navigate('${item.id}'); return false;" 
       class="sidebar-link flex items-center gap-3 px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition"
       data-page="${item.id}">
      <i class="fas ${item.icon} w-5 text-center"></i>
      ${item.label}
    </a>
  `).join("");
}

function navigate(page) {
  document.querySelectorAll(".sidebar-link").forEach(el => el.classList.remove("active"));
  const link = document.querySelector(`[data-page="${page}"]`);
  if (link) link.classList.add("active");

  const titles = {
    dashboard: ["Dashboard", "System overview"],
    vehicles: ["My Vehicles", "Manage registered vehicles"],
    stations: ["Charging Stations", "Find and reserve chargers"],
    chargers: ["Chargers", "Monitor charger status"],
    reservations: ["Reservations", "Your booking history"],
    sessions: ["Charging Sessions", "Active and past sessions"],
    payments: ["Payments", "Transaction history"],
    subscription: ["Subscription", "Manage your plan"],
    assistant: ["Virtual Assistant", "Get help from ChargeBot"],
    workorders: ["Work Orders", "Maintenance tasks"],
    fleets: ["Fleets", "Manage vehicle fleets"],
    analytics: ["Analytics", "Reports and insights"],
    tariffs: ["Tariffs & Pricing", "Configure charging rates"],
    users: ["Users", "System user management"],
    profile: ["Profile Settings", "Update your driver profile"]
  };

  document.getElementById("page-title").textContent = titles[page]?.[0] || page;
  document.getElementById("page-subtitle").textContent = titles[page]?.[1] || "";

  const content = document.getElementById("content-area");
  content.classList.remove("fade-in");
  void content.offsetWidth;
  content.classList.add("fade-in");

  const renderers = {
    dashboard: renderDashboard,
    vehicles: renderVehicles,
    stations: renderStations,
    chargers: renderChargers,
    reservations: renderReservations,
    sessions: renderSessions,
    payments: renderPayments,
    subscription: renderSubscription,
    assistant: renderAssistant,
    workorders: renderWorkOrders,
    fleets: renderFleets,
    analytics: renderAnalytics,
    tariffs: renderTariffs,
    users: renderUsers,
    profile: renderProfile
  };

  (renderers[page] || (() => content.innerHTML = "<p>Page not found</p>"))();
}

// ========== RENDERERS ==========

function renderDashboard() {
  const content = document.getElementById("content-area");
  const availableChargers = chargers.filter(c => c.status === "Available").length;
  const activeSessions = sessions.filter(s => s.status === "Active").length;
  const openOrders = workOrders.filter(w => w.status === "Open" || w.status === "In Progress").length;

  let roleSpecific = "";

  if (currentRole === "EVDriver") {
    roleSpecific = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div class="bg-white rounded-2xl p-6 border border-slate-100 card-hover">
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm text-slate-500">Loyalty Points</span>
            <i class="fas fa-star text-amber-400"></i>
          </div>
          <p class="text-3xl font-bold text-slate-800">${currentUser.loyaltyPoints}</p>
        </div>
        <div class="bg-white rounded-2xl p-6 border border-slate-100 card-hover">
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm text-slate-500">Active Reservations</span>
            <i class="fas fa-calendar text-primary-500"></i>
          </div>
          <p class="text-3xl font-bold text-slate-800">${reservations.filter(r => r.status !== "Cancelled").length}</p>
        </div>
        <div class="bg-white rounded-2xl p-6 border border-slate-100 card-hover">
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm text-slate-500">My Vehicles</span>
            <i class="fas fa-car text-sky-500"></i>
          </div>
          <p class="text-3xl font-bold text-slate-800">${vehicles.length}</p>
        </div>
      </div>
      <div class="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white mb-8">
        <h3 class="font-semibold text-lg mb-2">Quick Actions</h3>
        <div class="flex flex-wrap gap-3 mt-4">
          <button onclick="navigate('stations')" class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition">
            <i class="fas fa-search mr-2"></i>Find Charger
          </button>
          <button onclick="navigate('reservations')" class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition">
            <i class="fas fa-calendar-plus mr-2"></i>My Reservations
          </button>
          <button onclick="navigate('assistant')" class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition">
            <i class="fas fa-robot mr-2"></i>Ask ChargeBot
          </button>
        </div>
      </div>
    `;
  } else if (currentRole === "ChargingStationOperator") {
    roleSpecific = `
      <div class="bg-white rounded-2xl p-6 border border-slate-100 mb-8">
        <p class="text-sm text-slate-500 mb-1">Assigned Station:</p>
        <p class="text-xl font-semibold text-slate-800">${currentUser.assignedStationName || "Not assigned"}</p>
        <p class="text-sm text-slate-500">${currentUser.assignedStationId || "—"}</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div class="bg-white rounded-2xl p-6 border border-slate-100 card-hover">
          <p class="text-sm text-slate-500 mb-1">Available Chargers</p>
          <p class="text-3xl font-bold text-emerald-600">${availableChargers}</p>
        </div>
        <div class="bg-white rounded-2xl p-6 border border-slate-100 card-hover">
          <p class="text-sm text-slate-500 mb-1">Busy Chargers</p>
          <p class="text-3xl font-bold text-amber-600">${chargers.filter(c => c.status === "Busy").length}</p>
        </div>
        <div class="bg-white rounded-2xl p-6 border border-slate-100 card-hover">
          <p class="text-sm text-slate-500 mb-1">Faulty Chargers</p>
          <p class="text-3xl font-bold text-rose-600">${chargers.filter(c => c.status === "Fault").length}</p>
        </div>
      </div>
    `;
  } else if (currentRole === "MaintenanceEngineer") {
    roleSpecific = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div class="bg-white rounded-2xl p-6 border border-slate-100 card-hover">
          <p class="text-sm text-slate-500 mb-1">Open Work Orders</p>
          <p class="text-3xl font-bold text-rose-600">${openOrders}</p>
        </div>
        <div class="bg-white rounded-2xl p-6 border border-slate-100 card-hover">
          <p class="text-sm text-slate-500 mb-1">Resolved</p>
          <p class="text-3xl font-bold text-emerald-600">${workOrders.filter(w => w.status === "Resolved").length}</p>
        </div>
        <div class="bg-white rounded-2xl p-6 border border-slate-100 card-hover">
          <p class="text-sm text-slate-500 mb-1">Specialization</p>
          <p class="text-lg font-semibold text-slate-800">${currentUser.specialization}</p>
        </div>
      </div>
    `;
  } else if (currentRole === "FleetManager") {
    roleSpecific = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div class="bg-white rounded-2xl p-6 border border-slate-100 card-hover">
          <p class="text-sm text-slate-500 mb-1">Total Fleets</p>
          <p class="text-3xl font-bold text-slate-800">${fleets.length}</p>
        </div>
        <div class="bg-white rounded-2xl p-6 border border-slate-100 card-hover">
          <p class="text-sm text-slate-500 mb-1">Fleet Vehicles</p>
          <p class="text-3xl font-bold text-slate-800">${fleets.reduce((a, f) => a + f.vehicles.length, 0)}</p>
        </div>
        <div class="bg-white rounded-2xl p-6 border border-slate-100 card-hover">
          <p class="text-sm text-slate-500 mb-1">Analytics Reports</p>
          <p class="text-3xl font-bold text-slate-800">${analyticsReports.length}</p>
        </div>
      </div>
    `;
  } else if (currentRole === "SystemAdministrator") {
    roleSpecific = `
      <div class="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div class="bg-white rounded-2xl p-6 border border-slate-100 card-hover">
          <p class="text-sm text-slate-500 mb-1">Stations</p>
          <p class="text-3xl font-bold text-slate-800">${stations.length}</p>
        </div>
        <div class="bg-white rounded-2xl p-6 border border-slate-100 card-hover">
          <p class="text-sm text-slate-500 mb-1">Chargers</p>
          <p class="text-3xl font-bold text-slate-800">${chargers.length}</p>
        </div>
        <div class="bg-white rounded-2xl p-6 border border-slate-100 card-hover">
          <p class="text-sm text-slate-500 mb-1">Active Sessions</p>
          <p class="text-3xl font-bold text-slate-800">${activeSessions}</p>
        </div>
        <div class="bg-white rounded-2xl p-6 border border-slate-100 card-hover">
          <p class="text-sm text-slate-500 mb-1">Tariffs</p>
          <p class="text-3xl font-bold text-slate-800">${tariffs.length}</p>
        </div>
      </div>
    `;
  }

  content.innerHTML = `
    ${roleSpecific}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-semibold text-slate-800">Charger Status Overview</h3>
        </div>
        <div class="p-6">
          <div class="space-y-3">
            ${chargers.slice(0, 5).map(c => `
              <div class="flex items-center justify-between py-2">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <i class="fas fa-plug text-slate-500 text-sm"></i>
                  </div>
                  <div>
                    <p class="text-sm font-medium">Charger #${c.chargerId}</p>
                    <p class="text-xs text-slate-500">${c.chargerType} • ${c.capacityKW} kW</p>
                  </div>
                </div>
                ${statusBadge(c.status)}
              </div>
            `).join("")}
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100">
          <h3 class="font-semibold text-slate-800">Recent Activity</h3>
        </div>
        <div class="p-6 space-y-4">
          <div class="flex gap-3">
            <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <i class="fas fa-bolt text-emerald-600 text-xs"></i>
            </div>
            <div>
              <p class="text-sm font-medium">Session #${sessions[0].sessionId} active</p>
              <p class="text-xs text-slate-500">${sessions[0].energyConsumed} kWh consumed</p>
            </div>
          </div>
          <div class="flex gap-3">
            <div class="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
              <i class="fas fa-calendar text-sky-600 text-xs"></i>
            </div>
            <div>
              <p class="text-sm font-medium">Reservation #${reservations[0].reservationId} confirmed</p>
              <p class="text-xs text-slate-500">${formatDate(reservations[0].startTime)}</p>
            </div>
          </div>
          <div class="flex gap-3">
            <div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <i class="fas fa-wrench text-amber-600 text-xs"></i>
            </div>
            <div>
              <p class="text-sm font-medium">Work Order #${workOrders[0].workOrderId} open</p>
              <p class="text-xs text-slate-500">${workOrders[0].issueDescription.substring(0, 40)}...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderVehicles() {
  const content = document.getElementById("content-area");
  content.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <p class="text-sm text-slate-500">${vehicles.length} vehicles registered</p>
      ${currentRole === "EVDriver" ? `
        <button onclick="showToast('manageVehicle() called on EVDriver', 'info')" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition">
          <i class="fas fa-plus mr-2"></i>Add Vehicle
        </button>
      ` : ""}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      ${vehicles.map(v => `
        <div class="bg-white rounded-2xl border border-slate-100 p-6 card-hover">
          <div class="flex items-start justify-between mb-4">
            <div class="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center">
              <i class="fas fa-car text-sky-600 text-lg"></i>
            </div>
            <span class="text-xs font-medium text-slate-400">#${v.vehicleId}</span>
          </div>
          <h3 class="font-semibold text-slate-800">${v.make} ${v.model}</h3>
          <div class="mt-3 space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-slate-500">Connector</span><span class="font-medium">${v.connectorType}</span></div>
            <div class="flex justify-between"><span class="text-slate-500">Battery</span><span class="font-medium">${v.batteryCapacity} kWh</span></div>
            <div class="flex justify-between"><span class="text-slate-500">Compatible</span><span class="font-medium text-emerald-600">${v.checkCompatibility() ? "Yes" : "No"}</span></div>
          </div>
          <button onclick="vehicles.find(x=>x.vehicleId===${v.vehicleId}).updateDetails(); showToast('updateDetails() called', 'info')" 
                  class="mt-4 w-full py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition font-medium">
            Update Details
          </button>
        </div>
      `).join("")}
    </div>
  `;
}

function renderStations() {
  const content = document.getElementById("content-area");
  content.innerHTML = `
    <form id="charger-search-form" onsubmit="searchChargers(event)" class="bg-white rounded-2xl border border-slate-100 p-5 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <label class="text-sm">Start time<input id="search-start-time" name="startTime" type="datetime-local" required class="block w-full mt-1 p-2 border rounded-lg"></label>
        <label class="text-sm">End time<input id="search-end-time" name="endTime" type="datetime-local" required class="block w-full mt-1 p-2 border rounded-lg"></label>
        <button type="submit" class="py-2 bg-primary-600 text-white rounded-lg">Search chargers</button>
      </div>
      <p id="charger-search-error" class="text-rose-600 text-sm mt-2" role="alert"></p>
    </form>
    <div class="space-y-6">
      ${stations.map(s => `
        <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-slate-800">${s.name}</h3>
              <p class="text-sm text-slate-500"><i class="fas fa-map-marker-alt mr-1"></i>${s.location}</p>
            </div>
            <div class="flex items-center gap-3">
              ${statusBadge(s.status)}
              <span class="text-sm text-slate-500">${s.getAvailability()} / ${s.chargers.length} available</span>
            </div>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              ${s.chargers.map(c => `
                <div class="border border-slate-100 rounded-xl p-4 ${c.status === 'Available' ? 'hover:border-primary-300' : ''} transition">
                  <div class="flex items-center justify-between mb-3">
                    <span class="font-medium text-sm">Charger #${c.chargerId}</span>
                    ${statusBadge(c.status)}
                  </div>
                  <div class="text-xs text-slate-500 space-y-1 mb-3">
                    <p>${c.chargerType} • ${c.capacityKW} kW</p>
                    <p>Connector: ${c.connectorType}</p>
                  </div>
                  ${currentRole === "EVDriver" && c.status === "Available" ? `
                    <button onclick="createReservation(${c.chargerId}, '${s.name}')" 
                            class="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-medium transition">
                      Reserve Slot
                    </button>
                  ` : currentRole === "ChargingStationOperator" ? `
                    <button onclick="monitorCharger(${c.chargerId})" class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition">
                      Monitor Status
                    </button>
                  ` : ""}
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderChargers() {
  const content = document.getElementById("content-area");
  content.innerHTML = `
    ${currentRole === "ChargingStationOperator" ? `<form id="charger-form" onsubmit="createChargerDraft(event)" class="bg-white rounded-2xl border border-slate-100 p-5 mb-6">
      <h3 class="font-semibold mb-4">Add station / charger draft</h3>
      <p class="text-sm text-slate-500 mb-3">Assigned Station: <strong>${currentUser.assignedStationName || "Not assigned"}</strong> (${currentUser.assignedStationId || "—"})</p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input id="charger-id" name="chargerId" required placeholder="Charger ID" class="p-2 border rounded-lg">
        <input id="connector-type" name="connectorType" required placeholder="Connector type" class="p-2 border rounded-lg">
        <input id="capacity-kw" name="capacityKW" type="number" min="0.1" step="0.1" required placeholder="Capacity (kW)" class="p-2 border rounded-lg">
      </div>
      <button type="submit" class="mt-4 py-2 px-4 bg-primary-600 text-white rounded-lg">Save draft</button>
      <p id="charger-form-error" class="text-rose-600 text-sm mt-2" role="alert"></p>
      <p id="charger-form-success" class="text-emerald-600 text-sm mt-2" role="status"></p>
    </form>` : ""}
    <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-600">
            <tr>
              <th class="text-left px-6 py-3 font-medium">ID</th>
              <th class="text-left px-6 py-3 font-medium">Type</th>
              <th class="text-left px-6 py-3 font-medium">Connector</th>
              <th class="text-left px-6 py-3 font-medium">Capacity</th>
              <th class="text-left px-6 py-3 font-medium">Status</th>
              <th class="text-left px-6 py-3 font-medium">Last Heartbeat</th>
              <th class="text-left px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${chargers.map(c => `
              <tr class="hover:bg-slate-50">
                <td class="px-6 py-4 font-medium">#${c.chargerId}</td>
                <td class="px-6 py-4">${c.chargerType}</td>
                <td class="px-6 py-4">${c.connectorType}</td>
                <td class="px-6 py-4">${c.capacityKW} kW</td>
                <td class="px-6 py-4">${statusBadge(c.status)}</td>
                <td class="px-6 py-4 text-slate-500">${formatDate(c.lastHeartbeat)}</td>
                <td class="px-6 py-4">
                  <div class="flex gap-2">
                    ${c.status === "Available" ? `
                      <button onclick="startCharger(${c.chargerId})" class="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100">Start</button>
                    ` : c.status === "Busy" ? `
                      <button onclick="stopCharger(${c.chargerId})" class="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100">Stop</button>
                    ` : ""}
                    <button onclick="ocppService.receiveHeartbeat(); showToast('OCPP: Heartbeat received for Charger #${c.chargerId}', 'info')" 
                            class="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">Heartbeat</button>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderReservations() {
  const content = document.getElementById("content-area");
  if (currentUser?.userId && !reservationsLoading) loadReservationsFromDatabase();
  content.innerHTML = `
    <form id="reservation-form" onsubmit="createReservationFromForm(event)" class="bg-white rounded-2xl border border-slate-100 p-5 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <input name="chargerId" required placeholder="Charger ID" class="p-2 border rounded-lg">
        <input name="startTime" type="datetime-local" required class="p-2 border rounded-lg">
        <input name="endTime" type="datetime-local" required class="p-2 border rounded-lg">
      </div>
      <button type="submit" class="mt-4 py-2 px-4 bg-primary-600 text-white rounded-lg">Create reservation</button>
      <p id="reservation-form-error" class="text-rose-600 text-sm mt-2" role="alert"></p>
    </form>
    <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-600">
            <tr>
              <th class="text-left px-6 py-3 font-medium">ID</th>
              <th class="text-left px-6 py-3 font-medium">Station</th>
              <th class="text-left px-6 py-3 font-medium">Charger</th>
              <th class="text-left px-6 py-3 font-medium">Start</th>
              <th class="text-left px-6 py-3 font-medium">End</th>
              <th class="text-left px-6 py-3 font-medium">Est. Cost</th>
              <th class="text-left px-6 py-3 font-medium">Status</th>
              <th class="text-left px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${reservations.map(r => `
              <tr class="hover:bg-slate-50">
                <td class="px-6 py-4 font-medium">#${r.reservationId}</td>
                <td class="px-6 py-4">${r.stationName || "—"}</td>
                <td class="px-6 py-4">#${r.chargerId || "—"}</td>
                <td class="px-6 py-4">${formatDate(r.startTime)}</td>
                <td class="px-6 py-4">${formatDate(r.endTime)}</td>
                <td class="px-6 py-4">₹${r.estimatedCost}</td>
                <td class="px-6 py-4">${statusBadge(r.status)}</td>
                <td class="px-6 py-4">
                  ${r.status === "Pending" || r.status === "Confirmed" ? `
                    <button onclick="cancelReservation(${r.reservationId})" class="text-xs px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100">Cancel</button>
                    ${r.status === "Confirmed" ? `
                      <button onclick="startSessionFromReservation(${r.reservationId})" class="text-xs px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 ml-1">Start Charging</button>
                    ` : `
                      <button onclick="confirmReservation(${r.reservationId})" class="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 ml-1">Confirm</button>
                    `}
                  ` : "—"}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function loadReservationsFromDatabase() {
  reservationsLoading = true;
  const response = await fetch(`/api/reservations?userId=${encodeURIComponent(currentUser.userId)}`);
  if (response.ok) {
    const result = await response.json();
    const stored = result.reservations.map(item => ({ ...item, estimatedCost: item.estimatedCost || 0 }));
    const localOnly = reservations.filter(item => !stored.some(saved => saved.reservationId === item.reservationId));
    reservations = [...stored, ...localOnly];
    if (document.getElementById("reservation-form")) renderReservations();
  }
  reservationsLoading = false;
}

function renderSessions() {
  const content = document.getElementById("content-area");
  content.innerHTML = `
    <form id="start-session-form" onsubmit="startChargingSession(event)" class="bg-white rounded-2xl border border-slate-100 p-5 mb-6">
      <h3 class="font-semibold text-slate-800 mb-4">Start charging session</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input id="session-reservation-id" name="reservationId" type="number" min="1" required placeholder="Reservation ID" class="p-2 border rounded-lg">
        <input id="session-connector-type" name="connectorType" required placeholder="Connector type (e.g. CCS2)" class="p-2 border rounded-lg">
        <label class="flex items-center gap-2 text-sm"><input id="session-payment-authorized" name="paymentAuthorized" type="checkbox" required> Authorize payment gateway</label>
      </div>
      <button type="submit" class="mt-4 py-2 px-4 bg-primary-600 text-white rounded-lg">Start Charging Session</button>
      <p id="start-session-error" class="text-rose-600 text-sm mt-2" role="alert"></p>
      <p id="start-session-success" class="text-emerald-600 text-sm mt-2" role="status"></p>
    </form>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
      ${sessions.filter(s => s.status === "Active").map(s => `
        <div class="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <span class="text-primary-100 text-sm">Live Session #${s.sessionId}</span>
            <span class="px-2.5 py-0.5 bg-white/20 rounded-full text-xs font-medium">Active</span>
          </div>
          <p class="text-3xl font-bold mb-1">${s.energyConsumed} kWh</p>
          <p class="text-primary-100 text-sm mb-4">Charger #${s.chargerId} • Started ${formatDate(s.startTime)}</p>
          <button onclick="stopSession(${s.sessionId})" class="px-4 py-2 bg-white text-primary-700 rounded-xl text-sm font-semibold hover:bg-primary-50 transition">
            Stop Session
          </button>
        </div>
      `).join("")}
    </div>

    <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100">
        <h3 class="font-semibold">All Sessions</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-600">
            <tr>
              <th class="text-left px-6 py-3 font-medium">ID</th>
              <th class="text-left px-6 py-3 font-medium">Charger</th>
              <th class="text-left px-6 py-3 font-medium">Start</th>
              <th class="text-left px-6 py-3 font-medium">End</th>
              <th class="text-left px-6 py-3 font-medium">Energy</th>
              <th class="text-left px-6 py-3 font-medium">Cost</th>
              <th class="text-left px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${sessions.map(s => `
              <tr class="hover:bg-slate-50">
                <td class="px-6 py-4 font-medium">#${s.sessionId}</td>
                <td class="px-6 py-4">#${s.chargerId || "—"}</td>
                <td class="px-6 py-4">${formatDate(s.startTime)}</td>
                <td class="px-6 py-4">${formatDate(s.endTime)}</td>
                <td class="px-6 py-4">${s.energyConsumed} kWh</td>
                <td class="px-6 py-4">₹${s.calculateCost() || s.totalCost}</td>
                <td class="px-6 py-4">${statusBadge(s.status)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderPayments() {
  const content = document.getElementById("content-area");
  content.innerHTML = `
    <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-600">
            <tr>
              <th class="text-left px-6 py-3 font-medium">ID</th>
              <th class="text-left px-6 py-3 font-medium">Amount</th>
              <th class="text-left px-6 py-3 font-medium">Transaction ID</th>
              <th class="text-left px-6 py-3 font-medium">Status</th>
              <th class="text-left px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${payments.map(p => `
              <tr class="hover:bg-slate-50">
                <td class="px-6 py-4 font-medium">#${p.paymentId}</td>
                <td class="px-6 py-4 font-semibold">₹${p.amount}</td>
                <td class="px-6 py-4 text-slate-500 font-mono text-xs">${p.transactionId}</td>
                <td class="px-6 py-4">${statusBadge(p.paymentStatus)}</td>
                <td class="px-6 py-4">
                  ${p.paymentStatus === "Pending" ? `
                    <button onclick="capturePayment(${p.paymentId})" class="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100">Capture</button>
                  ` : p.paymentStatus === "Captured" ? `
                    <button onclick="refundPayment(${p.paymentId})" class="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">Refund</button>
                  ` : "—"}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderSubscription() {
  const content = document.getElementById("content-area");
  const mySub = subscriptions[0];
  const plan = subscriptionPlans.find(p => p.planId === mySub?.planId);

  content.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1">
        <div class="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
          <p class="text-primary-200 text-sm mb-1">Current Plan</p>
          <h3 class="text-2xl font-bold mb-4">${plan ? plan.planName : "None"}</h3>
          ${plan ? `
            <p class="text-3xl font-bold mb-1">₹${plan.price}<span class="text-base font-normal text-primary-200">/${plan.billingCycle.toLowerCase()}</span></p>
            <p class="text-sm text-primary-200 mb-6">Status: ${mySub.status}</p>
            <div class="flex gap-2">
              <button onclick="subscriptions[0].upgrade(); showToast('upgrade() called', 'info')" class="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition">Upgrade</button>
              <button onclick="subscriptions[0].cancel(); showToast('Subscription cancelled', 'warning'); navigate('subscription')" class="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition">Cancel</button>
            </div>
          ` : ""}
        </div>
      </div>
      <div class="lg:col-span-2">
        <h3 class="font-semibold text-slate-800 mb-4">Available Plans</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${subscriptionPlans.map(p => `
            <div class="bg-white rounded-2xl border ${plan?.planId === p.planId ? 'border-primary-400 ring-2 ring-primary-100' : 'border-slate-100'} p-5 card-hover">
              <h4 class="font-semibold text-slate-800">${p.planName}</h4>
              <p class="text-2xl font-bold text-slate-800 mt-2">₹${p.price}</p>
              <p class="text-xs text-slate-500 mb-4">per ${p.billingCycle.toLowerCase()}</p>
              <p class="text-xs text-slate-500 mb-3">Discount: ${p.calculateDiscount()}%</p>
              ${plan?.planId !== p.planId ? `
                <button onclick="showToast('subscribe() called for ${p.planName}', 'success')" class="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition">
                  Subscribe
                </button>
              ` : `<p class="text-center text-sm text-primary-600 font-medium">Current Plan</p>`}
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderAssistant() {
  const content = document.getElementById("content-area");
  content.innerHTML = `
    <div class="max-w-2xl mx-auto">
      <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div class="px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <i class="fas fa-robot"></i>
          </div>
          <div>
            <h3 class="font-semibold">${virtualAssistant.name}</h3>
            <p class="text-xs text-primary-100">Virtual Assistant • Always online</p>
          </div>
        </div>
        <div id="chat-messages" class="p-6 h-80 overflow-y-auto space-y-4">
          <div class="flex gap-3">
            <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <i class="fas fa-robot text-primary-600 text-xs"></i>
            </div>
            <div class="bg-slate-100 rounded-2xl rounded-tl-none px-4 py-2.5 text-sm max-w-[80%]">
              Hello! I'm ${virtualAssistant.name}. I can help you with booking a charger, troubleshooting issues, or answering questions about the system.
            </div>
          </div>
        </div>
        <div class="p-4 border-t border-slate-100">
          <div class="flex gap-2 mb-3">
            <button onclick="assistantAction('booking')" class="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-100 transition">Help with Booking</button>
            <button onclick="assistantAction('troubleshoot')" class="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100 transition">Troubleshoot</button>
            <button onclick="assistantAction('escalate')" class="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200 transition">Escalate Support</button>
          </div>
          <div class="flex gap-2">
            <input id="chat-input" type="text" placeholder="Type your message..." 
                   class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                   onkeydown="if(event.key==='Enter') sendChat()" />
            <button onclick="sendChat()" class="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderWorkOrders() {
  const content = document.getElementById("content-area");
  content.innerHTML = `
    <div class="flex justify-end mb-4">
      <button onclick="createWorkOrder()" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition">
        <i class="fas fa-plus mr-2"></i>Create Work Order
      </button>
    </div>
    <div class="space-y-4">
      ${workOrders.map(w => `
        <div class="bg-white rounded-2xl border border-slate-100 p-6 card-hover">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <span class="font-semibold text-slate-800">Work Order #${w.workOrderId}</span>
                ${statusBadge(w.status)}
              </div>
              <p class="text-sm text-slate-600 mb-2">${w.issueDescription}</p>
              ${w.resolutionNotes ? `<p class="text-xs text-slate-500"><i class="fas fa-sticky-note mr-1"></i>${w.resolutionNotes}</p>` : ""}
              ${w.chargerId ? `<p class="text-xs text-slate-400 mt-1">Charger #${w.chargerId}</p>` : ""}
            </div>
            <div class="flex gap-2">
              ${w.status !== "Resolved" ? `
                <button onclick="updateWorkOrder(${w.workOrderId}, 'In Progress')" class="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100">In Progress</button>
                <button onclick="updateWorkOrder(${w.workOrderId}, 'Resolved')" class="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100">Resolve</button>
              ` : ""}
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderFleets() {
  const content = document.getElementById("content-area");
  content.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      ${fleets.map(f => `
        <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-slate-800">${f.fleetName}</h3>
              <p class="text-xs text-slate-500">Fleet #${f.fleetId} • ${f.vehicles.length} vehicles</p>
            </div>
            <button onclick="f.viewUsage(); showToast('viewUsage() called for ${f.fleetName}', 'info')" class="text-xs px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
              View Usage
            </button>
          </div>
          <div class="p-4 space-y-2">
            ${f.vehicles.map(v => `
              <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <i class="fas fa-car text-slate-400"></i>
                <div>
                  <p class="text-sm font-medium">${v.make} ${v.model}</p>
                  <p class="text-xs text-slate-500">${v.connectorType} • ${v.batteryCapacity} kWh</p>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderAnalytics() {
  const content = document.getElementById("content-area");
  content.innerHTML = `
    <div class="flex justify-end mb-4">
      <button onclick="generateReport()" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition">
        <i class="fas fa-plus mr-2"></i>Generate Report
      </button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      ${analyticsReports.map(r => `
        <div class="bg-white rounded-2xl border border-slate-100 p-6 card-hover">
          <div class="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center mb-4">
            <i class="fas fa-chart-bar text-sky-600"></i>
          </div>
          <h3 class="font-semibold text-slate-800 mb-1">${r.reportType}</h3>
          <p class="text-xs text-slate-500 mb-4">Generated: ${formatDate(r.generatedDate)}</p>
          <div class="flex gap-2">
            <button onclick="r.exportCSV(); showToast('exportCSV() called', 'info')" class="text-xs px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">CSV</button>
            <button onclick="r.exportPDF(); showToast('exportPDF() called', 'info')" class="text-xs px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">PDF</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderTariffs() {
  const content = document.getElementById("content-area");
  content.innerHTML = `
    ${currentRole === "ChargingStationOperator" ? `<form id="tariff-form" onsubmit="createTariff(event)" class="bg-white rounded-2xl border border-slate-100 p-5 mb-6">
      <h3 class="font-semibold mb-3">Configure assigned-station tariff</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input name="ratePerKWh" type="number" min="0" step="0.01" required placeholder="Rate per kWh" class="p-2 border rounded-lg">
        <input name="fixedCharge" type="number" min="0" step="0.01" required placeholder="Fixed charge" class="p-2 border rounded-lg">
        <button type="submit" class="py-2 bg-primary-600 text-white rounded-lg">Save tariff</button>
      </div>
      <p id="tariff-form-error" class="text-rose-600 text-sm mt-2" role="alert"></p>
      <p id="tariff-form-success" class="text-emerald-600 text-sm mt-2" role="status"></p>
    </form>` : ""}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      ${tariffs.map((t, i) => `
        <div class="bg-white rounded-2xl border border-slate-100 p-6 card-hover">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-slate-800">Tariff #${t.tariffId}</h3>
            <span class="text-xs text-slate-400">${stations[i]?.name || ""}</span>
          </div>
          <div class="space-y-3 text-sm mb-4">
            <div class="flex justify-between">
              <span class="text-slate-500">Rate per kWh</span>
              <span class="font-semibold">₹${t.ratePerKWh}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Fixed Charge</span>
              <span class="font-semibold">₹${t.fixedCharge}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Sample (20 kWh)</span>
              <span class="font-semibold text-primary-600">₹${t.calculateCost(20).toFixed(0)}</span>
            </div>
          </div>
          ${currentRole === "SystemAdministrator" ? `<p class="text-xs text-slate-500">Tariff changes are restricted to station operators.</p>` : ""}
        </div>
      `).join("")}
    </div>
  `;
}

function renderUsers() {
  const content = document.getElementById("content-area");
  content.innerHTML = `
    <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-600">
            <tr>
              <th class="text-left px-6 py-3 font-medium">ID</th>
              <th class="text-left px-6 py-3 font-medium">Name</th>
              <th class="text-left px-6 py-3 font-medium">Email</th>
              <th class="text-left px-6 py-3 font-medium">Role</th>
              <th class="text-left px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${Object.entries(users).map(([role, u]) => `
              <tr class="hover:bg-slate-50">
                <td class="px-6 py-4 font-medium">#${u.userId}</td>
                <td class="px-6 py-4">${u.name}</td>
                <td class="px-6 py-4 text-slate-500">${u.email}</td>
                <td class="px-6 py-4"><span class="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">${role}</span></td>
                <td class="px-6 py-4">${statusBadge(u.accountStatus)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderProfile() {
  const content = document.getElementById("content-area");
  content.innerHTML = `
    <div class="max-w-xl space-y-6">
    <form id="profile-form" onsubmit="saveProfile(event)" class="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
      <label class="block text-sm font-medium">Name<input id="profile-name" name="name" required value="${currentUser?.name || ""}" class="block w-full mt-1 p-2 border rounded-lg"></label>
      <label class="block text-sm font-medium">Phone<input id="profile-phone" name="phone" type="tel" value="${currentUser?.phone || ""}" class="block w-full mt-1 p-2 border rounded-lg"></label>
      <button type="submit" class="py-2 px-4 bg-primary-600 text-white rounded-lg">Save profile</button>
      <p id="profile-error" class="text-rose-600 text-sm" role="alert"></p>
      <p id="profile-success" class="text-emerald-600 text-sm" role="status"></p>
    </form>
    <form id="profile-password-form" onsubmit="changeProfilePassword(event)" class="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
      <h3 class="font-semibold text-slate-800">Reset Password</h3>
      <label class="block text-sm font-medium">Current password<input id="profile-current-password" name="currentPassword" type="password" required class="block w-full mt-1 p-2 border rounded-lg"></label>
      <label class="block text-sm font-medium">New Password<input id="profile-new-password" name="newPassword" type="password" minlength="12" required class="block w-full mt-1 p-2 border rounded-lg"></label>
      <label class="block text-sm font-medium">Confirm New Password<input id="profile-confirm-password" name="confirmPassword" type="password" minlength="12" required class="block w-full mt-1 p-2 border rounded-lg"></label>
      <button type="submit" class="py-2 px-4 bg-primary-600 text-white rounded-lg">Update password</button>
      <p id="profile-password-error" class="text-rose-600 text-sm" role="alert"></p>
      <p id="profile-password-success" class="text-emerald-600 text-sm" role="status"></p>
    </form>
    </div>
  `;
}

async function saveProfile(event) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.target).entries());
  const response = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...values, userId: currentUser?.userId })
  });
  const result = await response.json();
  const message = document.getElementById(response.ok ? "profile-success" : "profile-error");
  message.textContent = result.message || result.error;
  if (response.ok) currentUser.name = values.name;
}

async function changeProfilePassword(event) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.target).entries());
  const error = document.getElementById("profile-password-error");
  const success = document.getElementById("profile-password-success");
  if (values.newPassword.length < 12) {
    error.textContent = "Password must be at least 12 characters";
    return;
  }
  if (values.newPassword !== values.confirmPassword) {
    error.textContent = "Passwords do not match";
    return;
  }
  const response = await fetch("/api/profile/password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...values, userId: currentUser?.userId })
  });
  const result = await response.json();
  if (!response.ok) error.textContent = result.error;
  else {
    success.textContent = result.message;
    event.target.reset();
  }
}

async function createChargerDraft(event) {
  event.preventDefault();
  const form = event.target;
  const response = await fetch("/api/chargers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...Object.fromEntries(new FormData(form).entries()),
      userId: currentUser?.userId,
      role: currentRole
    })
  });
  const result = await response.json();
  document.getElementById(response.ok ? "charger-form-success" : "charger-form-error").textContent =
    response.ok ? `Draft created (${result.status})` : result.error;
  if (response.ok) {
    const values = Object.fromEntries(new FormData(form).entries());
    const newCharger = new Charger(result.chargerId, values.connectorType, "Draft", Number(values.capacityKW), "Available");
    chargers.push(newCharger);
    const assignedStation = stations.find(station =>
      String(station.stationId) === String(result.stationId) ||
      `ST-${station.stationId}` === String(result.stationId)
    );
    if (assignedStation) assignedStation.addCharger(newCharger);
    form.reset();
    renderChargers();
  }
}

async function createReservationFromForm(event) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.target).entries());
  const error = document.getElementById("reservation-form-error");
  if (new Date(values.endTime) <= new Date(values.startTime)) {
    error.textContent = "End time must be after start time";
    return;
  }
  const response = await fetch("/api/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...values, userId: currentUser?.userId })
  });
  const result = await response.json();
  if (!response.ok) error.textContent = result.error;
  else {
    reservations.unshift({
      reservationId: result.reservationId,
      chargerId: result.chargerId,
      stationName: result.stationName,
      startTime: result.startTime,
      endTime: result.endTime,
      status: result.status,
      estimatedCost: 0,
      driverId: currentUser?.driverId
    });
    navigate("reservations");
  }
}

async function createTariff(event) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.target).entries());
  const response = await fetch("/api/tariffs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...values, role: currentRole, stationId: currentUser?.assignedStationId })
  });
  const result = await response.json();
  const target = document.getElementById(response.ok ? "tariff-form-success" : "tariff-form-error");
  target.textContent = response.ok ? "Tariff saved successfully" : result.error;
  if (response.ok) event.target.reset();
}

async function searchChargers(event) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.target).entries());
  const error = document.getElementById("charger-search-error");
  if (!values.startTime || !values.endTime) {
    error.textContent = "Start and end time are required";
    return;
  }
  if (new Date(values.endTime) <= new Date(values.startTime)) {
    error.textContent = "End time must be after start time";
    return;
  }
  const response = await fetch(`/api/chargers/search?startTime=${encodeURIComponent(values.startTime)}&endTime=${encodeURIComponent(values.endTime)}`);
  const result = await response.json();
  if (!response.ok) error.textContent = result.error;
  else showToast(`${result.chargers.length} chargers found`, "success");
}

if (["/register", "/forgot-password", "/reset-password"].includes(window.location.pathname)) {
  if (window.location.pathname === "/register") showRegisterScreen();
  else showAuthForm("forgot-password");
}

// ========== ACTIONS (calling exact class methods) ==========

function createReservation(chargerId, stationName) {
  const res = currentUser.reserveSlot(); // EVDriver.reserveSlot()
  res.reservationId = nextId.reservation++;
  res.startTime = new Date(Date.now() + 3600000);
  res.endTime = new Date(Date.now() + 7200000);
  res.status = "Pending";
  res.gracePeriod = 15;
  res.estimatedCost = 350 + Math.floor(Math.random() * 200);
  res.chargerId = chargerId;
  res.stationName = stationName;
  res.driverId = currentUser.driverId;
  res.createReservation();
  reservations.unshift(res);
  showToast(`Reservation #${res.reservationId} created for Charger #${chargerId}`, "success");
  navigate("reservations");
}

function confirmReservation(id) {
  const r = reservations.find(x => x.reservationId === id);
  if (r) {
    r.confirmReservation();
    r.status = "Confirmed";
    showToast(`Reservation #${id} confirmed`, "success");
    navigate("reservations");
  }
}

function cancelReservation(id) {
  const r = reservations.find(x => x.reservationId === id);
  if (r) {
    r.cancelReservation();
    r.status = "Cancelled";
    showToast(`Reservation #${id} cancelled`, "warning");
    navigate("reservations");
  }
}

function startSessionFromReservation(resId) {
  const r = reservations.find(x => x.reservationId === resId);
  if (!r) return;

  const session = currentUser.startCharging(); // EVDriver.startCharging()
  session.sessionId = nextId.session++;
  session.startTime = new Date();
  session.status = "Active";
  session.energyConsumed = 0;
  session.chargerId = r.chargerId;
  session.driverId = currentUser.driverId;
  session.startSession();

  const charger = chargers.find(c => c.chargerId === r.chargerId);
  if (charger) {
    charger.startCharging();
    ocppService.sendStartCommand();
  }

  sessions.unshift(session);
  showToast(`Charging session #${session.sessionId} started`, "success");
  navigate("sessions");
}

async function startChargingSession(event) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.target).entries());
  const error = document.getElementById("start-session-error");
  const success = document.getElementById("start-session-success");
  const reservationId = Number(values.reservationId);
  const reservation = reservations.find(item => item.reservationId === reservationId);
  if (!reservation || !["Pending", "Confirmed"].includes(reservation.status)) {
    error.textContent = "Enter a valid pending or confirmed reservation ID";
    return;
  }
  if (reservation.status === "Pending") {
    error.textContent = "Confirm the reservation before starting charging";
    return;
  }
  if (!paymentGateway.authorizePayment()) {
    error.textContent = "Payment authorization failed";
    return;
  }
  try {
    const response = await fetch("/api/sessions/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reservationId,
        connectorType: values.connectorType,
        paymentAuthorized: true,
        userId: currentUser?.userId || null
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to start charging session");
    startSessionFromReservation(reservationId);
    success.textContent = `Session #${result.sessionId} started and payment authorized`;
  } catch (requestError) {
    error.textContent = requestError.message;
  }
}

function stopSession(id) {
  const s = sessions.find(x => x.sessionId === id);
  if (!s) return;

  s.stopSession();
  s.energyConsumed = +(s.energyConsumed + Math.random() * 15).toFixed(1);
  s.totalCost = Math.round(s.energyConsumed * 18.5 + 50);

  const charger = chargers.find(c => c.chargerId === s.chargerId);
  if (charger) {
    charger.stopCharging();
    ocppService.sendStopCommand();
  }

  // Create payment
  const payment = currentUser.makePayment(); // EVDriver.makePayment()
  payment.paymentId = nextId.payment++;
  payment.amount = s.totalCost;
  payment.paymentStatus = "Pending";
  payment.transactionId = `TXN-2024-${Math.floor(10000 + Math.random() * 90000)}`;
  payment.preAuthorize();
  payments.unshift(payment);

  showToast(`Session stopped. Payment of ₹${s.totalCost} created.`, "success");
  navigate("sessions");
}

function startCharger(id) {
  const c = chargers.find(x => x.chargerId === id);
  if (c) {
    c.startCharging();
    ocppService.sendStartCommand();
    showToast(`Charger #${id} started via OCPP`, "success");
    navigate("chargers");
  }
}

function stopCharger(id) {
  const c = chargers.find(x => x.chargerId === id);
  if (c) {
    c.stopCharging();
    ocppService.sendStopCommand();
    showToast(`Charger #${id} stopped via OCPP`, "success");
    navigate("chargers");
  }
}

function monitorCharger(id) {
  currentUser.monitorChargerStatus(); // ChargingStationOperator method
  const c = chargers.find(x => x.chargerId === id);
  showToast(`Monitoring Charger #${id}: Status = ${c.status}`, "info");
}

function capturePayment(id) {
  const p = payments.find(x => x.paymentId === id);
  if (p) {
    p.capturePayment();
    paymentGateway.capturePayment();
    showToast(`Payment #${id} captured via PaymentGateway`, "success");
    navigate("payments");
  }
}

function refundPayment(id) {
  const p = payments.find(x => x.paymentId === id);
  if (p) {
    p.refund();
    paymentGateway.refundPayment();
    showToast(`Payment #${id} refunded`, "info");
    navigate("payments");
  }
}

function createWorkOrder() {
  const wo = new MaintenanceWorkOrder(nextId.workOrder++, "New issue reported by operator", "Open");
  wo.createWorkOrder();
  workOrders.unshift(wo);
  showToast(`Work Order #${wo.workOrderId} created`, "success");
  navigate("workorders");
}

function updateWorkOrder(id, status) {
  const wo = workOrders.find(x => x.workOrderId === id);
  if (wo) {
    wo.updateStatus(status);
    if (status === "Resolved") {
      wo.resolutionNotes = "Issue resolved by engineer";
      currentUser.scheduleVisit();
    }
    showToast(`Work Order #${id} → ${status}`, "success");
    navigate("workorders");
  }
}

function generateReport() {
  const report = currentUser.viewAnalytics(); // FleetManager / SystemAdministrator
  report.reportId = nextId.report++;
  report.reportType = "Custom Report " + new Date().toLocaleDateString();
  report.generateReport();
  analyticsReports.unshift(report);
  showToast(`Analytics Report #${report.reportId} generated`, "success");
  navigate("analytics");
}

function updateTariff(id) {
  if (currentRole !== "ChargingStationOperator") {
    showToast("Only assigned station operators can update tariffs", "error");
    return;
  }
  const t = tariffs.find(x => x.tariffId === id);
  if (t) {
    const newRate = +(t.ratePerKWh + (Math.random() * 2 - 1)).toFixed(1);
    t.updateRate(newRate);
    showToast(`Tariff #${id} rate updated to ₹${newRate}/kWh`, "success");
    navigate("tariffs");
  }
}

function assistantAction(type) {
  const chat = document.getElementById("chat-messages");
  let msg = "";
  if (type === "booking") {
    virtualAssistant.assistBooking();
    msg = "I can help you book a charger! Looking at available slots... Charger #1 at BKC Hub (60 kW CCS2) is available. Would you like me to reserve it?";
  } else if (type === "troubleshoot") {
    virtualAssistant.troubleshoot();
    msg = "Let's troubleshoot. Common issues: 1) Connector not seating properly 2) Payment authorization failed 3) Charger offline. Which one are you facing?";
  } else {
    virtualAssistant.escalateSupport();
    msg = "I've escalated your request to a human support agent. Ticket #SUP-" + Math.floor(1000 + Math.random() * 9000) + " has been created. You'll receive a call shortly.";
  }
  chat.innerHTML += `
    <div class="flex gap-3">
      <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
        <i class="fas fa-robot text-primary-600 text-xs"></i>
      </div>
      <div class="bg-slate-100 rounded-2xl rounded-tl-none px-4 py-2.5 text-sm max-w-[80%]">${msg}</div>
    </div>
  `;
  chat.scrollTop = chat.scrollHeight;
}

function sendChat() {
  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (!text) return;

  const chat = document.getElementById("chat-messages");
  chat.innerHTML += `
    <div class="flex gap-3 justify-end">
      <div class="bg-primary-600 text-white rounded-2xl rounded-tr-none px-4 py-2.5 text-sm max-w-[80%]">${text}</div>
    </div>
  `;

  virtualAssistant.interpretRequest();
  setTimeout(() => {
    chat.innerHTML += `
      <div class="flex gap-3">
        <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <i class="fas fa-robot text-primary-600 text-xs"></i>
        </div>
        <div class="bg-slate-100 rounded-2xl rounded-tl-none px-4 py-2.5 text-sm max-w-[80%]">
          I understood your request about "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}". ${virtualAssistant.name} is processing it. Use the quick actions above for common tasks!
        </div>
      </div>
    `;
    chat.scrollTop = chat.scrollHeight;
  }, 600);

  input.value = "";
  chat.scrollTop = chat.scrollHeight;
}
