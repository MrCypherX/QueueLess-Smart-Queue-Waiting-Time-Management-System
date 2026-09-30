<<<<<<< HEAD
# QueueLess-Smart-Queue-Waiting-Time-Management-System
QueueLess is a smart digital queue system that provides virtual tokens, real-time queue tracking, and waiting-time estimates, helping people avoid long queues and reducing overcrowding.
=======
# QueueLess – Smart Queue & Waiting-Time Management System

**QueueLess** is a production-grade, full-stack, mobile-first web application designed to eliminate physical overcrowding and waiting anxiety at hospitals, banks, government transport offices (RTO/DMV), universities, and utility desks.

Powered by **Google Gemini 2.5 Flash** and real-time **Server-Sent Events (SSE)**, QueueLess issues unique digital tokens, predicts accurate waiting times based on open counters and historical speeds, tracks queue progress with live circular indicators, and notifies citizens when their turn is approaching.

---

## 🚀 Key Features

1. **Digital Token Issuance & QR Passes**
   - Sequential tokens with category prefixes (e.g. `OPD-110`, `BNK-201`, `RTO-302`).
   - Digital verification QR code on every token for rapid counter check-in.
   - Interactive SVG circular progress ring indicating queue advancement.

2. **Real-Time Queue Tracking & Synchronization**
   - Instant sub-second updates powered by **Server-Sent Events (SSE)** with a 10s polling fallback.
   - Whenever an operator calls, completes, or skips a token, remaining positions and ETAs dynamically recalculate.

3. **Gemini AI Predictive Engine & Advisories**
   - Predicts arrival windows and expected wait times based on active counters, queue depth, and rush-hour multipliers.
   - Generates calm, human-friendly status advisories for citizens.
   - **Admin Anomaly Discovery**: Detects sudden bottlenecks and recommends counter allocations.
   - *Autonomous Fallback*: If `GEMINI_API_KEY` is not provided, QueueLess runs an intelligent statistical M/M/c queueing-theory model with zero downtime.

4. **Multi-Role Dashboards & Station Consoles**
   - **Citizen**: Active token passes, turn notifications, and past visit history.
   - **Operator Console**: Window counter controls (Open/Close), active consultation timer, Call Next action, and live queue list.
   - **Admin Suite**: CRUD for Locations, Services, and Counters; live SVG hourly throughput and wait-time charts.
   - **Superadmin Hub**: System telemetry, total facility counts, cluster connectivity, and AI model health.

5. **Proximity Alerts & Notifications**
   - In-app notification center with unread badges.
   - Browser Notification API support with alerts when within 3 tokens or wait time < 10 mins.

6. **Flexible Database Architecture**
   - Connects to external PostgreSQL (`DATABASE_URL=postgresql://...`) in production (Neon, Supabase, Railway, Replit Postgres).
   - Automatically initializes and persists an embedded PostgreSQL engine (`@electric-sql/pglite`) for instant zero-configuration local development.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, React Router v6, TanStack Query, Lucide Icons, date-fns, qrcode.react |
| **Backend** | Node.js, Express.js, TypeScript, tsx, CORS, Helmet, Server-Sent Events (SSE) |
| **Database** | PostgreSQL (pg driver + persistent PGlite), full schema with constraints, pgcrypto, UUIDs, JSONB, indexes |
| **AI / ML** | `@google/genai` (Gemini 2.5 Flash) + M/M/c statistical queueing-theory engine |
| **Validation** | Zod (shared schemas between client and server) |
| **Auth & Security** | JWT (jsonwebtoken), bcryptjs, role-based authorization, Row-Level Security isolation |

---

## 👤 Default Test Credentials

The database is seeded with ready-to-test accounts across all 4 roles. You can also switch roles with a single click using the **"Role: [Role]"** button in the navigation bar!

| Role | Email | Password | Persona & Permissions |
|---|---|---|---|
| **Superadmin** | `superadmin@queueless.io` | `Password123!` | System-wide cluster telemetry & full access |
| **Facility Admin** | `admin@queueless.io` | `Password123!` | Manages locations, services, counters & analytics |
| **Desk Operator** | `operator@queueless.io` | `Password123!` | Counter console to call tokens & mark completed |
| **Citizen** | `citizen@queueless.io` | `Password123!` | Active token `OPD-110`, live position `#1`, notifications |

