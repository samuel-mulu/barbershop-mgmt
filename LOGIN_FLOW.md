# Barbershop Management System - Login Flow

## Overview
This document explains the updated login flow for the barbershop management system, specifically for admin, barber, and washer roles.

## Database Structure

### User Model (`app/models/User.ts`)
```typescript
{
  name: String,
  phone: String (unique),
  password: String,
  role: String (enum: ["owner", "admin", "barber", "washer", "customer"]),
  branchId: ObjectId (reference to Branch) // Required for admin/barber/washer
}
```

### Branch Model (`app/models/Branch.ts`)
```typescript
{
  name: String,
  ownerId: ObjectId (reference to Owner),
  services: [{
    name: String,
    price: Number
  }]
}
```

## Login Flow

### Step 1: Initial Login Check
1. User enters phone and password
2. System validates credentials
3. If user role is admin/barber/washer, proceed to Step 2
4. If user role is customer/owner, complete login immediately

### Step 2: Branch Selection (Admin/Barber/Washer only)
1. System fetches all available branches from database
2. User selects their branch from dropdown
3. System updates user's `branchId` in database
4. Login completes and user is redirected to dashboard

## API Endpoints

### 1. Login API (`/api/auth/login`)
**POST** - Handles both initial check and final login

**Request Body:**
```json
{
  "phone": "string",
  "password": "string",
  "branchId": "string" (optional, required for admin/barber/washer),
  "checkOnly": boolean (optional, for initial check)
}
```

**Response:**
```json
{
  "token": "jwt_token",
  "user": {
    "_id": "user_id",
    "name": "user_name",
    "phone": "phone_number",
    "role": "user_role",
    "branchId": "branch_id"
  }
}
```

### 2. Get All Branches (`/api/branches`)
**GET** - Returns all available branches for selection

**Response:**
```json
[
  {
    "_id": "branch_id",
    "name": "branch_name"
  }
]
```

### 3. Update User Branch (`/api/users/[id]`)
**PUT** - Updates user's branchId (requires authentication)

**Request Body:**
```json
{
  "branchId": "new_branch_id"
}
```

## Frontend Implementation

### Login Page (`app/login/page.tsx`)
- Two-step login process for admin/barber/washer
- Branch selection dropdown populated from API
- Automatic branchId update during login
- Loading states and error handling

## Security Features

1. **Token-based Authentication**: JWT tokens for session management
2. **Role-based Access**: Different flows for different user roles
3. **Branch Validation**: Ensures selected branch exists in database
4. **Automatic Updates**: User's branchId is updated during login if different

## Usage Example

1. **Admin Login:**
   - Enter phone: "1234567890"
   - Enter password: "password123"
   - Click "NEXT"
   - Select branch from dropdown
   - Click "LOGIN"

2. **Customer Login:**
   - Enter phone: "1234567890"
   - Enter password: "password123"
   - Click "NEXT" (automatically logs in)

## Error Handling

- Invalid credentials
- Branch not found
- User not found
- Missing required fields
- Network errors

## Database Queries

### MongoDB Collections:
- `users` - User accounts and roles
- `branches` - Branch information
- `owners` - Owner accounts

### Key Queries:
- Find user by phone: `User.findOne({ phone })`
- Find all branches: `Branch.find().select("_id name")`
- Update user branchId: `User.findByIdAndUpdate(userId, { branchId })`
- Validate branch exists: `Branch.findById(branchId)` 