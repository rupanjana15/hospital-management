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

### Doctor Management

#### Doctor Registration

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

#### Update Doctor Status

**PATCH** `/api/doctors/:id/status`

Update a doctor's status to APPROVED, REJECTED, or INACTIVE. Only admins can perform this action.

**Headers:**

```
Authorization: Bearer <admin-jwt-token>
```

**Request Body:**

```json
{
  "status": "APPROVED"
}
```

**Note:**

- `status` must be either `APPROVED`, `REJECTED`, or `INACTIVE`
- Any doctor can be set to any of these statuses (no transition restrictions)
- Requires ADMIN role

**Success Response (200):**

```json
{
  "success": true,
  "message": "Doctor status updated to APPROVED",
  "data": {
    "doctor": {
      "id": "doc_002",
      "fullName": "Dr. Sneha Narayanan",
      "email": "sneha.n@hospital.com",
      "phone": "+919765432110",
      "specializationId": "spec_002",
      "qualification": "MBBS, MD (Neurology)",
      "experienceYears": 8,
      "consultationFee": 2200,
      "status": "APPROVED",
      "isChatOnline": true,
      "availableSlots": [],
      "createdAt": "2025-11-19T10:35:22.262Z",
      "updatedAt": "2025-11-23T12:00:00.000Z",
      "lastLoginAt": "2025-11-22T05:12:41.266Z"
    }
  }
}
```

**Error Responses:**

Doctor not found (404):

```json
{
  "success": false,
  "errors": [
    {
      "field": "id",
      "message": "Doctor not found"
    }
  ]
}
```

Invalid status transition (400):

```json
{
  "success": false,
  "errors": [
    {
      "field": "status",
      "message": "Cannot change status from APPROVED. Only PENDING doctors can be approved or rejected."
    }
  ]
}
```

Invalid status value (400):

```json
{
  "success": false,
  "errors": [
    {
      "field": "status",
      "message": "Invalid status. Must be APPROVED, REJECTED, or INACTIVE."
    }
  ]
}
```

Unauthorized - Not an admin (403):

```json
{
  "success": false,
  "errors": [
    {
      "field": "authorization",
      "message": "Access denied: Insufficient permissions"
    }
  ]
}
```

#### Update Doctor Profile

**PUT** `/api/doctors/me`

Update the current authenticated doctor's profile. All fields are optional. Requires valid JWT token with DOCTOR role.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**

```json
{
  "fullName": "Dr. Rajesh Kumar Updated",
  "phone": "+919876543210",
  "specializationId": "spec_002",
  "qualification": "MBBS, MD (Cardiology), DM",
  "experienceYears": 12,
  "consultationFee": 1800,
  "isChatOnline": true,
  "availableSlots": [
    {
      "dayOfWeek": 1,
      "startTime": "09:00",
      "endTime": "17:00",
      "slotDurationMinutes": 30
    }
  ]
}
```

**Note:**

- All fields are optional. Only include fields you want to update.
- ID, email, password, status, createdAt, updatedAt, lastLoginAt cannot be changed.
- Phone number must be unique across all doctors.
- Specialization must be valid and active.
- Available slots must be valid time slots.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Doctor profile updated successfully",
  "data": {
    "doctor": {
      "id": "doc_001",
      "fullName": "Dr. Rajesh Kumar Updated",
      "email": "rajesh.kumar@hospital.com",
      "phone": "+919876543210",
      "specializationId": "spec_002",
      "qualification": "MBBS, MD (Cardiology), DM",
      "experienceYears": 12,
      "consultationFee": 1800,
      "status": "APPROVED",
      "isChatOnline": true,
      "availableSlots": [
        {
          "dayOfWeek": 1,
          "startTime": "09:00",
          "endTime": "17:00",
          "slotDurationMinutes": 30
        }
      ],
      "createdAt": "2025-11-20T11:15:30.262Z",
      "updatedAt": "2025-11-23T14:30:00.000Z",
      "lastLoginAt": "2025-11-21T08:20:41.266Z"
    }
  }
}
```

**Error Responses:**

Doctor not found (404):

```json
{
  "success": false,
  "errors": [
    {
      "field": "general",
      "message": "Doctor not found"
    }
  ]
}
```

Duplicate phone number (409):

```json
{
  "success": false,
  "errors": [
    {
      "field": "phone",
      "message": "Phone number already registered"
    }
  ]
}
```

Invalid specialization (400):

```json
{
  "success": false,
  "errors": [
    {
      "field": "specializationId",
      "message": "Invalid or inactive specialization"
    }
  ]
}
```

Invalid experience years (400):

```json
{
  "success": false,
  "errors": [
    {
      "field": "experienceYears",
      "message": "Experience years must be a non-negative integer"
    }
  ]
}
```

Invalid consultation fee (400):

```json
{
  "success": false,
  "errors": [
    {
      "field": "consultationFee",
      "message": "Consultation fee must be a non-negative integer"
    }
  ]
}
```

Invalid available slots (400):

```json
{
  "success": false,
  "errors": [
    {
      "field": "availableSlots",
      "message": "Slot 1: startTime must be in HH:mm format (24-hour)"
    }
  ]
}
```

Attempt to change blocked fields (400):

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

**Validation Rules for Doctor Profile Update:**

- **fullName**: 3-80 characters, letters/spaces/dots/hyphens only
- **phone**: Must match `+91XXXXXXXXXX` format (Indian format), must be unique
- **specializationId**: Must be valid active specialization
- **qualification**: Min 3 characters
- **experienceYears**: Non-negative integer
- **consultationFee**: Non-negative integer
- **isChatOnline**: Boolean value
- **availableSlots**: Array of valid time slots with dayOfWeek (0-6), startTime/endTime (HH:mm), slotDurationMinutes (positive integer)
- **id**: Cannot be changed (blocked)
- **email**: Cannot be changed (blocked)
- **password**: Cannot be changed (blocked)
- **status**: Cannot be changed (blocked)
- **createdAt**: Cannot be changed (blocked)
- **updatedAt**: Cannot be changed (blocked)
- **lastLoginAt**: Cannot be changed (blocked)

#### Update Doctor Basic Profile by ID

**PATCH** `/api/doctors/:id/basic`

Update a doctor's basic profile by ID. Only allows updating `isChatOnline`, `qualification`, and `specializationId`. Requires valid JWT token with DOCTOR or ADMIN role. Doctors can update their own profile, admins can update any doctor's profile.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**

```json
{
  "isChatOnline": true,
  "qualification": "MBBS, MD (Cardiology), DM",
  "specializationId": "spec_002"
}
```

**Note:**

- All fields are optional. Only include fields you want to update.
- Only `isChatOnline`, `qualification`, and `specializationId` can be updated through this endpoint.
- Other fields will be rejected with validation errors.
- Specialization must be valid and active.
- Doctors can only update their own profile (ID must match the authenticated user's ID).
- Admins can update any doctor's profile.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Doctor basic profile updated successfully",
  "data": {
    "doctor": {
      "id": "doc_001",
      "fullName": "Dr. Rajesh Kumar",
      "email": "rajesh.kumar@hospital.com",
      "phone": "+919876543210",
      "specializationId": "spec_002",
      "qualification": "MBBS, MD (Cardiology), DM",
      "experienceYears": 10,
      "consultationFee": 1500,
      "status": "APPROVED",
      "isChatOnline": true,
      "availableSlots": [],
      "createdAt": "2025-11-20T11:15:30.262Z",
      "updatedAt": "2025-11-23T14:30:00.000Z",
      "lastLoginAt": "2025-11-21T08:20:41.266Z"
    }
  }
}
```