*Note: Guest users can also join queues directly without creating an account.*

---

## 📋 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 1. Installation
Clone the repository and install all dependencies:
```bash
# Install root dependencies
npm install

# Install server dependencies
npm install --prefix server

# Install client dependencies
npm install --prefix client
```

### 2. Environment Configuration
Copy the template environment file:
```bash
cp .env.example server/.env
```

Default variables in `server/.env`:
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=queueless-super-secret-jwt-key-min-32-chars-2025
JWT_EXPIRES_IN=7d

# Optional: Set this to connect to an external PostgreSQL database.
# If left blank, QueueLess automatically runs embedded persistent PostgreSQL!
DATABASE_URL=

# Optional: Set your Google Gemini API key to enable live Gemini 2.5 Flash.
# If omitted, QueueLess runs an intelligent statistical queue-theory fallback.
GEMINI_API_KEY=
```

### 3. Database Migration & Seeding
Run migrations and populate the database with realistic sample locations (Hospitals, Banks, RTOs, Universities):
```bash
# Run PostgreSQL schema migration
npm run db:migrate

# Seed sample facilities, services, counters, users, and active queues
npm run db:seed
```

### 4. Running the Application
Start both the backend server and frontend client concurrently:
```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **API Health Check**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

## 📡 API Overview

### Authentication
- `POST /api/auth/register` – Register new citizen or staff account
- `POST /api/auth/login` – Login and obtain JWT
- `GET  /api/auth/me` – Retrieve authenticated session

### Public Facilities & Services
- `GET  /api/locations` – Filter facilities by category, city, or search keyword
- `GET  /api/locations/:id` – Facility profile with active queues & services
- `POST /api/locations` – Create facility (Admin)
- `PUT  /api/locations/:id` – Update facility (Admin)
- `POST /api/locations/services` – Create service counter (Admin)
- `PUT  /api/locations/services/:id` – Update service target time (Admin)

### Window Counters
- `GET   /api/counters/services/:serviceId/counters` – List counters for a service
- `GET   /api/counters/my` – Counters assigned to the logged-in operator
- `POST  /api/counters` – Add window counter (Admin)
- `PATCH /api/counters/:id` – Toggle counter open/closed or assign operator

### Digital Tokens & Queue Flow
- `POST  /api/tokens` – Join queue (guest or user) & receive token with ETA
- `GET   /api/tokens/:id` – Live status, queue position, and AI advisory
- `GET   /api/tokens/my` – Citizen's active and past tokens
- `PATCH /api/tokens/:id/status` – Update status (`called`, `serving`, `completed`, `skipped`, `cancelled`)
- `POST  /api/tokens/call-next` – Operator calls next waiting citizen
- `GET   /api/tokens/services/:serviceId/queue` – Live queue for operator station

### AI Predictions & Telemetry
- `POST /api/ai/predict-wait` – Predict waiting minutes, confidence, and arrival window
- `POST /api/ai/advisory` – Generate personalized status message
- `POST /api/ai/anomalies` – Detect capacity bottlenecks and recommend counter scaling

### Server-Sent Events (SSE Real-Time Push)
- `GET /api/events/queue/:serviceId` – Stream queue changes for a service
- `GET /api/events/token/:tokenId` – Stream live position and status updates for a token
- `GET /api/events/user/:userId` – Stream real-time user proximity notifications
- `GET /api/events/all-queues` – Stream facility-wide queue length changes

---

## 🧪 Verification & Testing

To verify the complete full-stack integration end-to-end, execute:
```bash
node -e '
(async () => {
  const res = await fetch("http://localhost:3001/api/health").then(r => r.json());
  console.log("QueueLess Server Status:", res.status);
})();
'
```

---

## 📄 License
ISC. Built for production-grade public facility queue management.
>>>>>>> 23aadb5 (first hackathon commit)
