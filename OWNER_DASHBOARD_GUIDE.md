# Owner Dashboard - Complete Guide

## Overview
The Owner Dashboard is a comprehensive management system for barbershop owners to manage their branches, staff, and monitor operations. It features three main sections: **Branches**, **Staff**, and **Reports**.

## 🏢 **Branches Section**

### Features:
- **View All Branches**: See all branches with their services and staff counts
- **Create New Branch**: Add new branches to your network
- **Add Services**: Add services to existing branches with pricing
- **Branch Details**: View services, staff counts, and branch information

### Branch Management Flow:
1. **Create Branch**: Click "Create New Branch" → Enter branch name → Create
2. **Add Services**: Click "Add Service" on any branch → Enter service details → Add
3. **View Services**: Each branch card shows all services with pricing
4. **Staff Overview**: See admin, barber, and washer counts per branch

### Branch Data Structure:
```javascript
{
  _id: "branch_id",
  name: "Branch Name",
  ownerId: "owner_id",
  services: [
    {
      name: "Haircut",
      barberPrice: 200,
      washerPrice: 50
    }
  ],
  createdAt: "2025-07-31T..."
}
```

## 👥 **Staff Section**

### Features:
- **Branch Staff View**: See all staff organized by branch
- **Role-based Filtering**: View admins, barbers, and washers separately
- **Staff Details**: View staff information and access reports
- **Navigation**: Easy navigation between branches and staff

### Staff Management Flow:
1. **View All Branches**: See staff counts for each branch
2. **Select Branch**: Click "View Staff" to see detailed staff list
3. **Filter by Role**: Staff organized by admin, barber, washer roles
4. **Access Reports**: Click "View Reports" to see individual staff operations

### Staff Data Structure:
```javascript
{
  _id: "user_id",
  name: "Staff Name",
  role: "admin" | "barber" | "washer",
  branchId: "branch_id",
  phone: "phone_number",
  serviceOperations: [...], // For workers
  adminServiceOperations: [...] // For admins
}
```

## 📊 **Reports Section**

### Features:
- **Individual Staff Reports**: View operations for specific staff members
- **Date-based Grouping**: Operations organized by date
- **Status Management**: Update operation status from pending to finished
- **Bulk Updates**: Mark all operations for a date as finished
- **Ethiopian Calendar**: Display dates in Ethiopian format with times

### Reports Management Flow:
1. **Select Staff**: Choose staff member from Staff section
2. **View Operations**: See all operations grouped by date
3. **Individual Updates**: Click ✓ to mark individual operations as finished
4. **Bulk Updates**: Click "Mark All Finished" to update all pending operations for a date

### Operation Data Structure:

#### For Workers (Barbers/Washers):
```javascript
{
  name: "Service Name",
  price: 100, // Calculated share (50% for barber, 10% for washer)
  originalPrice: 200, // Full price reference
  status: "pending" | "finished",
  createdAt: "2025-07-31T12:30:00.000Z"
}
```

#### For Admins:
```javascript
{
  name: "Service Name",
  price: 200, // Full price
  workerName: "Worker Name",
  workerRole: "barber" | "washer",
  workerId: "worker_id",
  status: "pending" | "finished",
  createdAt: "2025-07-31T12:30:00.000Z"
}
```

## 🔧 **API Endpoints**

### Branch Management:
- `GET /api/branches?ownerId={ownerId}` - Get all branches for owner
- `POST /api/branches` - Create new branch
- `POST /api/branches/{branchId}/services` - Add service to branch

### Staff Management:
- `GET /api/users?ownerId={ownerId}` - Get all users for owner

### Operations Management:
- `GET /api/users/{userId}/operations?date={date}` - Get operations for user by date
- `PATCH /api/users/{userId}/operations/{operationId}` - Update operation status

## 🎯 **Key Features**

### 1. **Role-Based Access**
- Owner can view all branches and staff
- Different views for admins vs workers
- Proper authorization checks

### 2. **Date Management**
- Operations grouped by date
- Ethiopian calendar integration
- Time display for detailed tracking

### 3. **Status Management**
- Individual operation status updates
- Bulk status updates by date
- Visual status indicators

### 4. **Navigation**
- Tab-based navigation between sections
- Contextual navigation (branch → staff → reports)
- Breadcrumb-style navigation

### 5. **Data Visualization**
- Clean card-based layouts
- Color-coded status indicators
- Responsive design for all screen sizes

## 📱 **User Interface**

### Navigation Tabs:
- **Branches**: Branch management and overview
- **Staff**: Staff management and selection
- **Reports**: Operations and status management

### Modal Dialogs:
- **Create Branch**: Simple branch creation
- **Add Service**: Service creation with pricing
- **Status Updates**: Confirmation dialogs

### Responsive Design:
- Mobile-friendly layouts
- Touch-friendly buttons
- Adaptive grid systems

## 🔒 **Security Features**

### Authentication:
- JWT token verification
- Role-based access control
- Owner-only operations

### Data Protection:
- Secure API endpoints
- Input validation
- Error handling

## 🚀 **Usage Examples**

### Creating a New Branch:
1. Navigate to Branches section
2. Click "Create New Branch"
3. Enter branch name
4. Click "Create Branch"

### Adding Services:
1. Select a branch
2. Click "Add Service"
3. Enter service name and prices
4. Click "Add Service"

### Managing Staff Operations:
1. Go to Staff section
2. Select a branch
3. Choose a staff member
4. Click "View Reports"
5. Update operation statuses

### Bulk Status Updates:
1. In Reports section, select a date
2. Click "Mark All Finished"
3. All pending operations for that date are updated

## 📈 **Future Enhancements**

### Potential Features:
- **Analytics Dashboard**: Revenue and performance metrics
- **Export Functionality**: PDF/Excel reports
- **Advanced Filtering**: Date ranges, status filters
- **Real-time Updates**: WebSocket integration
- **Mobile App**: Native mobile application

### Performance Optimizations:
- **Pagination**: For large datasets
- **Caching**: API response caching
- **Lazy Loading**: On-demand data loading
- **Search**: Global search functionality

## 🛠 **Technical Implementation**

### Frontend:
- **Next.js 14**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **SWR**: Data fetching
- **Dialog Components**: Modal management

### Backend:
- **MongoDB**: Database
- **Mongoose**: ODM
- **JWT**: Authentication
- **REST API**: Endpoints

### Key Components:
- **OwnerDashboard**: Main component
- **Navigation Tabs**: Section switching
- **Branch Cards**: Branch management
- **Staff Lists**: Staff organization
- **Operation Reports**: Status management 