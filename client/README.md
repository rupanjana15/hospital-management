# Hospital Management System - Server

Backend server for the Hospital Management System using Node.js, Express, and JSON-based storage.

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment variables:**

   Create a `.env` file in the root directory:

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:

   ```env
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
   JWT_EXPIRES_IN=7d
   PORT=5000
   ```

   **Important:** Generate a strong JWT secret (minimum 32 characters) for production:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Start the server:**

   ```bash
   npm start
   ```

   Or for development with auto-reload:

   ```bash
   npm run dev
   ```

4. **Server will run on:**
   - Default: `http://localhost:5000`
   - Set custom port: `PORT=3000 npm start`

## API Endpoints

### Unified Authentication

**POST** `/api/auth/login`

Unified login endpoint for patients, doctors, and admins. Automatically detects user role.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-here",
      "fullName": "John Doe",
      "email": "user@example.com",
      "phone": "+911234567890",
      "status": "ACTIVE",
      "createdAt": "2025-11-22T10:30:00.000Z",
      "updatedAt": "2025-11-22T10:30:00.000Z",
      "lastLoginAt": "2025-11-22T11:45:00.000Z"
    },
    "role": "PATIENT",
    "expiresIn": "7d"
  }
}
```

**Admin Login Example:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "admin_super_001",
      "fullName": "Super Administrator",
      "email": "superadmin@hospital.com",
      "role": "SUPER_ADMIN",
      "status": "ACTIVE",
      "createdAt": "2025-11-23T00:00:00.000Z",
      "updatedAt": "2025-11-23T00:00:00.000Z"
    },
    "role": "ADMIN",
    "expiresIn": "7d"
  }
}
```

**Error Responses:**

Invalid credentials (400):

```json
{
  "success": false,
  "errors": [
    {
      "field": "credentials",
      "message": "Invalid email or password"
    }
  ]
}
```

Doctor pending approval (403):

```json
{
  "success": false,
  "errors": [
    {
      "field": "account",
      "message": "Your account is awaiting admin approval. Please check back later."
    }
  ]
}
```

Doctor rejected (403):

```json
{
  "success": false,
  "errors": [
    {
      "field": "account",
      "message": "Your account was rejected. Please contact admin for more information."
    }
  ]
}
```

Rate limit exceeded (429):

```json
{
  "success": false,
  "errors": [
    {
      "field": "general",
      "message": "Too many login attempts. Please try again after 15 minutes."
    }
  ],
  "retryAfter": 900
}
```

### Patient Registration

**POST** `/api/patients/register`

Register a new patient account.

**Request Body:**

```json
{
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+911234567890",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "dateOfBirth": "1990-05-15",
  "gender": "MALE",
  "address": "123 Main Street, City"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Patient registered successfully",
  "data": {
    "patient": {
      "id": "uuid-here",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+911234567890",
      "dateOfBirth": "1990-05-15",
      "gender": "MALE",
      "address": "123 Main Street, City",
      "status": "ACTIVE",
      "createdAt": "2025-11-22T10:30:00.000Z",
      "updatedAt": "2025-11-22T10:30:00.000Z"
    }
  }
}
```

**Error Response (400/409):**

```json
{
  "success": false,
  "errors": [
    {
      "field": "email",
      "message": "Email already registered"
    }
  ]
}
```

### Doctor Registration

**POST** `/api/doctors/register`

Register a new doctor account. Doctor status starts as "PENDING" and requires admin approval.

**Request Body:**

```json
{
  "fullName": "Dr. Rajesh Kumar",
  "email": "rajesh.kumar@hospital.com",
  "phone": "+919876543210",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "specializationId": "spec_001",
  "qualification": "MBBS, MD (Cardiology)",
  "experienceYears": 10,
  "consultationFee": 1500
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Doctor registered successfully. Your account is pending admin approval.",
  "data": {
    "doctor": {
      "id": "uuid-here",
      "fullName": "Dr. Rajesh Kumar",
      "email": "rajesh.kumar@hospital.com",
      "phone": "+919876543210",
      "specializationId": "spec_001",
      "qualification": "MBBS, MD (Cardiology)",
      "experienceYears": 10,
      "consultationFee": 1500,
      "status": "PENDING",
      "createdAt": "2025-11-22T10:30:00.000Z",
      "updatedAt": "2025-11-22T10:30:00.000Z"
    }
  }
}
```

### Validation Rules

#### Patient Validation

- **fullName**: Required, 3-80 characters, letters/spaces/dots/hyphens only
- **email**: Required, valid email format, lowercase, unique
- **phone**: Required, 10-15 digits (+ allowed), unique
- **password**: Required, min 8 characters, must contain at least 1 letter and 1 digit
- **confirmPassword**: Required, must match password
- **gender**: Optional, must be one of: MALE, FEMALE, OTHER, NOT_SPECIFIED
- **dateOfBirth**: Optional, valid date (YYYY-MM-DD), cannot be future date
- **address**: Optional, max 255 characters
- **bloodGroup**: Optional, must be valid blood group (A+, A-, B+, B-, AB+, AB-, O+, O-)

