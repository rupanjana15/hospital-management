# Hospital Management System

A full-stack hospital management application with separate client and server applications. The system supports patient, doctor, and admin workflows for registration, authentication, appointment scheduling, doctor availability, leave management, billing, and basic hospital administration.

## Project Structure

```text
.
├── client/   # React frontend application
├── server/   # Node.js + Express backend API
└── Hospital Management Case Study (3).xlsx
```

## Features

- Unified login for patients, doctors, and admins
- Patient registration, profile management, doctor discovery, and appointment booking
- Doctor registration, profile management, schedule management, leave requests, and appointment views
- Admin dashboard for patient, doctor, specialization, and approval workflows
- Appointment booking, rescheduling, cancellation, completion, and history
- Billing and payment status flows
- Notifications and audit-style JSON data storage

## Tech Stack

### Frontend

- React
- React Router
- Axios
- React Toastify
- Lucide React
- Tailwind CSS

### Backend

- Node.js
- Express
- JSON Web Tokens
- bcrypt / bcryptjs
- express-validator
- JSON-file based persistence

## Getting Started

### Prerequisites

- Node.js
- npm

### 1. Clone the repository

```bash
git clone <repository-url>
cd Hospital
```

### 2. Install dependencies

Install server dependencies:

```bash
cd server
npm install
```

Install client dependencies:

```bash
cd ../client
npm install
```

### 3. Configure the server

Create the server environment file:

```bash
cd ../server
cp .env.example .env
```

Update `.env` as needed:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d
PORT=5000
```

### 4. Configure the client

The client uses `http://localhost:5000/api` by default. To override it, create or update `client/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 5. Run the application

Start the backend:

```bash
cd server
npm run dev
```

In another terminal, start the frontend:

```bash
cd client
npm start
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

## Main API Areas

- `POST /api/auth/login` - unified login
- `POST /api/patients/register` - patient registration
- `POST /api/doctors/register` - doctor registration
- `GET /api/doctors/approved` - public approved doctor list
- `GET /api/patients/me` - patient profile
- `GET /api/doctors/:doctorId/slots` - doctor slots
- `POST /api/appointments/book` - appointment booking
- `GET /api/admin/dashboard/stats` - admin dashboard stats
- `GET /api/bills/:billId` - bill details

See `server/README.md` for more backend endpoint details.

## Data Storage

The backend uses JSON files in `server/data/` for persistence. These files store records such as patients, doctors, admins, appointments, slots, leaves, bills, notifications, audit logs, and specializations.

This is suitable for local development, demos, and learning projects. For production, replace JSON-file storage with a database such as PostgreSQL, MySQL, or MongoDB.

## Useful Commands

### Server

```bash
cd server
npm start
npm run dev
```

### Client

```bash
cd client
npm start
npm run build
npm test
```

## Notes

- The client and server are managed as separate Node projects.
- Start the server before using the client so API requests can complete.
- Keep `.env` files private and do not commit real secrets.
- For detailed setup and API notes, check the READMEs inside `client/` and `server/`.
