import mongoose from "mongoose";

// Simple service operation schema for workers
const serviceOperationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number }, // For reference to full price
  status: { type: String, enum: ['pending', 'finished'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  finishedDate: { type: Date } // When operation was marked as finished
}, { _id: false });

// Admin service operation schema with worker details
const adminServiceOperationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true }, // Full price
  status: { type: String, enum: ['pending', 'finished'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  finishedDate: { type: Date }, // When operation was marked as finished
  workerName: { type: String, required: true },
  workerRole: { type: String, enum: ['barber', 'washer'], required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["owner", "admin", "barber", "washer", "customer"], default: "customer" },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" }, // Only required for admin/barber/washer
  serviceOperations: { type: [serviceOperationSchema], default: [] }, // Worker service operations
  adminServiceOperations: { type: [adminServiceOperationSchema], default: [] } // Admin service operations
}, { timestamps: true });

// Ensure adminServiceOperations field exists for existing documents
userSchema.pre('save', function(next) {
  if (this.role === 'admin' && !this.adminServiceOperations) {
    (this as mongoose.Document & { adminServiceOperations?: any[] }).adminServiceOperations = [];
  }
  next();
});

export default mongoose.models.User || mongoose.model("User", userSchema);
