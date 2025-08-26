import mongoose from "mongoose";

// Define interfaces for better type safety
interface ServiceOperation {
  name: string;
  price: number;
  status: 'pending' | 'finished';
  createdAt: Date;
  finishedDate?: Date;
}

interface AdminServiceOperation {
  _id?: mongoose.Types.ObjectId;
  name: string;
  price?: number; // Individual worker price (for backward compatibility)
  totalPrice?: number; // Combined total price for multiple workers
  status: 'pending' | 'pending_to_confirm' | 'finished';
  createdAt: Date;
  finishedDate?: Date;
  paymentConfirmedDate?: Date;
  workerConfirmedDate?: Date;
  // Single worker fields (for backward compatibility)
  workerName?: string;
  workerRole?: 'barber' | 'washer';
  workerId?: mongoose.Types.ObjectId;
  // Combined workers array (new structure)
  workers?: Array<{
    workerName: string;
    workerRole: 'barber' | 'washer';
    workerId: mongoose.Types.ObjectId;
    price: number;
  }>;
  by: 'cash' | 'mobile banking(telebirr)';
  paymentImageUrl?: string;
}

interface Product {
  name: string;
  quantity: number;
  quantityType: 'pack' | 'single' | 'box' | 'bottle' | 'piece';
  pricePerUnit: number;
  totalPrice: number;
  createdAt: Date;
}

interface ProductSale {
  productName: string;
  soldQuantity: number;
  pricePerUnit: number;
  totalSoldMoney: number;
  productId: string;
  createdAt: Date;
  finishedDate?: Date; // Date when the sale was marked as finished
  by?: 'cash' | 'mobile banking(telebirr)';
  paymentImageUrl?: string;
  status?: 'pending' | 'finished';
}

interface Withdrawal {
  reason: string;
  amount: number;
  createdAt: Date;
}

interface UserDocument extends mongoose.Document {
  name: string;
  phone: string;
  password: string;
  role: "owner" | "admin" | "barber" | "washer" | "customer";
  branchId?: mongoose.Types.ObjectId;
  isActive?: boolean;
  isSuspended?: boolean;
  serviceOperations: ServiceOperation[];
  adminServiceOperations: AdminServiceOperation[];
  products: Product[];
  productSales: ProductSale[];
  withdrawals: Withdrawal[];
}

// Simple service operation schema for workers
const serviceOperationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'pending_to_confirm', 'finished'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  finishedDate: { type: Date }, // When operation was marked as finished
  paymentConfirmedDate: { type: Date }, // When owner confirmed payment
  workerConfirmedDate: { type: Date } // When worker confirmed receiving payment
}, { _id: true }); // Allow _id fields for consistency with admin operations

// Admin service operation schema with worker details (supports both single and combined operations)
const adminServiceOperationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number }, // Individual worker price (for backward compatibility)
  totalPrice: { type: Number }, // Combined total price for multiple workers
  status: { type: String, enum: ['pending', 'pending_to_confirm', 'finished'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }, // When operation was last updated
  finishedDate: { type: Date }, // When operation was marked as finished
  paymentConfirmedDate: { type: Date }, // When owner confirmed payment
  workerConfirmedDate: { type: Date }, // When worker confirmed receiving payment
  // Single worker fields (for backward compatibility)
  workerName: { type: String },
  workerRole: { type: String, enum: ['barber', 'washer'] },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Combined workers array (new structure)
  workers: [{
    workerName: { type: String, required: true },
    workerRole: { type: String, enum: ['barber', 'washer'], required: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    price: { type: Number, required: true }
  }],
  by: { type: String, enum: ['cash', 'mobile banking(telebirr)'], default: 'cash' },
  paymentImageUrl: { type: String } // Payment proof image URL
}, { _id: true });

// Product schema as subcollection
const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    default: "Product",
    trim: true 
  },
  quantity: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  quantityType: { 
    type: String, 
    enum: ['pack', 'single', 'box', 'bottle', 'piece'], 
    default: 'single'
  },
  pricePerUnit: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  totalPrice: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

// Product sale schema as separate subcollection
const productSaleSchema = new mongoose.Schema({
  productName: { type: String, default: "Product" },
  soldQuantity: { type: Number, default: 1, min: 1 },
  pricePerUnit: { type: Number, default: 0, min: 0 },
  totalSoldMoney: { type: Number, default: 0, min: 0 },
  productId: { type: String, default: "product" },
  createdAt: { type: Date, default: Date.now },
  finishedDate: { type: Date }, // Date when the sale was marked as finished
  by: { type: String, enum: ['cash', 'mobile banking(telebirr)'], default: 'cash' },
  paymentImageUrl: { type: String }, // Payment proof image URL
  status: { type: String, enum: ['pending', 'finished'], default: 'pending' }
}, { _id: true });

// Withdrawal schema as separate subcollection
const withdrawalSchema = new mongoose.Schema({
  reason: { type: String, default: "Withdrawal", trim: true },
  amount: { type: Number, default: 0, min: 0 },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["owner", "admin", "barber", "washer", "customer"], default: "customer" },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" }, // Only required for admin/barber/washer
  isActive: { type: Boolean, default: true },
  isSuspended: { type: Boolean, default: false },
  serviceOperations: { type: [serviceOperationSchema], default: [] }, // Worker service operations
  adminServiceOperations: { type: [adminServiceOperationSchema], default: [] }, // Admin service operations
  products: { type: [productSchema], default: [] }, // Products subcollection
  productSales: { type: [productSaleSchema], default: [] }, // Product sales subcollection
  withdrawals: { type: [withdrawalSchema], default: [] } // Withdrawals subcollection
}, { timestamps: true });

// Ensure subcollections exist for existing documents
userSchema.pre('save', function(next) {
  if (this.role === 'admin' && !this.adminServiceOperations) {
    (this as UserDocument).adminServiceOperations = [];
  }
  if (this.role === 'admin' && !this.products) {
    (this as UserDocument).products = [];
  }
  if (this.role === 'admin' && !this.productSales) {
    (this as UserDocument).productSales = [];
  }
  if (this.role === 'admin' && !this.withdrawals) {
    (this as UserDocument).withdrawals = [];
  }
  next();
});

// Calculate total price before saving products
productSchema.pre('save', function(next) {
  const product = this as any;
  product.totalPrice = product.quantity * product.pricePerUnit;
  next();
});

// Calculate total sold money before saving product sales
productSaleSchema.pre('save', function(next) {
  const productSale = this as any;
  productSale.totalSoldMoney = productSale.soldQuantity * productSale.pricePerUnit;
  next();
});

// Force model recompilation to ensure schema changes are applied
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.model("User", userSchema);