**Error Responses:**

Doctor not found (404):

```json
{
  "success": false,
  "errors": [
    {
      "field": "id",
      "message": "Doctor not found"
    }
  ]
}
```

Invalid specialization (400):

```json
{
  "success": false,
  "errors": [
    {
      "field": "specializationId",
      "message": "Invalid or inactive specialization"
    }
  ]
}
```

Attempt to update blocked fields (400):

```json
{
  "success": false,
  "errors": [
    {
      "field": "fullName",
      "message": "Full name cannot be updated through this endpoint."
    }
  ]
}
```

Unauthorized - Doctor trying to update another doctor's profile (403):

```json
{
  "success": false,
  "errors": [
    {
      "field": "authorization",
      "message": "Access denied: You can only update your own profile"
    }
  ]
}
```

**Validation Rules for Doctor Basic Profile Update by ID:**

- **isChatOnline**: Boolean value
- **qualification**: Min 3 characters
- **specializationId**: Must be valid active specialization
- **Other fields**: Cannot be updated through this endpoint (blocked)

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

#### Get Upcoming Appointments Count

**GET** `/api/patients/me/upcoming-appointments/count`

Get the count of upcoming confirmed appointments for the current authenticated patient. Only includes appointments with status "CONFIRMED" and appointment date is today or in the future.

**Headers:**

```
Authorization: Bearer <patient-jwt-token>
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "count": 3
  }
}
```

**Error Response (500):**

```json
{
  "success": false,
  "errors": [
    {
      "field": "general",
      "message": "An error occurred while fetching upcoming appointments count"
    }
  ]
}
```

**Notes:**

- Only counts appointments with status "CONFIRMED"
- Includes appointments scheduled for today and future dates
- Requires PATIENT role authentication
- Patient can only see their own appointment count

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

### Admin Patient Management

#### Get All Patients (Admin Only)

**GET** `/api/admin/patients`

Get all patients in the system. Requires ADMIN role.

**Headers:**

```
Authorization: Bearer <admin-jwt-token>
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "patients": [
      {
        "id": "2cd53360-4931-4fb8-afdf-8bf3de80800e",
        "fullName": "John William Doe",
        "email": "john@example.com",
        "phone": "+911234567890",
        "dateOfBirth": "1990-05-15",
        "gender": "MALE",
        "address": "456 New Street, City",
        "bloodGroup": "O+",
        "status": "ACTIVE",
        "createdAt": "2025-11-22T17:04:12.456Z",
        "updatedAt": "2025-11-23T03:11:21.517Z",
        "lastLoginAt": "2025-11-23T03:11:21.516Z"
      }
    ],
    "count": 2
  }
}
```

**Error Response (403 - Forbidden):**

```json
{
  "success": false,
  "errors": [
    {
      "field": "authorization",
      "message": "Access denied: Insufficient permissions"
    }
  ]
}
```

#### Get Patient by ID (Admin Only)

**GET** `/api/admin/patients/:id`

Get a specific patient by their ID. Requires ADMIN role.

**Headers:**

```
Authorization: Bearer <admin-jwt-token>
```

**URL Parameters:**

- `id`: Patient ID (UUID format)

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "patient": {
      "id": "2cd53360-4931-4fb8-afdf-8bf3de80800e",
      "fullName": "John William Doe",
      "email": "john@example.com",
      "phone": "+911234567890",
      "dateOfBirth": "1990-05-15",
      "gender": "MALE",
      "address": "456 New Street, City",
      "bloodGroup": "O+",
      "status": "ACTIVE",
      "createdAt": "2025-11-22T17:04:12.456Z",
      "updatedAt": "2025-11-23T03:11:21.517Z",
      "lastLoginAt": "2025-11-23T03:11:21.516Z"
    }
  }
}
```

**Error Response (404 - Not Found):**

```json
{
  "success": false,
  "errors": [
    {
      "field": "id",
      "message": "Patient not found"
    }
  ]
}
```

**Error Response (403 - Forbidden):**

```json
{
  "success": false,
  "errors": [
    {
      "field": "authorization",
      "message": "Access denied: Insufficient permissions"
    }
  ]
}
```

#### Toggle Patient Status (Admin Only)

**PATCH** `/api/admin/patients/:id/status`

Toggle a patient's status between ACTIVE and INACTIVE. Requires ADMIN role. This action is logged in the audit system.

**Headers:**

```
Authorization: Bearer <admin-jwt-token>
```

**URL Parameters:**

- `id`: Patient ID (UUID format)

**Request Body:** None required (status is automatically toggled)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Patient status toggled to INACTIVE",
  "data": {
    "patient": {
      "id": "2cd53360-4931-4fb8-afdf-8bf3de80800e",
      "fullName": "John William Doe",
      "email": "john@example.com",
      "phone": "+911234567890",
      "dateOfBirth": "1990-05-15",
      "gender": "MALE",
      "address": "456 New Street, City",
      "bloodGroup": "O+",
      "status": "INACTIVE",
      "createdAt": "2025-11-22T17:04:12.456Z",
      "updatedAt": "2025-11-24T10:30:00.000Z",
      "lastLoginAt": "2025-11-23T03:11:21.516Z"
    }
  }
}
```

**Error Response (404 - Not Found):**

```json
{
  "success": false,
  "errors": [
    {
      "field": "id",
      "message": "Patient not found"
    }
  ]
}
```

**Error Response (403 - Forbidden):**