#### Doctor Validation

- **fullName**: Required, 3-80 characters, letters/spaces/dots/hyphens only
- **email**: Required, valid email format, lowercase, unique
- **phone**: Required, must match `+91XXXXXXXXXX` format (Indian mobile), unique
- **password**: Required, min 8 characters, must contain at least 1 letter and 1 digit
- **confirmPassword**: Required, must match password
- **specializationId**: Required, must be valid active specialization
- **qualification**: Required, min 3 characters
- **experienceYears**: Required, integer ≥ 0
- **consultationFee**: Required, integer ≥ 0

### Patient Profile Management

#### View Patient Profile

**GET** `/api/patients/me`

Get the current authenticated patient's profile. Requires valid JWT token with PATIENT role.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "patient": {
      "id": "uuid-here",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+911234567890",
      "dateOfBirth": "1990-05-15",
      "gender": "MALE",
      "address": "123 Main Street, City",
      "bloodGroup": "O+",
      "status": "ACTIVE",
      "createdAt": "2025-11-22T10:30:00.000Z",
      "updatedAt": "2025-11-22T10:30:00.000Z",
      "lastLoginAt": "2025-11-22T11:45:00.000Z"
    }
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "errors": [
    {
      "field": "patient",
      "message": "Patient not found"
    }
  ]
}
```

#### Update Patient Profile

**PUT** `/api/patients/me`

Update the current authenticated patient's profile. All fields are optional. Requires valid JWT token with PATIENT role.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**

```json
{
  "fullName": "John William Doe",
  "phone": "+911234567890",
  "dateOfBirth": "1990-05-15",
  "gender": "MALE",
  "address": "456 New Street, City",
  "bloodGroup": "O+"
}
```

**Note:**

- All fields are optional. Only include fields you want to update.
- Email cannot be changed (will return validation error if included).
- Status cannot be changed (will return validation error if included).
- Empty strings for `dateOfBirth`, `gender`, and `address` will be converted to `null`.
- Phone number must be unique across all patients.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "patient": {
      "id": "uuid-here",
      "fullName": "John William Doe",
      "email": "john.doe@example.com",
      "phone": "+911234567890",
      "dateOfBirth": "1990-05-15",
      "gender": "MALE",
      "address": "456 New Street, City",
      "bloodGroup": "O+",
      "status": "ACTIVE",
      "createdAt": "2025-11-22T10:30:00.000Z",
      "updatedAt": "2025-11-23T14:30:00.000Z",
      "lastLoginAt": "2025-11-22T11:45:00.000Z"
    }
  }
}
```

**Error Responses:**

Duplicate phone number (409):

```json
{
  "success": false,
  "errors": [
    {
      "field": "phone",
      "message": "Phone number already registered to another account"
    }
  ]
}
```

Email change attempt (400):

```json
{
  "success": false,
  "errors": [
    {
      "field": "email",
      "message": "Email cannot be changed. Please contact support if you need to update your email."
    }
  ]
}
```

Status change attempt (400):

```json
{
  "success": false,
  "errors": [
    {
      "field": "status",
      "message": "Status cannot be changed through profile update."
    }
  ]
}
```

**Validation Rules for Profile Update:**

- **fullName**: 3-80 characters, letters/spaces/dots/hyphens only
- **phone**: 10-15 digits (+ allowed), must be unique
- **gender**: Must be one of: MALE, FEMALE, OTHER, NOT_SPECIFIED, or null
- **dateOfBirth**: Valid date (YYYY-MM-DD), cannot be future date, or null
- **address**: Max 255 characters, or null
- **bloodGroup**: Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-, or null
- **email**: Cannot be changed (blocked)
- **status**: Cannot be changed (blocked)
- **password**: Cannot be changed through this endpoint (blocked)

### Patient Login (Backward Compatible)

**POST** `/api/patients/login`

Login with patient credentials and receive a JWT token. **Note:** Use `/api/auth/login` for unified authentication.

