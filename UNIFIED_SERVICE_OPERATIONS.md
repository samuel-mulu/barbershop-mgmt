# Unified Service Operations Structure

## Overview
Merged AdminServiceOperation into the User model to create a unified structure where both worker and admin service operations are stored in the same User collection, distinguished by user role.

## New User Model Structure

### User Schema (`app/models/User.ts`)
```javascript
{
  name: String,
  phone: String,
  password: String,
  role: "owner" | "admin" | "barber" | "washer" | "customer",
  branchId: ObjectId,
  serviceOperations: [WorkerServiceOperation], // For barber/washer
  adminServiceOperations: [AdminServiceOperation] // For admin
}
```

### Worker Service Operations (for barber/washer)
```javascript
{
  name: "Service Name",
  price: calculatedPrice, // 50% for barber, 10% for washer
  originalPrice: fullPrice, // Reference to full price
  status: "pending" | "finished",
  createdAt: Date
}
```

### Admin Service Operations (for admin)
```javascript
{
  name: "Service Name",
  price: fullPrice, // Full original price
  status: "pending" | "finished",
  createdAt: Date,
  workerName: "Full Worker Name",
  workerRole: "barber" | "washer",
  workerId: ObjectId
}
```

## How It Works

### 1. **Role-Based Storage**
- **Admin Users**: Store service operations in `adminServiceOperations` array
- **Worker Users**: Store service operations in `serviceOperations` array
- **Distinction**: Based on user role in the same User collection

### 2. **API Structure**
- **Worker API**: `/api/users/service-operations` - Handles worker operations
- **Admin API**: `/api/admin/service-operations` - Handles admin operations
- **Unified Storage**: Both APIs store data in the same User model

### 3. **Data Flow**

#### When Admin Submits Services:
1. **Worker API**: Creates entries in worker users' `serviceOperations` (calculated prices)
2. **Admin API**: Creates entries in admin user's `adminServiceOperations` (full prices + worker details)

#### Example:
**Service**: Haircut + Wash
**Original Prices**: Barber $200, Washer $50

**Worker Database** (User.serviceOperations):
```javascript
// Barber's user record
{
  name: "John Doe",
  role: "barber",
  serviceOperations: [{
    name: "Haircut + Wash",
    price: 100, // 50% of $200
    originalPrice: 200,
    status: "pending"
  }]
}

// Washer's user record
{
  name: "Jane Smith", 
  role: "washer",
  serviceOperations: [{
    name: "Haircut + Wash",
    price: 5, // 10% of $50
    originalPrice: 50,
    status: "pending"
  }]
}
```

**Admin Database** (User.adminServiceOperations):
```javascript
// Admin's user record
{
  name: "Admin User",
  role: "admin",
  adminServiceOperations: [
    {
      name: "Haircut + Wash",
      price: 200, // Full price
      workerName: "John Doe",
      workerRole: "barber",
      workerId: "barber_user_id",
      status: "pending"
    },
    {
      name: "Haircut + Wash", 
      price: 50, // Full price
      workerName: "Jane Smith",
      workerRole: "washer",
      workerId: "washer_user_id",
      status: "pending"
    }
  ]
}
```

## Benefits

1. **Unified Data Model**: All service operations in one collection
2. **Role-Based Access**: Easy to distinguish by user role
3. **Simplified Database**: No separate collections needed
4. **Better Performance**: Single collection queries
5. **Easier Maintenance**: One model to manage

## API Endpoints

### Worker Service Operations
- **POST** `/api/users/service-operations` - Create worker operations
- **GET** `/api/users/service-operations?userId=X` - Get worker operations
- **GET** `/api/users/service-operations?branch=X` - Get all worker operations in branch

### Admin Service Operations  
- **POST** `/api/admin/service-operations` - Create admin operations
- **GET** `/api/admin/service-operations?branch=X` - Get admin operations in branch

## Querying Examples

### Get Worker Operations
```javascript
// Get specific worker's operations
const worker = await User.findById(workerId);
const operations = worker.serviceOperations;

// Get all worker operations in branch
const workers = await User.find({ 
  branchId: branchId, 
  role: { $in: ["barber", "washer"] } 
});
```

### Get Admin Operations
```javascript
// Get admin's operations
const admin = await User.findById(adminId);
const adminOperations = admin.adminServiceOperations;

// Get all admin operations in branch
const admins = await User.find({ 
  branchId: branchId, 
  role: "admin" 
});
```

## Migration Notes

- **Existing Data**: Worker service operations remain unchanged
- **New Structure**: Admin operations now stored in User model
- **Backward Compatibility**: All existing APIs continue to work
- **No Data Loss**: All existing service operations preserved 