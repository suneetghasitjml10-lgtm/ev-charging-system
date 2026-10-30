# EV ChargeHub — Charging Station Management System

**Team**

- Vedansh Gholba — UID 2024300065
- Suneet Ghanshani — UID 2024300063  
  T.E. Computer Engineering – A

---

## Overview

This is a fully interactive web application for managing EV charging stations, drivers, reservations, sessions, tariffs, and maintenance.

The system supports multiple user roles, charger management via OCPP, digital payments, reservations, charging sessions, fleets, maintenance work orders, tariffs, analytics, and a virtual assistant.

---

## Classes & Interfaces (Exact Match)

### User Hierarchy (Generalization)

| Class                     | Methods                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| `User` (abstract)         | `login()`, `logout()`, `verifyCredentials()`                                                   |
| `EVDriver`                | `reserveSlot()`, `startCharging()`, `makePayment()`, `manageVehicle()`, `manageSubscription()` |
| `ChargingStationOperator` | `monitorChargerStatus()`                                                                       |
| `MaintenanceEngineer`     | `manageMaintenanceAlerts()`, `scheduleVisit()`                                                 |
| `FleetManager`            | `manageFleetSubscription()`, `viewAnalytics()`                                                 |
| `SystemAdministrator`     | `configureStation()`, `configurePricing()`, `viewAnalytics()`                                  |

### Core Entities

| Class                  | Key Methods                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| `Vehicle`              | `updateDetails()`, `checkCompatibility()`                                                   |
| `Reservation`          | `createReservation()`, `cancelReservation()`, `confirmReservation()`, `expireReservation()` |
| `Charger`              | `checkAvailability()`, `startCharging()`, `stopCharging()`, `updateStatus()`                |
| `ChargingStation`      | `addCharger()`, `removeCharger()`, `getAvailability()`                                      |
| `ChargingSession`      | `startSession()`, `stopSession()`, `calculateCost()`                                        |
| `Payment`              | `preAuthorize()`, `capturePayment()`, `refund()`, `generateReceipt()`                       |
| `SubscriptionPlan`     | `calculateDiscount()`, `getPlanDetails()`                                                   |
| `Subscription`         | `subscribe()`, `upgrade()`, `downgrade()`, `cancel()`                                       |
| `Fleet`                | `addVehicle()`, `removeVehicle()`, `viewUsage()`                                            |
| `MaintenanceWorkOrder` | `createWorkOrder()`, `updateStatus()`, `scheduleVisit()`                                    |
| `Tariff`               | `calculateCost()`, `updateRate()`                                                           |
| `AnalyticsReport`      | `generateReport()`, `exportCSV()`, `exportPDF()`                                            |
| `VirtualAssistant`     | `interpretRequest()`, `assistBooking()`, `troubleshoot()`, `escalateSupport()`              |

### Interfaces

| Interface        | Methods                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| `PaymentGateway` | `authorizePayment()`, `capturePayment()`, `refundPayment()`                                            |
| `OCPPService`    | `sendStartCommand()`, `sendStopCommand()`, `receiveHeartbeat()`, `receiveTelemetry()`, `reportFault()` |

---

## How to Run

1. Install Node.js 18 or newer.
2. Install dependencies and start the Express server:

```bash
npm install
npm start
```

Open `http://localhost:3000`. The server creates the lightweight `ev-csms.sqlite`
database automatically. Set `DB_FILE` to use another database path.

The frontend remains usable as a static page, but registration, profile, charger
draft, reservation, search, password, and tariff APIs require the server.

```bash
# Run the focused API/unit scenarios
npm test
```

---

## Pre-configured test credentials

The API seeds these accounts on every startup when the SQLite database is initialized.

| Role | Email | Password |
| --- | --- | --- |
| EV Driver | `driver@example.com` | `DriverTest!2026` |
| Charging Station Operator | `operator@example.com` | `OperatorTest!2026` |
| Maintenance Engineer | `engineer@example.com` | `EngineerTest!2026` |
| Fleet Manager | `manager@example.com` | `ManagerTest!2026` |
| System Administrator | `admin@example.com` | `AdminTest!2026` |