**Request Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "patient": {
      "id": "uuid-here",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+911234567890",
      "dateOfBirth": "1990-05-15",
      "gender": "MALE",
      "address": "123 Main Street, City",
      "status": "ACTIVE",
      "createdAt": "2025-11-22T10:30:00.000Z",
      "updatedAt": "2025-11-22T10:30:00.000Z",
      "lastLoginAt": "2025-11-22T11:45:00.000Z"
    },
    "expiresIn": "7d"
  }
}
```

### Other Endpoints

**GET** `/api/patients/me` - Get current patient's profile (Protected - PATIENT role only)

**PUT** `/api/patients/me` - Update current patient's profile (Protected - PATIENT role only)

**GET** `/api/patients` - Get all patients (Protected - requires authentication)

**GET** `/api/patients/:id` - Get patient by ID (Protected - requires authentication)

**GET** `/api/doctors/approved` - Get all approved doctors (Public)

**GET** `/api/doctors` - Get all doctors (Protected - Admin only)

**GET** `/api/doctors/:id` - Get doctor by ID (Protected - Doctor/Admin only)

**GET** `/api/health` - Health check

### Seeded Admin Credentials

The system includes pre-seeded admin accounts for testing and administration:

**Super Administrator:**

- Email: `superadmin@hospital.com`
- Password: `SuperAdmin123`
- Role: `SUPER_ADMIN`

**Regular Administrator:**

- Email: `admin@hospital.com`
- Password: `Admin123`
- Role: `ADMIN`

**Note:** These credentials are for development/testing only. Change passwords in production.

### Protected Routes

Protected routes require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

Example request:

```bash
curl -X GET http://localhost:5000/api/patients \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Role-Based Access Control

The system supports role-based access control with the following roles:

- **PATIENT**: Can access patient-specific endpoints
- **DOCTOR**: Can access doctor-specific endpoints (when approved)
- **ADMIN**: Can access all endpoints including admin-only routes
- **SUPER_ADMIN**: Has all admin privileges plus additional super admin capabilities

**Role-based middleware examples:**

- `requireRole("ADMIN")` - Admin only
- `requireRole("DOCTOR", "ADMIN")` - Doctors and admins
- `requireRole("SUPER_ADMIN")` - Super admin only
- `requireAnyRole()` - Any authenticated user

## Project Structure

```
server/
├── data/                    # JSON file storage
│   ├── patients.json
│   ├── doctors.json
│   ├── admins.json
│   ├── specializations.json
│   ├── auditLogs.json
│   └── [other data files]
├── src/
│   ├── config/             # Configuration files
│   │   └── jwt.config.js
│   ├── controllers/        # Request handlers
│   │   ├── patient.controller.js
│   │   ├── doctor.controller.js
│   │   └── auth.controller.js
│   ├── middlewares/        # Express middlewares
│   │   ├── auth.middleware.js
│   │   ├── rateLimit.middleware.js
│   │   └── validation.middleware.js
│   ├── models/            # Data models
│   │   ├── patient.model.js
│   │   ├── doctor.model.js
│   │   ├── admin.model.js
│   │   └── auditLog.model.js
│   ├── repositories/      # Data access layer
│   │   ├── patient.repository.js
│   │   ├── doctor.repository.js
│   │   ├── admin.repository.js
│   │   ├── specialization.repository.js
│   │   └── auditLog.repository.js
│   ├── routes/            # API routes
│   │   ├── index.js
│   │   ├── patient.routes.js
│   │   ├── doctor.routes.js
│   │   └── auth.routes.js
│   ├── services/          # Business logic
│   │   ├── patient.service.js
│   │   ├── doctor.service.js
│   │   └── auth.service.js
│   └── utils/             # Utility functions
│       └── fileHandler.js
├── .env                   # Environment variables (create from .env.example)
├── .env.example           # Environment variables template
├── index.js               # Server entry point
└── package.json
```

## Architecture

- **Models**: Define data structure and validation rules
- **Repositories**: Handle data persistence (JSON files) with in-memory caching
- **Services**: Implement business logic (validation, password hashing, authentication)
- **Controllers**: Handle HTTP requests/responses
- **Middlewares**: Input validation, authentication, and authorization
- **Routes**: API endpoint definitions with role-based access control

### Authentication Flow

1. **Unified Login**: `/api/auth/login` searches across all user repositories (patients → doctors → admins)
2. **Role Detection**: Automatically determines user role (PATIENT/DOCTOR/ADMIN)
3. **Status Validation**: Applies role-specific status checks
4. **JWT Generation**: Creates token with embedded role information
5. **Authorization**: Middleware validates role-based access to endpoints

### Doctor Approval Workflow

```
Doctor Registration
      ↓
   PENDING Status
      ↓
[Admin Approval Required]
      ↓
   ├─→ APPROVED (can login)
   ├─→ REJECTED (blocked)
   └─→ INACTIVE (blocked)
```

## Data Storage

- Uses JSON files for persistence (`data/patients.json`, `data/doctors.json`, `data/specializations.json`, etc.)
- All data loaded into memory at server startup
- Atomic writes using temporary files
- Single-process architecture (no horizontal scaling)

## Security Features

