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
    console.log("🔍 Received service operations:", serviceOperations);
    
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

    // Process each service operation and add to worker's user document
    const results = [];
    
    for (const operation of serviceOperations) {
      console.log("🔍 Processing operation:", operation);
      console.log("🔍 Operation has workerId:", !!operation.workerId);
      console.log("🔍 Operation has barberPrice:", !!operation.barberPrice);
      console.log("🔍 Operation has washerId:", !!operation.washerId);
      console.log("🔍 Operation has washerPrice:", !!operation.washerPrice);
      
      // If barber is assigned, add service to barber's user document
      if (operation.workerId && operation.barberPrice) {
        console.log("🔍 Adding barber service to user:", operation.workerId);
        
        console.log("🔍 Looking for barber user with ID:", operation.workerId);
        const barberUser = await User.findById(operation.workerId);
        console.log("🔍 Barber user found:", barberUser ? barberUser.name : "Not found");
        if (!barberUser) {
          return NextResponse.json({ error: `Barber user not found: ${operation.workerId}` }, { status: 404 });
        }
        
        // Initialize serviceOperations array if it doesn't exist
        if (!barberUser.serviceOperations) {
          barberUser.serviceOperations = [];
        }
        
        // Calculate barber's share (50% of the price)
        const barberShare = Math.round(operation.barberPrice * 0.5);
        
        // Add service operation to barber's user document
        const serviceOperation = {
          name: operation.name,
          price: barberShare, // 50% of the original price
          originalPrice: operation.barberPrice, // Keep original price for reference
          status: "pending",
          createdAt: new Date()
        };
        console.log("🔍 Adding service operation to barber:", serviceOperation);
        console.log("🔍 Barber share calculation: ${operation.barberPrice} * 0.5 = ${barberShare}");
        barberUser.serviceOperations.push(serviceOperation);
        
        await barberUser.save();
        console.log("🔍 Added barber service to user:", barberUser.name);
        console.log("🔍 Barber serviceOperations count:", barberUser.serviceOperations.length);
        results.push({ workerId: operation.workerId, workerName: barberUser.name, price: barberShare, originalPrice: operation.barberPrice });
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
        
        // Initialize serviceOperations array if it doesn't exist
        if (!washerUser.serviceOperations) {
          washerUser.serviceOperations = [];
        }
        
        // Calculate washer's share (10% of the price)
        const washerShare = Math.round(operation.washerPrice * 0.1);
        
        // Add service operation to washer's user document
        const washerServiceOperation = {
          name: operation.name,
          price: washerShare, // 10% of the original price
          originalPrice: operation.washerPrice, // Keep original price for reference
          status: "pending",
          createdAt: new Date()
        };
        console.log("🔍 Adding service operation to washer:", washerServiceOperation);
        console.log("🔍 Washer share calculation: ${operation.washerPrice} * 0.1 = ${washerShare}");
        washerUser.serviceOperations.push(washerServiceOperation);
        
        await washerUser.save();
        console.log("🔍 Added washer service to user:", washerUser.name);
        console.log("🔍 Washer serviceOperations count:", washerUser.serviceOperations.length);
        results.push({ workerId: operation.washerId, workerName: washerUser.name, price: washerShare, originalPrice: operation.washerPrice });
      }
    }

    console.log("🔍 All service operations processed successfully");

    return NextResponse.json({ 
      message: "Service operations saved successfully",
      results: results
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
    const allServiceOperations = users.reduce((operations: unknown[], user: Record<string, unknown>) => {
      const serviceOperations = user.serviceOperations;
      const operationsCount = Array.isArray(serviceOperations) ? serviceOperations.length : 0;
      console.log(`🔍 User ${user.name} has ${operationsCount} service operations`);
      if (Array.isArray(serviceOperations) && serviceOperations.length > 0) {
        // Add user info to each service operation
        const userOperations = (serviceOperations as Array<Record<string, unknown>>).map((op: Record<string, unknown>, index: number) => {
          console.log(`🔍 Raw operation ${index} from ${user.name}:`, JSON.stringify(op, null, 2));
          console.log(`🔍 Operation ${index} type:`, typeof op);
          console.log(`🔍 Operation ${index} keys:`, Object.keys(op || {}));
          
          // Ensure we have the correct structure
          const operation = {
            name: op?.name || 'Unknown Service',
            price: op?.price || 0,
            originalPrice: op?.originalPrice || op?.price || 0, // Include original price if available
            status: op?.status || 'pending',
            createdAt: op?.createdAt || new Date(),
            workerName: user.name,
            workerRole: user.role,
            workerId: user._id,
            _id: `${user._id}_${index}_${Date.now()}` // Generate unique ID for React key
          };
          
          console.log(`🔍 Processed operation ${index}:`, JSON.stringify(operation, null, 2));
          return operation;
        });
        operations.push(...userOperations);
        console.log(`🔍 Added ${userOperations.length} operations from user ${user.name}`);
      }
      return operations;
    }, []);

    console.log("🔍 Total service operations found:", allServiceOperations.length);
    return NextResponse.json(allServiceOperations);
  } catch (error: unknown) {
    console.error("GET /api/users/service-operations error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 