```json
{
  "success": false,
  "errors": [
    {
      "field": "authorization",
      "message": "Access denied: Insufficient permissions"
    }
  ]
}
```

**Notes:**

- Status toggles between ACTIVE ↔ INACTIVE only
- DELETED patients are not affected by this endpoint
- All status changes are logged in the audit system with admin details
- The patient's `updatedAt` timestamp is automatically updated

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

**PATCH** `/api/doctors/:id/status` - Update doctor status to APPROVED/REJECTED/INACTIVE (Protected - ADMIN only)

**PUT** `/api/doctors/me` - Update current doctor's profile (Protected - DOCTOR only)

**PATCH** `/api/doctors/:id/basic` - Update doctor basic profile by ID (Protected - DOCTOR/ADMIN only)

**GET** `/api/doctors/approved` - Get all approved doctors (Public)

**GET** `/api/doctors` - Get all doctors (Protected - Admin only)

**GET** `/api/doctors/:id` - Get doctor by ID (Protected - Doctor/Admin only)

**GET** `/api/specializations` - Get all specializations (Public)

**GET** `/api/specializations/active` - Get all active specializations (Public)

**GET** `/api/specializations/:id` - Get specialization by ID (Public)

**GET** `/api/admin/patients` - Get all patients (Protected - ADMIN only)

**GET** `/api/admin/patients/:id` - Get patient by ID (Protected - ADMIN only)

**PATCH** `/api/admin/patients/:id/status` - Toggle patient status ACTIVE ↔ INACTIVE (Protected - ADMIN only)

**GET** `/api/bills/:billId` - Get bill details (Protected - Patient/Doctor/Admin only)

**GET** `/api/bills/patients/:patientId` - Get patient's bills (Protected - Patient/Admin only)

**GET** `/api/bills/doctors/:doctorId` - Get doctor's billing records (Protected - Doctor/Admin only)

**PATCH** `/api/bills/:billId/pay` - Process bill payment (Protected - Patient only)

**GET** `/api/bills/patients/:patientId/billing-stats` - Get patient billing statistics (Protected - Patient/Admin only)

**GET** `/api/bills/doctors/:doctorId/billing-stats` - Get doctor billing statistics (Protected - Doctor/Admin only)

**GET** `/api/health` - Health check

### Specializations

#### Get All Specializations

**GET** `/api/specializations`

Get all medical specializations (both active and inactive).

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "specializations": [
      {
        "id": "spec_001",
        "name": "Cardiology",
        "description": "Heart and cardiovascular system specialist",
        "isActive": true
      },
      {
        "id": "spec_002",
        "name": "Dermatology",
        "description": "Skin, hair, and nail specialist",
        "isActive": true
      }
    ],
    "count": 6
  }
}
```

#### Get Active Specializations

**GET** `/api/specializations/active`

Get only active medical specializations (used for doctor registration).

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "specializations": [
      {
        "id": "spec_001",
        "name": "Cardiology",
        "description": "Heart and cardiovascular system specialist",
        "isActive": true
      }
    ],
    "count": 6
  }
}
```

#### Get Specialization by ID

**GET** `/api/specializations/:id`

Get a specific specialization by its ID.

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "specialization": {
      "id": "spec_001",
      "name": "Cardiology",
      "description": "Heart and cardiovascular system specialist",
      "isActive": true
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
      "field": "id",
      "message": "Specialization not found"
    }
  ]
}
```

#### Create Specialization

**POST** `/api/specializations`

Create a new medical specialization.

**Access:** ADMIN only

**Request Headers:**

```
Authorization: Bearer <admin-jwt-token>
```

**Request Body:**

```json
{
  "name": "Neurology",
  "description": "Brain and nervous system specialist"
}
```

**Validation Rules:**

- `name`: Required, 2-100 characters
- `description`: Optional, max 500 characters

**Success Response (201):**

```json
{
  "success": true,
  "message": "Specialization created successfully",
  "data": {
    "specialization": {
      "id": "spec_007",
      "name": "Neurology",
      "description": "Brain and nervous system specialist",
      "isActive": true
    }
  }
}
```

**Error Response (409 - Duplicate Name):**

```json
{
  "success": false,
  "errors": [
    {
      "field": "name",
      "message": "Specialization with this name already exists"
    }
  ]
}
```

**Error Response (401 - Unauthorized):**

```json
{
  "success": false,
  "errors": [
    {
      "field": "auth",
      "message": "Access denied. Admins only."
    }
  ]
}
```

#### Update Specialization

**PUT** `/api/specializations/:id`

Update an existing specialization. Tracks field changes with old and new values in audit logs.

**Access:** ADMIN only

**Request Headers:**

```
Authorization: Bearer <admin-jwt-token>
```

**Request Body (all fields optional):**

```json
{
  "id": "spec_new_007",
  "name": "Neurosurgery",
  "description": "Surgical treatment of nervous system disorders",
  "isActive": true
}
```

**Validation Rules:**

- `id`: Optional, 2-50 characters
- `name`: Optional, 2-100 characters (must be unique if changed)
- `description`: Optional, max 500 characters
- `isActive`: Optional, boolean

**Success Response (200):**

```json
{
  "success": true,
  "message": "Specialization updated successfully",
  "data": {
    "specialization": {
      "id": "spec_new_007",
      "name": "Neurosurgery",
      "description": "Surgical treatment of nervous system disorders",
      "isActive": true
    }
  }
}
```

**Error Response (404 - Not Found):**

```json
{
  "success": false,
  "errors": [
    {
      "field": "id",
      "message": "Specialization not found"
    }
  ]
}
```

**Error Response (409 - Duplicate Name):**

```json
{
  "success": false,
  "errors": [
    {
      "field": "name",
      "message": "Another specialization with this name already exists"
    }
  ]
}
```

#### Delete Specialization

**DELETE** `/api/specializations/:id`

Soft delete a specialization (sets `isActive: false`). Prevents deletion if any doctors are using this specialization.

**Access:** ADMIN only

**Request Headers:**

```
Authorization: Bearer <admin-jwt-token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Specialization deleted successfully",
  "data": {
    "specialization": {
      "id": "spec_007",
      "name": "Neurology",
      "description": "Brain and nervous system specialist",
      "isActive": false
    }
  }
}
```

**Error Response (404 - Not Found):**

```json
{
  "success": false,
  "errors": [
    {
      "field": "id",
      "message": "Specialization not found"
    }
  ]
}
```

**Error Response (409 - In Use):**

```json
{
  "success": false,
  "errors": [
    {
      "field": "general",
      "message": "Cannot delete specialization: 3 doctors are currently using this specialization"
    }
  ]
}
```

**Audit Logging:**

All specialization CRUD operations create audit logs with the following details:

- **CREATE:** Action `SPECIALIZATION_CREATE`, includes new specialization data
- **UPDATE:** Action `SPECIALIZATION_UPDATE`, includes changed fields with old and new values
- **DELETE:** Action `SPECIALIZATION_DELETE`, includes final state before deletion

### Billing Management

The billing system automatically generates bills when appointments are completed, using the doctor's consultation fee. Bills support payment tracking and statistics for both patients and doctors.

#### Get Bill Details

**GET** `/api/bills/:billId`

Get detailed information about a specific bill. Patients can only view their own bills, doctors can only view bills for their appointments.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "bill": {
      "id": "bill_001",
      "appointmentId": "apt_001",
      "patientId": "pat_001",
      "doctorId": "doc_001",
      "amount": 1500,
      "status": "PENDING",
      "createdAt": "2025-11-25T10:30:00.000Z",
      "updatedAt": "2025-11-25T10:30:00.000Z",
      "paidAt": null
    }
  }
}
```