- **Unified JWT Authentication**: Secure token-based authentication with role information
- **Role-Based Access Control**: Fine-grained permissions for different user types
- **Password Hashing**: bcrypt with 10 salt rounds
- **Rate Limiting**: IP-based rate limiting (5 attempts per 15 minutes) to prevent brute force attacks
- **Input Sanitization**: Protection against XSS attacks using express-validator
- **Audit Logging**: All login attempts (successful and failed) are logged with IP address and user agent
- **Account Status Validation**: Blocks access for inactive, deleted, pending, or rejected accounts
- **Unique Constraints**: Email and phone number uniqueness validation
- **Strong Password Requirements**: Minimum 8 characters with at least one letter and one digit
- **Doctor Approval Workflow**: New doctors must be approved by admin before accessing the system
- **Generic Error Messages**: Prevents email enumeration attacks

## Testing the API

### Using curl:

**View patient profile (after login):**

```bash
# Save the token from login response
TOKEN="your-jwt-token-here"

curl -X GET http://localhost:5000/api/patients/me \
  -H "Authorization: Bearer $TOKEN"
```

**Update patient profile:**

```bash
# Update all fields
curl -X PUT http://localhost:5000/api/patients/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John William Doe",
    "phone": "+911234567890",
    "dateOfBirth": "1990-05-15",
    "gender": "MALE",
    "address": "456 New Street, City",
    "bloodGroup": "O+"
  }'

# Update only specific fields (all fields are optional)
curl -X PUT http://localhost:5000/api/patients/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "address": "New Address"
  }'
```

**Register a patient:**

```bash
curl -X POST http://localhost:5000/api/patients/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+911234567890",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123",
    "gender": "MALE",
    "dateOfBirth": "1990-05-15"
  }'
```

**Register a doctor:**

```bash
curl -X POST http://localhost:5000/api/doctors/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Dr. Rajesh Kumar",
    "email": "rajesh.kumar@hospital.com",
    "phone": "+919876543210",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123",
    "specializationId": "spec_001",
    "qualification": "MBBS, MD (Cardiology)",
    "experienceYears": 10,
    "consultationFee": 1500
  }'
```

**Unified login (auto-detects role):**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Admin login:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@hospital.com",
    "password": "SuperAdmin123"
  }'
```

**Patient-specific login (backward compatible):**

```bash
curl -X POST http://localhost:5000/api/patients/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Get approved doctors (public):**

```bash
curl http://localhost:5000/api/doctors/approved
```

**Access protected endpoint:**

```bash
# Save the token from login response
TOKEN="your-jwt-token-here"

curl -X GET http://localhost:5000/api/patients \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman:

**View Patient Profile:**

1. Set method to GET
2. URL: `http://localhost:5000/api/patients/me`
3. Headers:
   - `Authorization: Bearer <your-token-from-login>`
4. Send request

**Update Patient Profile:**

1. Set method to PUT
2. URL: `http://localhost:5000/api/patients/me`
3. Headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer <your-token-from-login>`
4. Body: Raw JSON with fields to update (all optional):
   ```json
   {
     "fullName": "John William Doe",
     "phone": "+911234567890",
     "dateOfBirth": "1990-05-15",
     "gender": "MALE",
     "address": "456 New Street, City",
     "bloodGroup": "O+"
   }
   ```
5. Send request

**Register Patient:**

1. Set method to POST
2. URL: `http://localhost:5000/api/patients/register`
3. Headers: `Content-Type: application/json`
4. Body: Raw JSON with patient data

**Register Doctor:**

1. Set method to POST
2. URL: `http://localhost:5000/api/doctors/register`
3. Headers: `Content-Type: application/json`
4. Body: Raw JSON with doctor data (include specializationId, qualification, experienceYears, consultationFee)

**Unified Login:**

1. Set method to POST
2. URL: `http://localhost:5000/api/auth/login`
3. Headers: `Content-Type: application/json`
4. Body: `{"email": "user@example.com", "password": "SecurePass123"}`
5. Save the `token` and `role` from the response

**Admin Login:**

1. Set method to POST
2. URL: `http://localhost:5000/api/auth/login`
3. Headers: `Content-Type: application/json`
4. Body: `{"email": "superadmin@hospital.com", "password": "SuperAdmin123"}`
5. Save the `token` and `role` from the response

**Patient Login (Backward Compatible):**

1. Set method to POST
2. URL: `http://localhost:5000/api/patients/login`
3. Headers: `Content-Type: application/json`
4. Body: `{"email": "john@example.com", "password": "SecurePass123"}`
5. Save the `token` from the response

**Access Protected Routes:**

1. Set method to GET
2. URL: `http://localhost:5000/api/patients`
3. Headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer <your-token>`

**Get Approved Doctors (Public):**

1. Set method to GET
2. URL: `http://localhost:5000/api/doctors/approved`
3. No authentication required