Select the matching role in the login form. The role is checked against the
account stored in SQLite; an email/password pair cannot sign in under another role.

## SQLite database inspection

The database file is `ev-csms.sqlite` in the project root. Stop the server before
copying it, then inspect it with the SQLite CLI:

```bash
sqlite3 ev-csms.sqlite
.tables
.schema Users
SELECT * FROM Users;
SELECT * FROM Stations;
SELECT * FROM Chargers;
SELECT * FROM Reservations;
SELECT * FROM ChargingSessions;
.quit
```

The table names are `Users`, `Stations`, `Chargers`, `Reservations`,
`ChargingSessions`, `Tariffs`, and `MaintenanceWorkOrders`. Alternatively, install
a VS Code SQLite Viewer extension and open `ev-csms.sqlite` directly.

Password reset is available directly in the Forgot Password view. Enter an
account email, New Password, and Confirm New Password; token handling is kept
internal to the flow. Logged-in users can change their password from Profile Settings;
the current password is required before the new 12-character password is saved.

## Test scenarios and role mapping

`npm test` verifies these ten unit/integration scenarios. R cases cover
user/reservation flows; C cases cover charger/session flows.

| ID | Role | Page/API and input data | Expected outcome |
| ---: | --- | --- | --- |
| R01 | EV Driver | `/register`; password `short` | Fail: HTTP 400 and inline minimum-12-character error. |
| R02 | EV Driver | `/register`; valid name/email/password and role | Pass: HTTP 201 and selected role is stored. |
| R03 | All roles | `/login`; matching seeded email/password/role | Pass: HTTP 200; mismatched role fails with HTTP 401. |
| R04 | EV Driver | `/forgot-password` and `/reset-password`; malformed email/short password | Fail: HTTP 400 with field-specific error. |
| R05 | EV Driver | `/profile`; updated name and phone | Pass: HTTP 200 and confirmation. |
| C01 | Station Operator | `/chargers`; station, charger, connector `CCS2`, capacity `60` | Pass: HTTP 201 with `DRAFT` status. |
| C02 | System Administrator | `/tariffs`; rate `18.5`, fixed charge `50`, energy `20` | Pass: stored tariff and cost `420`. |
| C03 | EV Driver | `/reservations`; valid reservation interval | Pass: HTTP 201; reversed interval fails HTTP 400. |
| C04 | EV Driver | `/chargers/search`; missing end time | Fail: HTTP 400 with required end-time error. |
| C05 | EV Driver | `/sessions`; confirmed reservation ID, connector `CCS2`, payment authorization checked | Pass: payment gateway is triggered and HTTP 201 active session; invalid reservation fails. |

---

## Project Structure

```
ev-charging-system/
├── index.html      # Login page, route forms, and main app shell
├── classes.js      # Exact class implementations from the Class Diagram
├── app.js          # Application logic, sample data, UI rendering
├── server.js       # Express API and SQLite schema/routes
├── test/api.test.js # Validation, draft, cost, and interval scenarios
└── README.md
```

---

## Features by Role

- **EV Driver** — Manage vehicles, find & reserve chargers, start sessions, payments, subscription, Virtual Assistant
- **Station Operator** — Monitor charger status, view live sessions
- **Maintenance Engineer** — Create & update work orders, view charger health
- **Fleet Manager** — Manage fleets & vehicles, view analytics
- **System Administrator** — Configure stations, tariffs/pricing, users, analytics

All interactive buttons call the **real class methods** defined in `classes.js`.

---

## Relationships Implemented

- Generalization: all roles extend `User`
- Composition: `ChargingStation` contains `Charger`s
- Associations: Driver ↔ Vehicle, Reservation, Session, Payment, Subscription
- Interfaces: `Payment` ↔ `PaymentGateway`, `Charger` ↔ `OCPPService`

---

## Tech Stack

- HTML5 + Tailwind CSS (CDN)
- Vanilla JavaScript (ES6 classes)
- Font Awesome icons
- Node.js, Express, and SQLite backend

---

_Built for EV charging station operations and testing._
