# Local MongoDB Setup Guide

## Prerequisites

1. **Install MongoDB Community Server** (if not already installed)
   - Download from: https://www.mongodb.com/try/download/community
   - Install with default settings

2. **Install MongoDB Compass** (GUI tool)
   - Download from: https://www.mongodb.com/try/download/compass
   - Install and open MongoDB Compass

## Setup Steps

### 1. Start MongoDB Service

**Windows:**
- MongoDB should start automatically as a Windows service
- If not, open Services (services.msc) and start "MongoDB" service

**Manual start (if needed):**
```bash
# Navigate to MongoDB bin directory (usually C:\Program Files\MongoDB\Server\[version]\bin)
mongod --dbpath "C:\data\db"
```

### 2. Connect with MongoDB Compass

1. Open MongoDB Compass
2. Use connection string: `mongodb://localhost:27017`
3. Click "Connect"
4. You should see your local MongoDB instance

### 3. Create Database

1. In Compass, click "Create Database"
2. Database Name: `barbershop-mgmt`
3. Collection Name: `users` (first collection)
4. Click "Create Database"

### 4. Environment Configuration

Create a `.env.local` file in your project root with:

```env
# Local MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/barbershop-mgmt

# JWT Secret for authentication (change this in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Next.js Environment
NODE_ENV=development
```

### 5. Test Connection

Start your development server:
```bash
npm run dev
```

You should see: `✅ MongoDB connected successfully to local instance`

## Database Collections

The application will automatically create these collections when you start using the app:

- `users` - User accounts and authentication
- `branches` - Barbershop branch information
- `services` - Available services at each branch
- `appointments` - Customer appointments
- `reports` - Business reports and analytics
- `workers` - Staff information
- `admins` - Admin user accounts
- `owners` - Owner accounts

## Troubleshooting

### Connection Issues

1. **MongoDB not running:**
   - Check if MongoDB service is running
   - Start MongoDB service manually

2. **Port 27017 in use:**
   - Check if another MongoDB instance is running
   - Kill existing processes or change port

3. **Permission issues:**
   - Run as administrator if needed
   - Check MongoDB data directory permissions

### Compass Connection Issues

1. **Can't connect to localhost:27017:**
   - Ensure MongoDB is running
   - Check firewall settings
   - Try `mongodb://127.0.0.1:27017` instead

## Benefits of Local Setup

✅ **Faster development** - No network latency
✅ **Offline development** - Work without internet
✅ **Full control** - Complete database access
✅ **No usage limits** - Unlimited operations
✅ **Better debugging** - Direct database inspection

## Migration from Atlas

If you were previously using MongoDB Atlas:

1. Export your data from Atlas (if any)
2. Import to local MongoDB using Compass
3. Update your `.env.local` file
4. Restart your application

## Security Notes

⚠️ **For Development Only:**
- Local MongoDB has no authentication by default
- Don't use this setup in production
- Keep your local database secure
- Regular backups recommended

