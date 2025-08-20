import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/verifyToken";
import mongoose from "mongoose";

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
      console.log("🔍 Latest operation saved:", updatedUser?.adminServiceOperations?.[updatedUser.adminServiceOperations.length - 1]);
      console.log("🔍 Latest operation payment image URL:", updatedUser?.adminServiceOperations?.[updatedUser.adminServiceOperations.length - 1]?.paymentImageUrl);
      createdOperations.push(adminServiceOperation);
    }

    console.log("🔍 All admin service operations saved successfully");

    return NextResponse.json({ 
      message: "Admin service operations saved successfully",
      results: createdOperations.map(op => ({
        _id: op._id ? op._id.toString() : undefined,
        name: op.name,
        price: op.price,
        workerName: op.workerName,
        workerRole: op.workerRole,
        workerId: op.workerId,
        by: op.by,
        paymentImageUrl: op.paymentImageUrl
      }))
    });
  } catch (error: unknown) {
    console.error("POST /api/admin/service-operations error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    
    console.log("🔍 GET /api/admin/service-operations - Headers:", Object.fromEntries(req.headers.entries()));
    
    // Verify token
    const decoded = verifyToken(req);
    console.log("🔍 Token verification result:", decoded);
    
    if (!decoded) {
      console.log("❌ Token verification failed - returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Migration: Add _id fields to operations that don't have them
    const adminUser = await User.findById(decoded._id);
    if (adminUser && adminUser.adminServiceOperations) {
      let needsUpdate = false;
      adminUser.adminServiceOperations.forEach((op: any, index: number) => {
        if (!op._id) {
          op._id = new mongoose.Types.ObjectId();
          needsUpdate = true;
          console.log(`🔧 Added _id to operation ${index}:`, op._id.toString());
        }
      });
      
      if (needsUpdate) {
        await adminUser.save();
        console.log("🔧 Migration completed: Added _id fields to operations");
      }
    }

    // const { searchParams } = new URL(req.url);

    const query: Record<string, unknown> = {};
    
    // Always get operations for the current admin user
    query._id = decoded._id;
    query.role = "admin";

         console.log("🔍 GET admin service operations query:", query);
     const adminUsers = await User.find(query).select("adminServiceOperations name");
     
     console.log("🔍 Found admin users:", adminUsers.length);
     console.log("🔍 Admin user data:", JSON.stringify(adminUsers, null, 2));
     
     // Extract admin service operations from all admin users
     const allAdminServiceOperations = adminUsers.reduce((operations: Array<Record<string, unknown>>, user: Record<string, unknown>) => {
       // Handle users without adminServiceOperations field
       const userOperations = (user.adminServiceOperations as Array<Record<string, unknown>>) || [];
       console.log(`🔍 Admin user ${user.name} has ${userOperations.length} admin service operations`);
       console.log(`🔍 User adminServiceOperations field:`, JSON.stringify(userOperations, null, 2));
              if (userOperations.length > 0) {
         // Add user info to each admin service operation
         const mappedOperations = userOperations.map((op: Record<string, unknown>, index: number) => {
          console.log(`🔍 Raw admin operation ${index} from ${user.name}:`, JSON.stringify(op, null, 2));
          console.log(`🔍 Operation _id:`, op?._id);
          console.log(`🔍 Operation _id type:`, typeof op?._id);
          
          // Ensure we have the correct structure
          const operation = {
            name: op?.name || 'Unknown Service',
            price: op?.price || 0,
            status: op?.status || 'pending',
            createdAt: op?.createdAt || new Date(),
            workerName: op?.workerName || 'N/A',
            workerRole: op?.workerRole || 'N/A',
            workerId: op?.workerId || 'N/A',
            by: op?.by || 'cash', // Include payment method
            paymentImageUrl: op?.paymentImageUrl || undefined, // Include payment image URL
            _id: op?._id ? op._id.toString() : `${user._id}_admin_${index}_${Date.now()}` // Convert ObjectId to string or generate fallback
          };
          
                     console.log(`🔍 Processed admin operation ${index}:`, JSON.stringify(operation, null, 2));
          console.log(`🔍 Operation ${index} payment image URL:`, operation.paymentImageUrl);
          return operation;
         });
         operations.push(...mappedOperations);
         console.log(`🔍 Added ${mappedOperations.length} admin operations from user ${user.name}`);
      }
      return operations;
    }, []);

    console.log("🔍 Total admin service operations found:", allAdminServiceOperations.length);
    return NextResponse.json(allAdminServiceOperations);
  } catch (error: unknown) {
    console.error("GET /api/admin/service-operations error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 