**Error Response (404 - Not Found):**

```json
{
  "success": false,
  "errors": [
    {
      "field": "billId",
      "message": "Bill not found"
    }
  ]
}
```

**Error Response (403 - Forbidden):**

```json
{
  "success": false,
  "errors": [
    {
      "field": "authorization",
      "message": "Access denied: You can only view your own bills"
    }
  ]
}
```

#### Get Patient's Bills

**GET** `/api/bills/patients/:patientId?status=PENDING&startDate=2025-11-01&endDate=2025-12-31`

Get all bills for a specific patient. Only the patient themselves or admins can access this endpoint.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**

- `status` (optional): Filter by bill status (PENDING, PAID, FAILED)
- `startDate` (optional): Filter bills created on or after this date (YYYY-MM-DD)
- `endDate` (optional): Filter bills created on or before this date (YYYY-MM-DD)

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "bills": [
      {
        "id": "bill_001",
        "appointmentId": "apt_001",
        "patientId": "pat_001",
        "doctorId": "doc_001",
        "doctorName": "Dr. Rajesh Kumar",
        "doctorSpecialization": "Cardiology",
        "appointmentDate": "2025-11-25",
        "amount": 1500,
        "status": "PENDING",
        "createdAt": "2025-11-25T10:30:00.000Z",
        "paidAt": null
      }
    ],
    "count": 1
  }
}
```

#### Get Doctor's Bills

**GET** `/api/bills/doctors/:doctorId?status=PAID&startDate=2025-11-01&endDate=2025-12-31`

Get all bills for appointments with a specific doctor. Only the doctor themselves or admins can access this endpoint.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**

- `status` (optional): Filter by bill status (PENDING, PAID, FAILED)
- `startDate` (optional): Filter bills created on or after this date (YYYY-MM-DD)
- `endDate` (optional): Filter bills created on or before this date (YYYY-MM-DD)

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "bills": [
      {
        "id": "bill_001",
        "appointmentId": "apt_001",
        "patientId": "pat_001",
        "patientName": "John Doe",
        "doctorId": "doc_001",
        "appointmentDate": "2025-11-25",
        "amount": 1500,
        "status": "PAID",
        "createdAt": "2025-11-25T10:30:00.000Z",
        "paidAt": "2025-11-25T11:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

#### Pay Bill

**PATCH** `/api/bills/:billId/pay`

Mark a bill as paid. Only patients can pay their own bills.

**Headers:**

```
Authorization: Bearer <patient-jwt-token>
```

**Request Body:**

```json
{
  "paymentMethod": "CREDIT_CARD",
  "transactionId": "txn_123456789"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Bill marked as paid successfully",
  "data": {
    "bill": {
      "id": "bill_001",
      "appointmentId": "apt_001",
      "patientId": "pat_001",
      "doctorId": "doc_001",
      "amount": 1500,
      "status": "PAID",
      "paymentMethod": "CREDIT_CARD",
      "transactionId": "txn_123456789",
      "paidAt": "2025-11-25T11:00:00.000Z",
      "createdAt": "2025-11-25T10:30:00.000Z",
      "updatedAt": "2025-11-25T11:00:00.000Z"
    }
  }
}
```

**Error Response (400 - Already Paid):**

```json
{
  "success": false,
  "errors": [
    {
      "field": "status",
      "message": "Bill is already paid"
    }
  ]
}
```

**Error Response (403 - Forbidden):**

```json
{
  "success": false,
  "errors": [
    {
      "field": "authorization",
      "message": "Access denied: You can only pay your own bills"
    }
  ]
}
```

#### Get Patient Billing Statistics

**GET** `/api/bills/patients/:patientId/billing-stats?startDate=2025-11-01&endDate=2025-12-31`

Get billing statistics for a patient including total spent, pending payments, etc.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**

- `startDate` (optional): Start date for statistics (YYYY-MM-DD)
- `endDate` (optional): End date for statistics (YYYY-MM-DD)

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalBills": 5,
      "totalAmount": 7500,
      "paidAmount": 6000,
      "pendingAmount": 1500,
      "paidBills": 4,
      "pendingBills": 1,
      "failedBills": 0,
      "averageBillAmount": 1500
    }
  }
}
```

#### Get Doctor Billing Statistics

**GET** `/api/bills/doctors/:doctorId/billing-stats?startDate=2025-11-01&endDate=2025-12-31`

Get billing statistics for a doctor including total earnings, pending payments, etc.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**

- `startDate` (optional): Start date for statistics (YYYY-MM-DD)
- `endDate` (optional): End date for statistics (YYYY-MM-DD)

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalBills": 12,
      "totalEarnings": 18000,
      "paidEarnings": 15000,
      "pendingEarnings": 3000,
      "paidBills": 10,
      "pendingBills": 2,
      "failedBills": 0,
      "averageBillAmount": 1500,
      "totalPatients": 8
    }
  }
}
```

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
│   ├── bills.json
│   └── [other data files]
├── src/
│   ├── config/             # Configuration files
│   │   └── jwt.config.js
│   ├── controllers/        # Request handlers
│   │   ├── patient.controller.js
│   │   ├── doctor.controller.js
│   │   ├── admin.controller.js
│   │   ├── auth.controller.js
│   │   └── billing.controller.js
│   ├── middlewares/        # Express middlewares
│   │   ├── auth.middleware.js
│   │   ├── rateLimit.middleware.js
│   │   └── validation.middleware.js
│   ├── models/            # Data models
│   │   ├── patient.model.js
│   │   ├── doctor.model.js
│   │   ├── admin.model.js
│   │   ├── auditLog.model.js
│   │   └── billing.model.js
│   ├── repositories/      # Data access layer
│   │   ├── patient.repository.js
│   │   ├── doctor.repository.js
│   │   ├── admin.repository.js
│   │   ├── specialization.repository.js
│   │   ├── auditLog.repository.js
│   │   └── billing.repository.js
│   ├── routes/            # API routes
│   │   ├── index.js
│   │   ├── patient.routes.js
│   │   ├── doctor.routes.js
│   │   ├── admin.routes.js
│   │   ├── auth.routes.js
│   │   └── billing.routes.js
│   ├── services/          # Business logic
│   │   ├── patient.service.js
│   │   ├── doctor.service.js
│   │   ├── auth.service.js
│   │   └── billing.service.js
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

**Update doctor status (admin only):**

```bash
# Login as admin first
ADMIN_TOKEN="your-admin-jwt-token-here"

