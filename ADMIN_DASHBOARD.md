# Admin Dashboard - Branch-Based Management

## Overview
The admin dashboard now fetches data based on the admin's chosen branch ID during login. This ensures that admins only see and manage data relevant to their specific branch.

## Features

### 1. Branch-Specific Data Loading
- **Services**: Fetches all services for the admin's branch
- **Workers**: Fetches all barbers and washers assigned to the admin's branch
- **Real-time Updates**: Data refreshes automatically when changes are made

### 2. User Authentication Integration
- Gets `branchId` from logged-in user's data
- Shows admin name and branch ID on dashboard
- Loading states while user data is being retrieved

### 3. Service Management
- View all services for the branch
- Add new services with name and price
- Assign workers to specific services
- Track service completion status

### 4. Worker Management
- View all barbers and washers in the branch
- See worker roles and names
- Filter workers by role for service assignment

## API Endpoints

### 1. Get Workers for Branch (`/api/workers`)
**GET** - Returns barbers and washers for a specific branch

**Query Parameters:**
```
?branchId=688294f5743c94e2c19b8487
```

**Response:**
```json
[
  {
    "_id": "user_id",
    "name": "John Doe",
    "role": "barber",
    "phone": "1234567890",
    "branchId": "688294f5743c94e2c19b8487"
  }
]
```

### 2. Get Services for Branch (`/api/services/[branchId]`)
**GET** - Returns services array from branch document

**Response:**
```json
[
  {
    "name": "Haircut",
    "price": 25
  },
  {
    "name": "Hair Wash",
    "price": 15
  }
]
```

### 3. Add Service to Branch (`/api/branches/[id]/services`)
**POST** - Adds new service to branch's services array

**Request Body:**
```json
{
  "name": "New Service",
  "price": 30
}
```

## Database Queries

### Workers Query
```javascript
// Find users with barber/washer roles for specific branch
User.find({
  branchId: branchId,
  role: { $in: ["barber", "washer"] }
}).select("-password")
```

### Services Query
```javascript
// Get services array from branch document
Branch.findById(branchId).services
```

### Add Service Query
```javascript
// Add service to branch's services array
Branch.findByIdAndUpdate(
  branchId,
  { $push: { services: { name, price } } },
  { new: true }
)
```

## Frontend Implementation

### Data Fetching
- Uses SWR for data fetching and caching
- Conditional fetching based on branchId availability
- Loading states for better UX

### User Data Retrieval
```javascript
useEffect(() => {
  const userData = getUserFromLocalStorage();
  if (userData) {
    setUser(userData);
    setBranchId(userData.branchId);
  }
}, []);
```

### Conditional API Calls
```javascript
// Only fetch when branchId is available
const { data: workers } = useSWR(
  branchId ? `/api/workers?branchId=${branchId}` : null,
  fetcher
);
```

## Security Features

1. **Branch Isolation**: Admins only see data for their assigned branch
2. **User Validation**: Verifies user data before loading dashboard
3. **Input Validation**: Validates service data before adding
4. **Error Handling**: Graceful error handling for API failures

## Usage Flow

1. **Login**: Admin logs in and selects their branch
2. **Dashboard Load**: System retrieves user data and branchId
3. **Data Fetching**: Fetches workers and services for the branch
4. **Management**: Admin can view and manage branch-specific data

## Error Scenarios

- **No User Data**: Shows loading state until user data is retrieved
- **No BranchId**: Dashboard won't load until branchId is available
- **API Failures**: Shows error messages and retry options
- **Empty Data**: Shows appropriate messages for no workers/services

## Testing

Run the test script to verify functionality:
```bash
node test-admin-dashboard.js
```

This will test:
- Workers API with branchId
- Services API for specific branch
- Adding new services to branch 