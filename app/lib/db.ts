// lib/db.ts
import mongoose from "mongoose";

// Ensure proper MongoDB URI format
const getMongoURI = () => {
  const envURI = process.env.MONGODB_URI;
  
  if (envURI) {
    // If it already has a scheme, use it as is
    if (envURI.startsWith('mongodb://') || envURI.startsWith('mongodb+srv://')) {
      return envURI;
    }
    // If it's just a host/port, add the mongodb:// scheme
    return `mongodb://${envURI}`;
  }
  
  // Default local connection
  return "mongodb://localhost:27017/barbershop-mgmt";
};

const MONGODB_URI = getMongoURI();

// Debug logging
console.log('🔍 Database Configuration:');
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('   Using URI:', MONGODB_URI);
console.log('   Full URI:', MONGODB_URI);

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local or ensure MongoDB is running locally"
  );
}

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

interface GlobalWithMongoose {
  mongoose?: CachedConnection;
}

const globalWithMongoose = global as GlobalWithMongoose;

// eslint-disable-next-line prefer-const
let cached: CachedConnection = globalWithMongoose.mongoose || { conn: null, promise: null };

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = cached;
}

export const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // 5 seconds for local
      socketTimeoutMS: 30000, // 30 seconds for local
      connectTimeoutMS: 5000, // 5 seconds for local
      maxPoolSize: 5, // Reduced for local development
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      retryReads: true,
    };

    console.log('🔌 Attempting to connect to MongoDB...');
    console.log('   URI:', MONGODB_URI);

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully to local instance');
      return mongoose;
    }).catch((error) => {
      console.error('❌ MongoDB connection error:', error);
      console.error('   Error details:', error.message);
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

export default connectDB;