# Approve a pending doctor
curl -X PATCH http://localhost:5000/api/doctors/doc_002/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED"
  }'

# Reject a pending doctor
curl -X PATCH http://localhost:5000/api/doctors/doc_005/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "REJECTED"
  }'

# Set a doctor to inactive
curl -X PATCH http://localhost:5000/api/doctors/doc_004/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "INACTIVE"
  }'
```

**Get all specializations (public):**

```bash
curl http://localhost:5000/api/specializations
```

**Get active specializations (public):**

```bash
curl http://localhost:5000/api/specializations/active
```

**Get specialization by ID (public):**

```bash
curl http://localhost:5000/api/specializations/spec_001
```

**Get all patients (admin only):**

```bash
# Login as admin first
ADMIN_TOKEN="your-admin-jwt-token-here"

curl -X GET http://localhost:5000/api/admin/patients \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Get patient by ID (admin only):**

```bash
curl -X GET http://localhost:5000/api/admin/patients/2cd53360-4931-4fb8-afdf-8bf3de80800e \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Toggle patient status (admin only):**

```bash
curl -X PATCH http://localhost:5000/api/admin/patients/2cd53360-4931-4fb8-afdf-8bf3de80800e/status \
  -H "Authorization: Bearer $ADMIN_TOKEN"
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

**Get All Patients (Admin Only):**

1. Set method to GET
2. URL: `http://localhost:5000/api/admin/patients`
3. Headers:
   - `Authorization: Bearer <admin-token>`
4. Send request

**Get Patient by ID (Admin Only):**

1. Set method to GET
2. URL: `http://localhost:5000/api/admin/patients/2cd53360-4931-4fb8-afdf-8bf3de80800e`
3. Headers:
   - `Authorization: Bearer <admin-token>`
4. Send request

**Toggle Patient Status (Admin Only):**

1. Set method to PATCH
2. URL: `http://localhost:5000/api/admin/patients/2cd53360-4931-4fb8-afdf-8bf3de80800e/status`
3. Headers:
   - `Authorization: Bearer <admin-token>`
4. Body: None (empty)
5. Send request

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

**Update Doctor Status (Admin only):**

1. Set method to PATCH
2. URL: `http://localhost:5000/api/doctors/doc_002/status`
3. Headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer <admin-token>`
4. Body: Raw JSON:
   ```json
   {
     "status": "APPROVED"
   }
   ```
   or
   ```json
   {
     "status": "REJECTED"
   }
   ```
   or
   ```json
   {
     "status": "INACTIVE"
   }
   ```
5. Send request

**Get All Specializations (Public):**

1. Set method to GET
2. URL: `http://localhost:5000/api/specializations`
3. No authentication required

**Get Active Specializations (Public):**

1. Set method to GET
2. URL: `http://localhost:5000/api/specializations/active`
3. No authentication required

**Get Specialization by ID (Public):**

1. Set method to GET
2. URL: `http://localhost:5000/api/specializations/spec_001`
3. No authentication required

---

## Doctor Slot Management & Appointment System

### Overview

The system supports a comprehensive slot and appointment management workflow:

1. **Doctors** manually create time slots for specific dates
2. **Patients** view available slots and book appointments
3. **Doctors** can take leave, which blocks slots and notifies affected patients
4. **Patients** can reschedule or cancel appointments
5. **System** sends notifications for all important events

### Slot Management

#### Create Bulk Slots

**POST** `/api/doctors/:doctorId/slots/bulk-create`

Doctor manually creates multiple slots for a specific date.

**Headers:**

```
Authorization: Bearer <doctor-jwt-token>
```

**Request Body:**

```json
{
  "date": "2025-11-25",
  "slots": [
    {
      "startTime": "09:00",
      "endTime": "09:30"
    },
    {
      "startTime": "09:30",
      "endTime": "10:00"
    },
    {
      "startTime": "10:00",
      "endTime": "10:30"
    }
  ]
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Created 3 slots for 2025-11-25",
  "slots": [
    {
      "id": "slot_a1b2c3d4",
      "doctorId": "doc_001",
      "date": "2025-11-25",
      "startTime": "09:00",
      "endTime": "09:30",
      "status": "AVAILABLE",
      "createdAt": "2025-11-24T10:00:00.000Z"
    }
  ]
}
```

**Validation:**

- Date cannot be in the past
- startTime must be before endTime
- Slots cannot overlap with existing slots on the same date
- Doctor must be APPROVED

#### Create Quick Slots

**POST** `/api/doctors/:doctorId/slots/quick-create`

Create slots quickly by specifying time range and slot duration.

**Headers:**

```
Authorization: Bearer <doctor-jwt-token>
```

**Request Body:**

```json
{
  "date": "2025-11-25",
  "startTime": "09:00",
  "endTime": "17:00",
  "slotDurationMinutes": 30
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Created 16 slots for 2025-11-25",
  "slots": [...]
}
```

This will generate slots: 09:00-09:30, 09:30-10:00, ..., 16:30-17:00

#### Get Doctor's Slots

**GET** `/api/doctors/:doctorId/slots?startDate=2025-11-25&endDate=2025-12-25&status=AVAILABLE`

Get all slots for a doctor in a date range.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**

- `startDate` (required): Start date (YYYY-MM-DD)
- `endDate` (required): End date (YYYY-MM-DD)
- `status` (optional): Filter by status (AVAILABLE, BOOKED, BLOCKED, DELETED)

**Success Response (200):**

