import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/verifyToken";
import mongoose from "mongoose";
import Branch from "@/models/Branch"; // Added import for Branch

export async function POST(req: Request) {
  try {
    await connectDB();
    
    // Verify token
    const decoded = verifyToken(req);
    console.log("🔍 Token verification:", { decoded });
    
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serviceOperations, adminServiceOperations, paymentMethod, paymentImageUrl } = await req.json();
    console.log("🔍 Received service operations:", serviceOperations);
    console.log("🔍 Received admin service operations:", adminServiceOperations);
    console.log("🔍 Payment method:", paymentMethod);
    console.log("🔍 Payment image URL:", paymentImageUrl);
    
    if (!serviceOperations || !Array.isArray(serviceOperations) || serviceOperations.length === 0) {
      return NextResponse.json({ error: "Service operations array is required" }, { status: 400 });
    }

    // Validate each service operation
    for (const operation of serviceOperations) {
      if (!operation.name) {
        return NextResponse.json({ error: "Service name is required" }, { status: 400 });
      }
      
      // Check if at least one worker is assigned
      if (!operation.workerId && !operation.washerId) {
        return NextResponse.json({ error: "At least one worker (barber or washer) must be assigned" }, { status: 400 });
      }
    }

    console.log("🔍 Processing service operations:", serviceOperations);

    // Generate consistent IDs for the same service across workers
    const serviceIdMap = new Map();
    const currentTimestamp = Math.floor(new Date().getTime() / 1000); // Use same timestamp for all operations
    
    for (const operation of serviceOperations) {
      // Generate consistent ID based on service name and timestamp
      const serviceKey = `${operation.name}_${currentTimestamp}`;
      
      if (!serviceIdMap.has(serviceKey)) {
        serviceIdMap.set(serviceKey, new mongoose.Types.ObjectId());
        console.log("🔍 Generated service ID for:", operation.name, "Timestamp:", currentTimestamp, "ID:", serviceIdMap.get(serviceKey).toString());
      }
    }

    // Process each service operation and add to worker's user document
    const results = [];
    
    for (const operation of serviceOperations) {
      console.log("🔍 Processing operation:", operation);
      console.log("🔍 Operation has workerId:", !!operation.workerId);
      console.log("🔍 Operation has barberPrice:", !!operation.barberPrice);
      console.log("🔍 Operation has washerId:", !!operation.washerId);
      console.log("🔍 Operation has washerPrice:", !!operation.washerPrice);
      
      // Generate consistent ID for this service
      const serviceKey = `${operation.name}_${currentTimestamp}`;
      const sharedServiceId = serviceIdMap.get(serviceKey);
      console.log("🔍 Looking up service ID for key:", serviceKey, "Found ID:", sharedServiceId?.toString());
      
      // If barber is assigned, add service to barber's user document
      if (operation.workerId && operation.barberPrice) {
        console.log("🔍 Adding barber service to user:", operation.workerId);
        
        console.log("🔍 Looking for barber user with ID:", operation.workerId);
        const barberUser = await User.findById(operation.workerId);
        console.log("🔍 Barber user found:", barberUser ? barberUser.name : "Not found");
        if (!barberUser) {
          return NextResponse.json({ error: `Barber user not found: ${operation.workerId}` }, { status: 404 });
        }
        
        // Get branch share settings
        const branch = await Branch.findById(barberUser.branchId);
        const barberSharePercentage = branch?.shareSettings?.barberShare || 50; // Default to 50% if not set
        
        // Calculate barber's share using branch settings
        const barberShare = Math.round(operation.barberPrice * (barberSharePercentage / 100));
        
        // Add service operation to barber's user document
        const serviceOperation = {
          _id: sharedServiceId, // Use shared ID for same service across workers
          name: operation.name,
          price: barberShare, // Calculated share based on branch settings
          status: "pending",
          createdAt: new Date()
        };
        
        // Ensure _id is properly set
        if (!serviceOperation._id) {
          console.log("❌ ERROR: Service operation _id is missing!");
          serviceOperation._id = new mongoose.Types.ObjectId();
        }
        console.log("🔍 Service operation before push:", JSON.stringify(serviceOperation, null, 2));
        console.log("🔍 Adding service operation to barber:", serviceOperation);
        console.log("🔍 Barber share calculation: ${operation.barberPrice} * ${barberSharePercentage} / 100 = ${barberShare}");
        console.log("🔍 Service operation _id:", serviceOperation._id?.toString());
        barberUser.serviceOperations.push(serviceOperation);
        
        await barberUser.save();
        console.log("🔍 Added barber service to user:", barberUser.name);
        console.log("🔍 Barber serviceOperations count:", barberUser.serviceOperations.length);
        
        // Verify what was actually saved
        const lastOperation = barberUser.serviceOperations[barberUser.serviceOperations.length - 1];
        console.log("🔍 Last operation after save:", JSON.stringify(lastOperation, null, 2));
        console.log("🔍 Last operation _id after save:", lastOperation?._id?.toString());
        console.log("🔍 Last operation has _id field:", !!lastOperation?._id);
        results.push({ workerId: operation.workerId, workerName: barberUser.name, price: barberShare });
      }
      
      // If washer is assigned, add service to washer's user document
      if (operation.washerId && operation.washerPrice) {
        console.log("🔍 Adding washer service to user:", operation.washerId);
        
        console.log("🔍 Looking for washer user with ID:", operation.washerId);
        const washerUser = await User.findById(operation.washerId);
        console.log("🔍 Washer user found:", washerUser ? washerUser.name : "Not found");
        if (!washerUser) {
          return NextResponse.json({ error: `Washer user not found: ${operation.washerId}` }, { status: 404 });
        }
        
        // Get branch share settings
        const washerBranch = await Branch.findById(washerUser.branchId);
        const washerSharePercentage = washerBranch?.shareSettings?.washerShare || 10; // Default to 10% if not set
        
        // Calculate washer's share using branch settings
        const washerShare = Math.round(operation.washerPrice * (washerSharePercentage / 100));
        
        // Add service operation to washer's user document
        const washerServiceOperation = {
          _id: sharedServiceId, // Use shared ID for same service across workers
          name: operation.name,
          price: washerShare, // Calculated share based on branch settings
          status: "pending",
          createdAt: new Date()
        };
        
        // Ensure _id is properly set
        if (!washerServiceOperation._id) {
          console.log("❌ ERROR: Washer service operation _id is missing!");
          washerServiceOperation._id = new mongoose.Types.ObjectId();
        }
        console.log("🔍 Washer service operation before push:", JSON.stringify(washerServiceOperation, null, 2));
        console.log("🔍 Adding service operation to washer:", washerServiceOperation);
        console.log("🔍 Washer share calculation: ${operation.washerPrice} * ${washerSharePercentage} / 100 = ${washerShare}");
        console.log("🔍 Washer service operation _id:", washerServiceOperation._id?.toString());
        washerUser.serviceOperations.push(washerServiceOperation);
        
        await washerUser.save();
        console.log("🔍 Added washer service to user:", washerUser.name);
        console.log("🔍 Washer serviceOperations count:", washerUser.serviceOperations.length);
        
        // Verify what was actually saved
        const lastWasherOperation = washerUser.serviceOperations[washerUser.serviceOperations.length - 1];
        console.log("🔍 Last washer operation after save:", JSON.stringify(lastWasherOperation, null, 2));
        console.log("🔍 Last washer operation _id after save:", lastWasherOperation?._id?.toString());
        console.log("🔍 Last washer operation has _id field:", !!lastWasherOperation?._id);
        results.push({ workerId: operation.washerId, workerName: washerUser.name, price: washerShare });
      }
    }

    // Handle admin service operations if provided
    let adminResults = [];
    if (adminServiceOperations && Array.isArray(adminServiceOperations) && adminServiceOperations.length > 0) {
      console.log("🔍 Processing admin service operations:", adminServiceOperations);
      
      // Find the admin user to add service operations to
      const adminUser = await User.findById(decoded._id);
      if (!adminUser) {
        return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
      }

      // Group admin service operations by service name and timestamp
      const adminOperationGroups = new Map();
      
      for (const operation of adminServiceOperations) {
        const serviceKey = `${operation.name}_${currentTimestamp}`;
        
        if (!adminOperationGroups.has(serviceKey)) {
          adminOperationGroups.set(serviceKey, {
            _id: serviceIdMap.get(serviceKey), // Use shared ID for consistency
            name: operation.name,
            totalPrice: 0,
            status: "pending",
            createdAt: new Date(),
            workers: [],
            by: paymentMethod || "cash",
            paymentImageUrl: paymentImageUrl || undefined
          });
        }
        
        const group = adminOperationGroups.get(serviceKey);
        group.workers.push({
          workerName: operation.workerName,
          workerRole: operation.workerRole,
          workerId: operation.workerId,
          price: operation.price
        });
        group.totalPrice += operation.price;
      }
      
      // Create admin service operations (both single and combined)
      for (const [serviceKey, operation] of adminOperationGroups) {
        console.log("🔍 Creating admin service operation:", operation);
        console.log("🔍 Operation _id:", operation._id?.toString());
        console.log("🔍 Workers count:", operation.workers.length);
        console.log("🔍 Total price:", operation.totalPrice);
        
        // Add operation directly to database using $push
        const updateResult = await User.findByIdAndUpdate(decoded._id, {
          $push: { adminServiceOperations: operation }
        });
        
        console.log("🔍 Database update result:", updateResult);
        console.log("🔍 Added admin service operation to user:", adminUser.name);
        
        adminResults.push(operation);
      }
    }

    console.log("🔍 All service operations processed successfully");

    return NextResponse.json({ 
      message: "Service operations saved successfully",
      results: results,
      adminResults: adminResults,
      serviceIds: Array.from(serviceIdMap.entries()).map(([key, id]) => ({ serviceKey: key, id: id.toString() }))
    });
  } catch (error: unknown) {
    console.error("POST /api/users/service-operations error:", error);
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

    // Migration: Add _id fields to operations that don't have them
    const allUsers = await User.find({ role: { $in: ["barber", "washer"] } });
    for (const user of allUsers) {
      if (user.serviceOperations) {
        let needsUpdate = false;
        user.serviceOperations.forEach((op: any, index: number) => {
          if (!op._id) {
            op._id = new mongoose.Types.ObjectId();
            needsUpdate = true;
            console.log(`🔧 Added _id to ${user.role} operation ${index}:`, op._id.toString());
          }
        });
        
        if (needsUpdate) {
          await user.save();
          console.log(`🔧 Migration completed for ${user.name}: Added _id fields to operations`);
        }
      }
    }

    const { searchParams } = new URL(req.url);
    const branch = searchParams.get("branch");
    const userId = searchParams.get("userId");

    const query: Record<string, unknown> = {};
    
    if (branch) {
      // For admin dashboard: get all service operations from users in this branch
      query.branchId = branch;
      query.role = { $in: ["barber", "washer"] };
    } else if (userId) {
      // For specific user: get operations for that specific user
      query._id = userId;
    } else {
      // For current user: get operations for the current user
      query._id = decoded._id;
    }

    console.log("🔍 GET query:", query);
    const users = await User.find(query).select("serviceOperations name role");
    
    // Get all user IDs for looking up other workers
    // const allUserIds = users.map(u => u._id.toString());
    console.log("🔍 Found users:", users.length);
    console.log("🔍 Users details:", users.map(u => ({
      name: u.name,
      role: u.role,
      serviceOperationsCount: u.serviceOperations?.length || 0,
      serviceOperations: JSON.stringify(u.serviceOperations, null, 2)
    })));
    
    // Extract service operations from all users
    const allServiceOperations: any[] = [];
    
    for (const user of users) {
      const serviceOperations = user.serviceOperations;
      const operationsCount = Array.isArray(serviceOperations) ? serviceOperations.length : 0;
      console.log(`🔍 User ${user.name} has ${operationsCount} service operations`);
      
      if (Array.isArray(serviceOperations) && serviceOperations.length > 0) {
        // Add user info to each service operation
        const userOperations = serviceOperations.map((op: any, index: number) => {
          console.log(`🔍 Raw operation ${index} from ${user.name}:`, JSON.stringify(op, null, 2));
          console.log(`🔍 Operation ${index} type:`, typeof op);
          console.log(`🔍 Operation ${index} keys:`, Object.keys(op || {}));
          
          // Ensure we have the correct structure
          const operation = {
            name: op?.name || 'Unknown Service',
            price: op?.price || 0,
            status: op?.status || 'pending',
            createdAt: op?.createdAt || new Date(),
            workerName: user.name,
            workerRole: user.role,
            workerId: user._id,
            _id: op?._id ? op._id.toString() : `${user._id}_${index}_${Date.now()}` // Use MongoDB ObjectId or generate fallback
          };
          
          console.log(`🔍 Processed operation ${index}:`, JSON.stringify(operation, null, 2));
          return operation;
        });
        allServiceOperations.push(...userOperations);
        console.log(`🔍 Added ${userOperations.length} operations from user ${user.name}`);
      }
    }

    console.log("🔍 Total service operations found:", allServiceOperations.length);
    return NextResponse.json(allServiceOperations);
  } catch (error: unknown) {
    console.error("GET /api/users/service-operations error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 