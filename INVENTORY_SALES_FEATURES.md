# Inventory & Sales Management Features

## Overview

The barbershop management system now includes comprehensive inventory and sales management capabilities. These features allow admins to track products, manage inventory, record sales, and handle withdrawals.

## Database Schema

### Product Model (`app/models/Product.ts`)

**Fields:**
- `name` (String, required): Product name
- `quantity` (Number, required): Available quantity
- `quantityType` (Enum): 'pack', 'single', 'box', 'bottle', 'piece'
- `pricePerUnit` (Number, required): Price per unit
- `totalPrice` (Number, required): Auto-calculated (quantity × pricePerUnit)
- `adminId` (ObjectId, required): Reference to admin who added the product
- `branchId` (ObjectId): Reference to branch
- `createdAt`, `updatedAt` (Date): Timestamps

**Features:**
- Automatic total price calculation
- Virtual field for formatted display name
- Validation for quantity types

### Sale Model (`app/models/Sale.ts`)

**Fields:**
- `type` (Enum): 'product_sale' or 'withdrawal'
- `productSales` (Array): For product sales - contains sold items
- `withdrawalReason` (String): For withdrawals
- `withdrawalAmount` (Number): For withdrawals
- `totalAmount` (Number, required): Auto-calculated total
- `adminId` (ObjectId, required): Reference to admin
- `adminName` (String, required): Admin name for display
- `branchId` (ObjectId): Reference to branch
- `createdAt`, `updatedAt` (Date): Timestamps

**Product Sale Structure:**
```javascript
{
  productName: string,
  soldQuantity: number,
  pricePerUnit: number,
  totalSoldMoney: number,
  productId: ObjectId
}
```

**Features:**
- Automatic total amount calculation
- Virtual fields for display
- Automatic inventory reduction on sales

## API Endpoints

### Products API (`/api/products`)

**GET** - List all products for the admin
- Requires admin authentication
- Returns products sorted by creation date

**POST** - Add new product
- Requires: name, quantity, quantityType, pricePerUnit
- Validates quantity types
- Auto-calculates total price

### Sales API (`/api/sales`)

**GET** - List all sales for the admin
- Requires admin authentication
- Returns sales sorted by creation date

**POST** - Record new sale
- Supports two types:
  1. **Product Sale**: Requires productSales array
  2. **Withdrawal**: Requires withdrawalReason and withdrawalAmount
- Automatically updates product quantities
- Validates sufficient inventory

## UI Components

### ProductManagement Component

**Features:**
- Add new products with modal form
- View product history with toggle
- Real-time total price calculation
- Quantity type selection
- Form validation

**UI Elements:**
- Product name input
- Quantity and quantity type selection
- Price per unit input
- Total value display
- Product history table

### SalesManagement Component

**Features:**
- Record product sales with multiple products
- Record withdrawals with reason
- View sales history with toggle
- Real-time total calculation
- Product selection with available quantities

**UI Elements:**
- Sale type selection (Product Sale/Withdrawal)
- Product selection dropdowns
- Quantity inputs
- Withdrawal reason textarea
- Sales history table with color coding

## User Interface Integration

### Admin Dashboard Updates

**New Sections:**
1. **Inventory & Sales Management** - Main section containing both components
2. **Product Management** - Add products and view inventory
3. **Sales Management** - Record sales and withdrawals

**Layout:**
- Components are placed above the existing service management
- Each component has its own history toggle
- Modal interfaces for data entry
- Responsive design for mobile and desktop

## Key Features

### Product Management
✅ **Add Products**: Name, quantity, type, price per unit
✅ **Automatic Calculations**: Total price based on quantity × price
✅ **Quantity Types**: Pack, single, box, bottle, piece
✅ **History View**: Toggle to see all added products
✅ **Form Validation**: Required fields and data validation

### Sales Management
✅ **Product Sales**: Select products and quantities to sell
✅ **Withdrawals**: Record cash withdrawals with reasons
✅ **Inventory Tracking**: Automatic quantity reduction
✅ **Multi-Product Sales**: Add multiple products per sale
✅ **History View**: Complete sales and withdrawal history
✅ **Color Coding**: Green for sales, orange for withdrawals

### Data Integrity
✅ **Automatic Calculations**: No manual total calculations needed
✅ **Inventory Validation**: Prevents overselling
✅ **Admin Tracking**: All actions linked to admin user
✅ **Branch Association**: Products and sales linked to branches
✅ **Timestamps**: Full audit trail

## Usage Flow

### Adding Products
1. Click "Add Product" button
2. Fill in product details (name, quantity, type, price)
3. Review calculated total value
4. Submit to save product
5. View in history if needed

### Recording Sales
1. Click "Record Sale" button
2. Choose sale type (Product Sale or Withdrawal)
3. For Product Sales:
   - Select products from dropdown
   - Enter quantities
   - Review total calculation
4. For Withdrawals:
   - Enter reason and amount
5. Submit to record sale
6. View in history if needed

## Technical Implementation

### Database Relationships
- Products linked to admin and branch
- Sales linked to admin and branch
- Product sales reference product IDs

### Security
- Admin-only access to all endpoints
- JWT token validation
- Branch-specific data isolation

### Performance
- Efficient queries with proper indexing
- Cached connections for database
- Optimized UI rendering

## Future Enhancements

### Planned Features
- Product categories and filtering
- Low stock alerts
- Sales reports and analytics
- Product images and descriptions
- Bulk product import/export
- Advanced inventory tracking (expiry dates, etc.)
- Sales forecasting
- Customer purchase history

### Integration Opportunities
- Barcode scanning for products
- Receipt printing
- Email notifications for low stock
- Integration with accounting systems
- Mobile app for inventory management

## File Structure

```
app/
├── models/
│   ├── Product.ts          # Product database model
│   └── Sale.ts            # Sale database model
├── api/
│   ├── products/
│   │   └── route.ts       # Products API endpoints
│   └── sales/
│       └── route.ts       # Sales API endpoints
├── components/
│   ├── ProductManagement.tsx  # Product management UI
│   └── SalesManagement.tsx    # Sales management UI
└── dashboard/
    └── admin/
        └── page.tsx       # Updated admin dashboard
```

## Testing

### Manual Testing Checklist
- [ ] Add new product with all quantity types
- [ ] Verify total price calculation
- [ ] View product history
- [ ] Record product sale with multiple items
- [ ] Record withdrawal with reason
- [ ] Verify inventory reduction after sale
- [ ] View sales history
- [ ] Test form validation
- [ ] Test responsive design

### API Testing
- [ ] GET /api/products (with and without auth)
- [ ] POST /api/products (valid and invalid data)
- [ ] GET /api/sales (with and without auth)
- [ ] POST /api/sales (product sale and withdrawal)
- [ ] Error handling for insufficient inventory
- [ ] Error handling for invalid data

## Deployment Notes

### Environment Variables
No additional environment variables required - uses existing JWT_SECRET and MONGODB_URI.

### Database Migration
New collections will be created automatically when first used:
- `products` collection
- `sales` collection

### Dependencies
No additional npm packages required - uses existing dependencies.

## Support

For issues or questions regarding the inventory and sales management features:
1. Check the browser console for errors
2. Verify database connectivity
3. Ensure admin authentication is working
4. Review API response status codes
5. Check MongoDB logs for database errors