```json
{
  "success": true,
  "slots": {
    "2025-11-25": [
      {
        "id": "slot_001",
        "doctorId": "doc_001",
        "date": "2025-11-25",
        "startTime": "09:00",
        "endTime": "09:30",
        "status": "AVAILABLE",
        "createdAt": "2025-11-24T10:00:00.000Z"
      },
      {
        "id": "slot_002",
        "doctorId": "doc_001",
        "date": "2025-11-25",
        "startTime": "09:30",
        "endTime": "10:00",
        "status": "BOOKED",
        "createdAt": "2025-11-24T10:00:00.000Z"
      }
    ],
    "2025-11-26": []
  }
}
```

#### Get Available Slots (For Patients)

**GET** `/api/doctors/:doctorId/available-slots?startDate=2025-11-25&endDate=2025-12-25`

Get only available (bookable) slots for patients.

**Headers:**

```
Authorization: Bearer <patient-jwt-token>
```

**Success Response (200):**

```json
{
  "success": true,
  "availableSlots": {
    "2025-11-25": [
      {
        "id": "slot_001",
        "doctorId": "doc_001",
        "date": "2025-11-25",
        "startTime": "09:00",
        "endTime": "09:30",
        "status": "AVAILABLE",
        "createdAt": "2025-11-24T10:00:00.000Z"
      }
    ]
  }
}
```

**Note:** Only returns AVAILABLE slots that are in the future (excludes past slots even if AVAILABLE).

#### Update a Slot

**PUT** `/api/doctors/:doctorId/slots/:slotId`

Update a slot's details. Cannot update BOOKED slots.

**Headers:**

```
Authorization: Bearer <doctor-jwt-token>
```

**Request Body:**

```json
{
  "startTime": "10:00",
  "endTime": "10:30"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Slot updated successfully",
  "slot": {...}
}
```

#### Delete a Slot

**DELETE** `/api/doctors/:doctorId/slots/:slotId`

Delete an AVAILABLE slot. Cannot delete BOOKED slots.

**Headers:**

```
Authorization: Bearer <doctor-jwt-token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Slot deleted successfully"
}
```

**Error (400):**

```json
{
  "success": false,
  "message": "Cannot delete a booked slot. Please cancel the appointment first."
}
```

#### Bulk Delete Slots

**DELETE** `/api/doctors/:doctorId/slots/bulk-delete`

Delete multiple slots at once. Can delete by specific date or by slot IDs.

**Headers:**

```
Authorization: Bearer <doctor-jwt-token>
```

**Request Body (Delete by Date):**

```json
{
  "date": "2025-11-25"
}
```

**Request Body (Delete by Slot IDs):**

```json
{
  "slotIds": ["slot_001", "slot_002", "slot_003"]
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Successfully deleted 15 slot(s)",
  "deletedCount": 15
}
```

**Error (400):**

```json
{
  "success": false,
  "message": "Cannot delete 3 booked slot(s). Please cancel the appointments first."
}
```

**Notes:**

- Cannot delete BOOKED slots
- All slots must belong to the requesting doctor
- Either `date` or `slotIds` must be provided

#### Bulk Update Slot Status

**PATCH** `/api/doctors/:doctorId/slots/bulk-status`

Update status of multiple slots at once (AVAILABLE ↔ BLOCKED).

**Headers:**

```
Authorization: Bearer <doctor-jwt-token>
```

**Request Body (Block all slots on a date):**

```json
{
  "date": "2025-11-25",
  "status": "BLOCKED",
  "reason": "Personal emergency"
}
```

**Request Body (Unblock specific slots):**

```json
{
  "slotIds": ["slot_001", "slot_002", "slot_003"],
  "status": "AVAILABLE"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Successfully updated 10 slot(s) to BLOCKED",
  "updatedCount": 10,
  "slots": [
    {
      "id": "slot_001",
      "doctorId": "doc_001",
      "date": "2025-11-25",
      "startTime": "09:00",
      "endTime": "09:30",
      "status": "BLOCKED",
      "blockedReason": "Personal emergency",
      "blockedAt": "2025-11-24T14:30:00.000Z"
    }
  ]
}
```

**Error (400):**

```json
{
  "success": false,
  "message": "Cannot change status of 2 booked slot(s). Please handle appointments first."
}
```

**Notes:**

- Status can only be changed to `AVAILABLE` or `BLOCKED`
- Cannot change status of BOOKED slots
- `reason` is required when blocking slots
- Either `date` or `slotIds` must be provided

### Leave Management

#### Apply for Leave

**POST** `/api/doctors/:doctorId/leaves`

Doctor applies for leave. System automatically:

1. Blocks all AVAILABLE slots for those dates
2. Marks BOOKED slots as requiring action
3. Sends notifications to patients with booked appointments

**Headers:**

```
Authorization: Bearer <doctor-jwt-token>
```

**Request Body:**

```json
{
  "startDate": "2025-12-01",
  "endDate": "2025-12-05",
  "reason": "Medical emergency"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Leave applied successfully",
  "leave": {
    "id": "leave_001",
    "doctorId": "doc_001",
    "startDate": "2025-12-01",
    "endDate": "2025-12-05",
    "reason": "Medical emergency",
    "status": "APPROVED",
    "affectedSlotsCount": 80,
    "affectedAppointmentsCount": 3,
    "createdAt": "2025-11-24T12:00:00.000Z"
  },
  "summary": {
    "blockedSlots": 80,
    "affectedAppointments": 3,
    "notificationsSent": 3
  }
}
```

**Process:**

- All AVAILABLE slots → status changes to BLOCKED
- All BOOKED slots → status changes to BLOCKED, appointment marked as PENDING with requiresAction=true
- Patients receive notifications asking them to reschedule or cancel

#### Cancel Leave

**DELETE** `/api/doctors/:doctorId/leaves/:leaveId`

Cancel a previously applied leave. System automatically:

1. Unblocks all AVAILABLE slots
2. Restores BOOKED appointments back to CONFIRMED

**Headers:**

```
Authorization: Bearer <doctor-jwt-token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Leave cancelled successfully"
}
```

#### Get Doctor's Leaves

**GET** `/api/doctors/:doctorId/leaves?status=APPROVED&startDate=2025-11-01&endDate=2025-12-31`

Get all leaves for a doctor.

**Headers:**

```
Authorization: Bearer <doctor-jwt-token>
```

**Query Parameters:**

- `status` (optional): Filter by status (APPROVED, PENDING, CANCELLED)
- `startDate` (optional): Filter leaves ending on or after this date
- `endDate` (optional): Filter leaves starting on or before this date

**Success Response (200):**

