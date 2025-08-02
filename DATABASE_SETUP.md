# Database Setup Guide

## MongoDB Atlas Configuration

Your barbershop management application is now configured to use MongoDB Atlas with the following connection string:

```
mongodb+srv://planetranking067:4dPAQjfAXrOJBlIl@cluster0.dxfb4ya.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://planetranking067:4dPAQjfAXrOJBlIl@cluster0.dxfb4ya.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# JWT Secret for authentication (change this in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Next.js Environment
NODE_ENV=development
```

## Database Connection Features

✅ **Connection Pooling**: Configured for optimal performance with up to 10 concurrent connections
✅ **Timeout Handling**: Proper timeout settings for Atlas connections
✅ **Error Handling**: Comprehensive error handling and logging
✅ **Graceful Shutdown**: Proper connection cleanup on application termination

## Collections

Your application will automatically create the following collections when you start using the app:

- `users` - User accounts and authentication
- `branches` - Barbershop branch information
- `services` - Available services at each branch
- `appointments` - Customer appointments
- `reports` - Business reports and analytics
- `workers` - Staff information
- `admins` - Admin user accounts
- `owners` - Owner accounts

## Testing the Connection

The database connection is automatically tested when you start your application. You should see:

```
✅ MongoDB Connected to Atlas
```

in your console when the app starts.

## Security Notes

⚠️ **Important**: 
- Keep your MongoDB Atlas credentials secure
- Never commit `.env.local` to version control
- Change the JWT_SECRET in production
- Consider using MongoDB Atlas IP whitelist for additional security

## Free Tier Limitations

MongoDB Atlas Free Tier includes:
- 512MB storage
- Shared RAM
- Up to 500 connections
- Basic monitoring

This should be sufficient for development and small-scale production use. 