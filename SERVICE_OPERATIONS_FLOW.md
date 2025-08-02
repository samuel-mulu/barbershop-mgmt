# Service Operations Flow - Simple Explanation

## Overview
When admin submits services, data is saved in TWO places:
1. **Worker users** - get their calculated share (50% for barber, 10% for washer)
2. **Admin user** - gets full information with worker names and full prices

## Full Flow

### 1. Admin Submits Services
**Admin Dashboard** → **Two API Calls**:
- `/api/users/service-operations` (for workers)
- `/api/admin/service-operations` (for admin)

### 2. Worker API (`/api/users/service-operations`)
**What it does:**
- Takes service data
- Calculates worker shares:
  - **Barber**: 50% of their price
  - **Washer**: 10% of their price
- Saves to worker's `serviceOperations` array

**Example:**
```javascript
// Barber gets this in their user document:
{
  name: "John Doe",
  role: "barber",
  serviceOperations: [{
    name: "Haircut",
    price: 100,        // 50% of $200
    originalPrice: 200, // Full price for reference
    status: "pending"
  }]
}
```

### 3. Admin API (`/api/admin/service-operations`)
**What it does:**
- Takes service data with worker names
- Saves full prices and worker details
- Saves to admin's `adminServiceOperations` array

**Example:**
```javascript
// Admin gets this in their user document:
{
  name: "Admin User",
  role: "admin",
  adminServiceOperations: [{
    name: "Haircut",
    price: 200,           // Full price
    workerName: "John Doe",
    workerRole: "barber",
    workerId: "worker_id",
    status: "pending"
  }]
}
```

### 4. How Workers See Their Data
**Barber Dashboard:**
- Shows: "Your Share (50%)" = $100
- Shows: "Original Price" = $200
- Only sees their own operations

**Washer Dashboard:**
- Shows: "Your Share (10%)" = $20
- Shows: "Original Price" = $200
- Only sees their own operations

### 5. How Admin Sees All Data
**Admin Dashboard:**
- Shows: "Full Price" = $200
- Shows: "Worker Name" = "John Doe"
- Shows: "Worker Role" = "barber"
- Sees all operations with full details

## Database Structure

### User Document (Same Collection)
```javascript
{
  _id: "user_id",
  name: "User Name",
  role: "admin" | "barber" | "washer",
  
  // For workers (barber/washer)
  serviceOperations: [
    {
      name: "Service Name",
      price: calculatedShare,    // 50% or 10%
      originalPrice: fullPrice,  // Reference
      status: "pending"
    }
  ],
  
  // For admin only
  adminServiceOperations: [
    {
      name: "Service Name",
      price: fullPrice,          // Full price
      workerName: "Worker Name",
      workerRole: "barber" | "washer",
      workerId: "worker_id",
      status: "pending"
    }
  ]
}
```

## Key Points

1. **One Collection**: All users in same `users` collection
2. **Role-Based**: Different arrays based on user role
3. **Automatic**: API handles missing fields automatically
4. **Separate Views**: Workers see shares, admin sees full details
5. **No Migration**: Works with existing users automatically 