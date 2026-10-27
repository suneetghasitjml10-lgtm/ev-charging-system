# EV ChargeHub — Charging Station Management System

**SE Experiment-3 (Batch-A/A4)**  
Class Diagram Implementation for an Electric Vehicle Charging Station Management System.

**Team**

- Vedansh Gholba — UID 2024300065
- Suneet Ghanshani — UID 2024300063  
  T.E. Computer Engineering – A

---

## Overview

This is a fully interactive web application that implements the **exact classes, attributes, methods, and relationships** from the Class Diagram designed for the EV Charging Station Management System.

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

1. Clone / download this repository
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge)
3. No build step or server required — pure HTML + CSS + JavaScript

```bash
# Optional: serve locally
npx serve .
# or
python3 -m http.server 8000
```

---

## Demo Login Credentials

| Role                      | Email           | Password |
| ------------------------- | --------------- | -------- |
| EV Driver                 | driver@ev.com   | password |
| Charging Station Operator | operator@ev.com | password |
| Maintenance Engineer      | engineer@ev.com | password |
| Fleet Manager             | fleet@ev.com    | password |
| System Administrator      | admin@ev.com    | password |

You can also click the **Demo account cards** on the login page for one-click login.

---

## Project Structure

```
ev-charging-system/
├── index.html      # Login page + main app shell
├── classes.js      # Exact class implementations from the Class Diagram
├── app.js          # Application logic, sample data, UI rendering
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
- No frameworks / no backend required

---

_Built as the implementation of the Class Diagram from SE Experiment-3._
