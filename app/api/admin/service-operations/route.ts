import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/verifyToken";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    await connectDB();
    
    // Verify token
    const decoded = verifyToken(req);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔍 Fetching admin service operations for user:", decoded._id);

    // Find the admin user and get their adminServiceOperations
    const adminUser = await User.findById(decoded._id).select("adminServiceOperations");
    if (!adminUser) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    const adminServiceOperations = adminUser.adminServiceOperations || [];
    console.log("🔍 Found admin service operations:", adminServiceOperations.length);
    
    // Log the structure of first few operations
    adminServiceOperations.slice(0, 3).forEach((op: any, index: number) => {
      console.log(`🔍 Admin operation ${index + 1}:`, {
        name: op.name,
        hasWorkers: !!op.workers,
        workersCount: op.workers?.length || 0,
        totalPrice: op.totalPrice,
        price: op.price,
        workerName: op.workerName,
        workerRole: op.workerRole
      });
      if (op.workers && op.workers.length > 0) {
        console.log(`🔍 Admin operation ${index + 1} workers:`, op.workers.map((w: any) => ({
          workerName: w.workerName,
          workerRole: w.workerRole,
          price: w.price
        })));
      }
    });

    return NextResponse.json(adminServiceOperations);
  } catch (error: unknown) {
    console.error("GET /api/admin/service-operations error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    
    // Verify token
    const decoded = verifyToken(req);
    console.log("🔍 Token verification:", { decoded });
    
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serviceOperations } = await req.json();
    console.log("🔍 Received admin service operations:", serviceOperations);
    console.log("🔍 First operation details:", serviceOperations[0]);
    console.log("🔍 Payment method in first operation:", serviceOperations[0]?.by);
    console.log("🔍 Payment image URL in first operation:", serviceOperations[0]?.paymentImageUrl);
    console.log("🔍 All operations payment image URLs:", serviceOperations.map(op => ({ name: op.name, paymentImageUrl: op.paymentImageUrl })));
    
    if (!serviceOperations || !Array.isArray(serviceOperations) || serviceOperations.length === 0) {
      return NextResponse.json({ error: "Service operations array is required" }, { status: 400 });
    }

    // Validate each service operation
    for (const operation of serviceOperations) {
      if (!operation.name) {
        return NextResponse.json({ error: "Service name is required" }, { status: 400 });
      }
      
      if (!operation.workerName) {
        return NextResponse.json({ error: "Worker name is required" }, { status: 400 });
      }
      
      if (!operation.workerRole) {
        return NextResponse.json({ error: "Worker role is required" }, { status: 400 });
      }
      
      if (!operation.workerId) {
        return NextResponse.json({ error: "Worker ID is required" }, { status: 400 });
      }
      
      if (!operation.price) {
        return NextResponse.json({ error: "Price is required" }, { status: 400 });
      }
      
      // Validate payment method if provided
      if (operation.by && !['cash', 'mobile banking(telebirr)'].includes(operation.by)) {
        return NextResponse.json({ error: "Invalid payment method. Must be 'cash' or 'mobile banking(telebirr)'" }, { status: 400 });
      }
    }

    console.log("🔍 Processing admin service operations:", serviceOperations);

    // Find the admin user to add service operations to
    const adminUser = await User.findById(decoded._id);
    if (!adminUser) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    // Create admin service operations
    const createdOperations = [];
    
    for (const operation of serviceOperations) {
      console.log("🔍 Creating admin service operation:", operation);
      console.log("🔍 Payment method from operation:", operation.by);
      console.log("🔍 Payment image URL from operation:", operation.paymentImageUrl);
      
      const adminServiceOperation = {
        _id: new mongoose.Types.ObjectId(), // Generate a proper MongoDB ObjectId
        name: operation.name,
        price: operation.price, // Full price for admin
        status: "pending",
        createdAt: new Date(),
        workerName: operation.workerName,
        workerRole: operation.workerRole,
        workerId: operation.workerId,
        by: operation.by || "cash", // Default to cash if not provided
        paymentImageUrl: operation.paymentImageUrl || undefined
      };
      
      console.log("🔍 Created admin service operation with payment method:", adminServiceOperation.by);
      console.log("🔍 Created admin service operation with payment image:", adminServiceOperation.paymentImageUrl);
      
      // Add operation directly to database using $push
      const updateResult = await User.findByIdAndUpdate(decoded._id, {
        $push: { adminServiceOperations: adminServiceOperation }
      });
      
      console.log("🔍 Database update result:", updateResult);
      console.log("🔍 Added admin service operation to user:", adminUser.name);
      
      // Verify the operation was saved by fetching the user again
      const updatedUser = await User.findById(decoded._id).select("adminServiceOperations");
      console.log("🔍 Updated user adminServiceOperations count:", updatedUser?.adminServiceOperations?.length);
      
      createdOperations.push(adminServiceOperation);
    }

    console.log("🔍 All admin service operations created successfully");

    return NextResponse.json({ 
      message: "Admin service operations created successfully",
      operations: createdOperations
    });
  } catch (error: unknown) {
    console.error("POST /api/admin/service-operations error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 