```json
{
  "success": true,
  "leaves": [
    {
      "id": "leave_001",
      "doctorId": "doc_001",
      "startDate": "2025-12-01",
      "endDate": "2025-12-05",
      "reason": "Medical emergency",
      "status": "APPROVED",
      "affectedSlotsCount": 80,
      "affectedAppointmentsCount": 3,
      "createdAt": "2025-11-24T12:00:00.000Z"
    }
  ]
}
```

### Appointment Management

#### Book an Appointment

**POST** `/api/appointments/book`

Patient books an available slot.

**Headers:**

```
Authorization: Bearer <patient-jwt-token>
```

**Request Body:**

```json
{
  "patientId": "pat_001",
  "slotId": "slot_001",
  "reason": "Chest pain and breathing difficulty"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "appointment": {
    "id": "apt_001",
    "doctorName": "Dr. Ajay Menon",
    "doctorSpecialization": "MBBS, MD (Cardiology)",
    "date": "2025-11-25",
    "startTime": "09:00",
    "endTime": "09:30",
    "consultationFee": 1800,
    "billId": "bill_001"
  }
}
```

**Validation:**

- Slot must exist and be AVAILABLE
- Cannot book slots less than 30 minutes in advance
- Patient must be ACTIVE
- Doctor must be APPROVED

**Process:**

1. Creates appointment with status CONFIRMED
2. Updates slot status to BOOKED
3. Creates bill entry
4. Sends confirmation notification to patient

#### Reschedule an Appointment

**PUT** `/api/appointments/:appointmentId/reschedule`

Patient reschedules to a different slot.

**Headers:**

```
Authorization: Bearer <patient-jwt-token>
```

**Request Body:**

```json
{
  "newSlotId": "slot_050"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Appointment rescheduled successfully",
  "appointment": {
    "id": "apt_001",
    "date": "2025-11-27",
    "startTime": "10:00",
    "endTime": "10:15"
  }
}
```

**Process:**

1. Releases old slot (makes AVAILABLE or keeps BLOCKED if leave day)
2. Books new slot (changes to BOOKED)
3. Updates appointment with new date/time
4. Clears any requiresAction flags
5. Sends notification

#### Cancel an Appointment

**DELETE** `/api/appointments/:appointmentId/cancel`

Patient or doctor cancels an appointment.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Request Body:**

```json
{
  "reason": "Not needed anymore"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Appointment cancelled successfully"
}
```

**Process:**

1. Updates appointment status to CANCELLED
2. Releases slot (makes AVAILABLE or keeps BLOCKED if leave day)
3. Processes refund (if bill was paid)
4. Sends cancellation notification

#### Complete an Appointment (Doctor Only)

**PUT** `/api/appointments/:appointmentId/complete`

Doctor marks appointment as completed.

**Headers:**

```
Authorization: Bearer <doctor-jwt-token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Appointment marked as completed"
}
```

#### Get Patient's Appointments

**GET** `/api/patients/:patientId/appointments?status=CONFIRMED&startDate=2025-11-01&endDate=2025-12-31`

Get all appointments for a patient.

**Headers:**

```
Authorization: Bearer <patient-jwt-token>
```

**Query Parameters:**

- `status` (optional): Filter by status (PENDING, CONFIRMED, COMPLETED, CANCELLED)
- `startDate` (optional): Filter appointments on or after this date
- `endDate` (optional): Filter appointments on or before this date

**Success Response (200):**

```json
{
  "success": true,
  "appointments": [
    {
      "id": "apt_001",
      "patientId": "pat_001",
      "doctorId": "doc_001",
      "doctorName": "Dr. Ajay Menon",
      "doctorSpecialization": "MBBS, MD (Cardiology)",
      "slotId": "slot_002",
      "appointmentDate": "2025-11-25",
      "startTime": "09:30",
      "endTime": "10:00",
      "status": "CONFIRMED",
      "reason": "Chest pain consultation",
      "requiresAction": false,
      "createdAt": "2025-11-24T11:00:00.000Z"
    }
  ]
}
```

#### Get Doctor's Appointments

**GET** `/api/doctors/:doctorId/appointments?status=CONFIRMED`

Get all appointments for a doctor.

**Headers:**

```
Authorization: Bearer <doctor-jwt-token>
```

**Success Response (200):**

```json
{
  "success": true,
  "appointments": [
    {
      "id": "apt_001",
      "patientId": "pat_001",
      "patientName": "Rahul Kumar",
      "patientPhone": "+919876543210",
      "doctorId": "doc_001",
      "slotId": "slot_002",
      "appointmentDate": "2025-11-25",
      "startTime": "09:30",
      "endTime": "10:00",
      "status": "CONFIRMED",
      "reason": "Chest pain consultation",
      "createdAt": "2025-11-24T11:00:00.000Z"
    }
  ]
}
```

#### Get Appointment Details

**GET** `/api/appointments/:appointmentId`

Get detailed information about a specific appointment.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Success Response (200):**

```json
{
  "success": true,
  "appointment": {
    "id": "apt_001",
    "patientId": "pat_001",
    "patientName": "Rahul Kumar",
    "patientPhone": "+919876543210",
    "doctorId": "doc_001",
    "doctorName": "Dr. Ajay Menon",
    "doctorSpecialization": "MBBS, MD (Cardiology)",
    "slotId": "slot_002",
    "appointmentDate": "2025-11-25",
    "startTime": "09:30",
    "endTime": "10:00",
    "status": "CONFIRMED",
    "reason": "Chest pain consultation",
    "requiresAction": false,
    "billId": "bill_001",
    "createdAt": "2025-11-24T11:00:00.000Z",
    "updatedAt": "2025-11-24T11:00:00.000Z"
  }
}
```

### Notification Management

#### Get Patient's Notifications

**GET** `/api/patients/:patientId/notifications?isRead=false&actionRequired=true`

Get all notifications for a patient.

**Headers:**

```
Authorization: Bearer <patient-jwt-token>
```

**Query Parameters:**

- `isRead` (optional): Filter by read status (true/false)
- `actionRequired` (optional): Filter by action required (true/false)

**Success Response (200):**

```json
{
  "success": true,
  "notifications": [
    {
      "id": "notif_001",
      "userId": "pat_001",
      "userType": "PATIENT",
      "type": "RESCHEDULE_REQUIRED",
      "title": "Appointment Needs Rescheduling",
      "message": "Your appointment with Dr. Ajay Menon on November 25 at 09:30 has been affected due to doctor's leave. Please reschedule or cancel.",
      "appointmentId": "apt_001",
      "actionRequired": true,
      "actionReason": "Doctor unavailable due to leave",
      "isRead": false,
      "createdAt": "2025-11-24T12:00:00.000Z"
    }
  ]
}
```

