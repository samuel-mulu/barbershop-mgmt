# Database Refactor - User Model Subcollections

## Overview
The database has been refactored to use the **existing User model** with **embedded subcollections** for products, product sales, and withdrawals, similar to how `adminServiceOperations` is structured.

## New Database Structure

### User Document with Subcollections
```json
{
  "_id": "68945dc58cb0aa626a954595",
  "name": "admin",
  "phone": "222",
  "role": "admin",
  "products": [
    {
      "_id": "689485f4961f8a479c961768",
      "name": "ghj",
      "quantity": 1,
      "quantityType": "piece",
      "pricePerUnit": 98,
      "totalPrice": 98,
      "createdAt": "2024-01-XX"
    }
  ],
  "productSales": [
    {
      "_id": "689486ac961f8a479c961785",
      "productName": "rrr",
      "soldQuantity": 5,
      "pricePerUnit": 10,
      "totalSoldMoney": 50,
      "productId": "6894862b961f8a479c961773",
      "createdAt": "2024-01-XX"
    }
  ],
  "withdrawals": [
    {
      "_id": "689486ac961f8a479c961786",
      "reason": "vbn",
      "amount": 10,
      "createdAt": "2024-01-XX"
    }
  ],
  "adminServiceOperations": [...],
  "serviceOperations": [...]
}
```

### Product Subcollection Structure
```json
{
  "_id": "689485f4961f8a479c961768",
  "name": "ghj",
  "quantity": 1,
  "quantityType": "piece",
  "pricePerUnit": 98,
  "totalPrice": 98,
  "createdAt": "2024-01-XX"
}
```

### Product Sale Subcollection Structure
```json
{
  "_id": "689486ac961f8a479c961785",
  "productName": "rrr",
  "soldQuantity": 5,
  "pricePerUnit": 10,
  "totalSoldMoney": 50,
  "productId": "6894862b961f8a479c961773",
  "createdAt": "2024-01-XX"
}
```

### Withdrawal Subcollection Structure
```json
{
  "_id": "689486ac961f8a479c961786",
  "reason": "vbn",
  "amount": 10,
  "createdAt": "2024-01-XX"
}
```

## API Endpoints

### Products
- `GET /api/products` - Get all products for current admin
- `POST /api/products` - Create new product for current admin

### Product Sales (Separate Endpoint)
- `GET /api/product-sales` - Get all product sales for current admin
- `POST /api/product-sales` - Create new product sale for current admin

### Withdrawals (Separate Endpoint)
- `GET /api/withdrawals` - Get all withdrawals for current admin
- `POST /api/withdrawals` - Create new withdrawal for current admin

### Legacy Sales Endpoint (Combined)
- `GET /api/sales` - Get all product sales and withdrawals for current admin
- `POST /api/sales` - Create new product sale or withdrawal for current admin

## Benefits

1. **Single Collection**: All data in one User collection
2. **Separate Subcollections**: Products, product sales, and withdrawals as distinct subcollections
3. **Separate API Endpoints**: Clean separation of product sales and withdrawals
4. **Consistency**: Same pattern as adminServiceOperations
5. **Performance**: No joins needed, all data in one document
6. **Simplicity**: Single source of truth for user data
7. **Clean Separation**: Product sales and withdrawals are separate entities
8. **Quantity Validation**: Prevents negative quantities and insufficient stock

## Implementation Details

### User Model
- Added `products`, `productSales`, and `withdrawals` as embedded subcollections
- Each subcollection has its own `_id` for individual item access
- Automatic calculations (totalPrice, totalSoldMoney)
- Pre-save hooks for data validation

### Database Service
- `DatabaseService` class handles User subcollection operations
- Direct manipulation of User document arrays
- CRUD operations for products, product sales, and withdrawals within User context
- Safety checks to ensure arrays exist before operations

### API Routes
- **Separate endpoints** for product sales and withdrawals
- **Quantity validation** to prevent negative stock
- **Clean separation** of concerns
- **Error handling** for insufficient quantities
- **Backward compatibility** with combined sales endpoint
