import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/verifyToken";

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
    }

    console.log("🔍 Processing admin service operations:", serviceOperations);

    // Find the admin user to add service operations to
    const adminUser = await User.findById(decoded.userId);
    if (!adminUser) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    // Create admin service operations
    const createdOperations = [];
    
    for (const operation of serviceOperations) {
      console.log("🔍 Creating admin service operation:", operation);
      
      const adminServiceOperation = {
        name: operation.name,
        price: operation.price, // Full price for admin
        status: "pending",
        createdAt: new Date(),
        workerName: operation.workerName,
        workerRole: operation.workerRole,
        workerId: operation.workerId
      };
      
      // Add operation directly to database using $push
      await User.findByIdAndUpdate(decoded.userId, {
        $push: { adminServiceOperations: adminServiceOperation }
      });
      
      console.log("🔍 Added admin service operation to user:", adminUser.name);
      createdOperations.push(adminServiceOperation);
    }

    console.log("🔍 All admin service operations saved successfully");

    return NextResponse.json({ 
      message: "Admin service operations saved successfully",
      results: createdOperations.map(op => ({
        name: op.name,
        price: op.price,
        workerName: op.workerName,
        workerRole: op.workerRole,
        workerId: op.workerId
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
    
    // Verify token
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const branch = searchParams.get("branch");

    let query: Record<string, unknown> = {};
    
    // Always get operations for the current admin user
    query._id = decoded.userId;
    query.role = "admin";

         console.log("🔍 GET admin service operations query:", query);
     const adminUsers = await User.find(query).select("adminServiceOperations name");
     
     // Extract admin service operations from all admin users
     const allAdminServiceOperations = adminUsers.reduce((operations: Array<Record<string, unknown>>, user: Record<string, unknown>) => {
       // Handle users without adminServiceOperations field
       const userOperations = (user.adminServiceOperations as Array<Record<string, unknown>>) || [];
       console.log(`🔍 Admin user ${user.name} has ${userOperations.length} admin service operations`);
              if (userOperations.length > 0) {
         // Add user info to each admin service operation
         const mappedOperations = userOperations.map((op: Record<string, unknown>, index: number) => {
          console.log(`🔍 Raw admin operation ${index} from ${user.name}:`, JSON.stringify(op, null, 2));
          
          // Ensure we have the correct structure
          const operation = {
            name: op?.name || 'Unknown Service',
            price: op?.price || 0,
            status: op?.status || 'pending',
            createdAt: op?.createdAt || new Date(),
            workerName: op?.workerName || 'N/A',
            workerRole: op?.workerRole || 'N/A',
            workerId: op?.workerId || 'N/A',
            _id: `${user._id}_admin_${index}_${Date.now()}` // Generate unique ID for React key
          };
          
                     console.log(`🔍 Processed admin operation ${index}:`, JSON.stringify(operation, null, 2));
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