**Notification Types:**

- `APPOINTMENT_CONFIRMED`: Appointment successfully booked
- `APPOINTMENT_CANCELLED`: Appointment cancelled
- `APPOINTMENT_COMPLETED`: Consultation completed
- `RESCHEDULE_REQUIRED`: Doctor on leave, patient action needed
- `APPOINTMENT_REMINDER`: Upcoming appointment reminder
- `GENERAL`: General notification

#### Mark Notification as Read

**PUT** `/api/notifications/:notificationId/read`

Mark a notification as read.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Notification marked as read",
  "notification": {
    "id": "notif_001",
    "isRead": true,
    "readAt": "2025-11-24T14:00:00.000Z"
  }
}
```

#### Delete Notification

**DELETE** `/api/notifications/:notificationId`

Delete a notification permanently.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

### Complete Workflow Example

**1. Doctor Creates Slots:**

```bash
curl -X POST http://localhost:5000/api/doctors/doc_001/slots/quick-create \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-11-25",
    "startTime": "09:00",
    "endTime": "17:00",
    "slotDurationMinutes": 30
  }'
```

**2. Patient Views Available Slots:**

```bash
curl -X GET "http://localhost:5000/api/doctors/doc_001/available-slots?startDate=2025-11-25&endDate=2025-12-25" \
  -H "Authorization: Bearer $PATIENT_TOKEN"
```

**3. Patient Books Appointment:**

```bash
curl -X POST http://localhost:5000/api/appointments/book \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "pat_001",
    "slotId": "slot_002",
    "reason": "Chest pain consultation"
  }'
```

**4. Doctor Takes Leave:**

```bash
curl -X POST http://localhost:5000/api/doctors/doc_001/leaves \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2025-11-25",
    "endDate": "2025-11-25",
    "reason": "Medical emergency"
  }'
```

**5. Patient Checks Notifications:**

```bash
curl -X GET "http://localhost:5000/api/patients/pat_001/notifications?actionRequired=true" \
  -H "Authorization: Bearer $PATIENT_TOKEN"
```

**6. Patient Reschedules:**

```bash
curl -X PUT http://localhost:5000/api/appointments/apt_001/reschedule \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newSlotId": "slot_050"
  }'
```

**7. Doctor Blocks All Slots for a Day:**

```bash
curl -X PATCH http://localhost:5000/api/doctors/doc_001/slots/bulk-status \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-12-15",
    "status": "BLOCKED",
    "reason": "Conference attendance"
  }'
```

**8. Doctor Deletes All Slots for a Specific Day:**

```bash
curl -X DELETE http://localhost:5000/api/doctors/doc_001/slots/bulk-delete \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-12-20"
  }'
```

**9. Doctor Unblocks Specific Slots:**

```bash
curl -X PATCH http://localhost:5000/api/doctors/doc_001/slots/bulk-status \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slotIds": ["slot_100", "slot_101", "slot_102"],
    "status": "AVAILABLE"
  }'
```

### Slot Status Flow

```
AVAILABLE → Patient books → BOOKED
AVAILABLE → Doctor takes leave → BLOCKED
BOOKED → Doctor takes leave → BLOCKED (appointment marked for action)
BOOKED → Patient cancels → AVAILABLE (or BLOCKED if leave day)
BOOKED → Appointment completes → BOOKED (stays booked, just for records)
```

### Appointment Status Flow

```
PENDING → Initial booking (rarely used, goes straight to CONFIRMED)
CONFIRMED → Normal active appointment
CONFIRMED → Doctor takes leave → PENDING (with requiresAction=true)
CONFIRMED/PENDING → Cancellation → CANCELLED
CONFIRMED → Doctor completes → COMPLETED
```

### Data Models

**Slot:**

```json
{
  "id": "slot_001",
  "doctorId": "doc_001",
  "date": "2025-11-25",
  "startTime": "09:00",
  "endTime": "09:30",
  "status": "AVAILABLE|BOOKED|BLOCKED|DELETED",
  "appointmentId": "apt_001|null",
  "blockedReason": "Doctor on leave|null",
  "blockedAt": "2025-11-24T12:00:00.000Z|null",
  "bookedAt": "2025-11-24T11:00:00.000Z|null",
  "createdBy": "doc_001",
  "createdAt": "2025-11-24T10:00:00.000Z",
  "updatedAt": "2025-11-24T10:00:00.000Z"
}
```

**Appointment:**

```json
{
  "id": "apt_001",
  "patientId": "pat_001",
  "doctorId": "doc_001",
  "slotId": "slot_002",
  "appointmentDate": "2025-11-25",
  "startTime": "09:30",
  "endTime": "10:00",
  "status": "PENDING|CONFIRMED|COMPLETED|CANCELLED",
  "reason": "Chest pain consultation",
  "requiresAction": false,
  "actionReason": "Doctor on leave - please reschedule or cancel|null",
  "cancelledBy": "PATIENT|DOCTOR|null",
  "cancellationReason": "Not needed anymore|null",
  "cancelledAt": "2025-11-25T08:00:00.000Z|null",
  "billId": "bill_001",
  "chatAllowed": true,
  "createdAt": "2025-11-24T11:00:00.000Z",
  "updatedAt": "2025-11-24T11:00:00.000Z"
}
```

**Leave:**

```json
{
  "id": "leave_001",
  "doctorId": "doc_001",
  "startDate": "2025-12-01",
  "endDate": "2025-12-05",
  "reason": "Medical emergency",
  "status": "PENDING|APPROVED|REJECTED|CANCELLED",
  "affectedSlots": ["slot_001", "slot_002", ...],
  "affectedAppointments": ["apt_001", "apt_002"],
  "createdAt": "2025-11-24T12:00:00.000Z",
  "updatedAt": "2025-11-24T12:00:00.000Z"
}
```

**Notification:**

```json
{
  "id": "notif_001",
  "userId": "pat_001",
  "userType": "PATIENT|DOCTOR",
  "type": "RESCHEDULE_REQUIRED|APPOINTMENT_CONFIRMED|...",
  "title": "Appointment Needs Rescheduling",
  "message": "Your appointment with Dr. Ajay Menon...",
  "appointmentId": "apt_001",
  "actionRequired": true,
  "actionReason": "Doctor unavailable due to leave",
  "isRead": false,
  "readAt": null,
  "resolvedAt": null,
  "createdAt": "2025-11-24T12:00:00.000Z"
}
```
