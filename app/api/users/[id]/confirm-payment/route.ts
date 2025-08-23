import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/verifyToken";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🚀 API: confirm-payment GET endpoint called');
  return NextResponse.json({ message: "API route is working" });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🚀 API: confirm-payment endpoint called - BEFORE TRY BLOCK');
  try {
    console.log('🚀 API: confirm-payment endpoint called - INSIDE TRY BLOCK');
    await connectDB();
    
    // Verify token
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestBody = await req.json();
    console.log('📦 Request body:', requestBody);
    
    const { operationIndex, status, workerConfirmedDate, operationData } = requestBody;
    const { id: userId } = await params;
    
    console.log('🔧 Confirm payment request:', {
      userId,
      operationIndex,
      status,
      workerConfirmedDate,
      operationData
    });

    // Workers can confirm operations for their role
    // Allow workers (barber, washer, admin) to confirm operations
    console.log('🔐 Authorization check:', {
      decodedRole: decoded.role,
      decodedUserId: decoded.userId,
      requestUserId: userId,
      isOwner: decoded.role === 'owner',
      isWorker: ['barber', 'washer', 'admin'].includes(decoded.role)
    });
    
    // Allow owners and workers to confirm operations
    if (!['owner', 'barber', 'washer', 'admin'].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized - only workers and owners can confirm operations" }, { status: 401 });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let result;

    console.log('🔍 User role for confirmation:', user.role);
    console.log('🔍 User ID for confirmation:', userId);
    
    if (user.role === "admin") {
      // Update adminServiceOperations
      const adminOperations = user.adminServiceOperations || [];
      
      // Find the operation by matching its properties instead of using index
      let foundIndex = -1;
      if (operationData) {
        console.log('🔍 Looking for operation with data:', operationData);
        console.log('🔍 Available admin operations:', adminOperations.map(op => ({
          name: op.name,
          price: op.price,
          status: op.status,
          createdAt: op.createdAt
        })));
        
        // Try to find by matching operation data (don't check status here)
        // Use more flexible matching - just name and price, ignore date for now
        foundIndex = adminOperations.findIndex(op => 
          op.name === operationData.name && 
          op.price === operationData.price
        );
        
        console.log('🔍 Found index:', foundIndex);
        if (foundIndex !== -1) {
          console.log('🔍 Found operation status:', adminOperations[foundIndex].status);
        }
      }
      
      // Fallback to index if no operationData provided
      if (foundIndex === -1 && operationIndex >= 0 && operationIndex < adminOperations.length) {
        foundIndex = operationIndex;
      }
      
      if (foundIndex === -1) {
        return NextResponse.json({ error: "Operation not found" }, { status: 404 });
      }

      // Update operation status regardless of current status
      console.log('🔍 Current operation status:', adminOperations[foundIndex].status);
      console.log('🔍 Operation being updated:', {
        name: adminOperations[foundIndex].name,
        price: adminOperations[foundIndex].price,
        createdAt: adminOperations[foundIndex].createdAt,
        currentStatus: adminOperations[foundIndex].status
      });
      console.log('✅ Updating to status:', status);
      adminOperations[foundIndex].status = status;
      if (workerConfirmedDate) {
        adminOperations[foundIndex].workerConfirmedDate = workerConfirmedDate;
      }
      if (status === 'finished') {
        adminOperations[foundIndex].finishedDate = new Date().toISOString();
      }
      console.log('✅ Operation after update:', {
        name: adminOperations[foundIndex].name,
        price: adminOperations[foundIndex].price,
        status: adminOperations[foundIndex].status,
        finishedDate: adminOperations[foundIndex].finishedDate
      });

      console.log('💾 Updating database with admin operations:', adminOperations.length);
      result = await User.updateOne(
        { _id: userId },
        { $set: { adminServiceOperations: adminOperations } }
      );
      console.log('💾 Database update result:', result);
    } else {
      // Update serviceOperations for barber/washer
      console.log('🔍 Updating serviceOperations for worker role:', user.role);
      const serviceOperations = user.serviceOperations || [];
      console.log('🔍 Total service operations count:', serviceOperations.length);
      
      // Find the operation by matching its properties instead of using index
      let foundIndex = -1;
      if (operationData) {
        console.log('🔍 Looking for operation with data:', operationData);
        console.log('🔍 Available service operations:', serviceOperations.map(op => ({
          name: op.name,
          price: op.price,
          status: op.status,
          createdAt: op.createdAt
        })));
        
        // Try to find by matching operation data (don't check status here)
        // Use more flexible matching - just name and price, ignore date for now
        foundIndex = serviceOperations.findIndex(op => 
          op.name === operationData.name && 
          op.price === operationData.price
        );
        
        console.log('🔍 Found index:', foundIndex);
        if (foundIndex !== -1) {
          console.log('🔍 Found operation status:', serviceOperations[foundIndex].status);
        }
      }
      
      // Fallback to index if no operationData provided
      if (foundIndex === -1 && operationIndex >= 0 && operationIndex < serviceOperations.length) {
        foundIndex = operationIndex;
      }
      
      if (foundIndex === -1) {
        return NextResponse.json({ error: "Operation not found" }, { status: 404 });
      }

      // Update operation status regardless of current status
      console.log('🔍 Current operation status:', serviceOperations[foundIndex].status);
      console.log('🔍 Operation being updated:', {
        name: serviceOperations[foundIndex].name,
        price: serviceOperations[foundIndex].price,
        createdAt: serviceOperations[foundIndex].createdAt,
        currentStatus: serviceOperations[foundIndex].status
      });
      console.log('✅ Updating to status:', status);
      serviceOperations[foundIndex].status = status;
      if (workerConfirmedDate) {
        serviceOperations[foundIndex].workerConfirmedDate = workerConfirmedDate;
      }
      if (status === 'finished') {
        serviceOperations[foundIndex].finishedDate = new Date().toISOString();
      }
      console.log('✅ Operation after update:', {
        name: serviceOperations[foundIndex].name,
        price: serviceOperations[foundIndex].price,
        status: serviceOperations[foundIndex].status,
        finishedDate: serviceOperations[foundIndex].finishedDate
      });

      console.log('💾 Updating database with service operations:', serviceOperations.length);
      console.log('💾 Operations to update:', serviceOperations.map(op => ({
        name: op.name,
        price: op.price,
        status: op.status
      })));
      result = await User.updateOne(
        { _id: userId },
        { $set: { serviceOperations: serviceOperations } }
      );
      console.log('💾 Database update result:', result);
      console.log('💾 Modified count:', result.modifiedCount);
    }

    console.log('✅ Database update result:', result);
    
    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Operation not updated" }, { status: 400 });
    }

    return NextResponse.json({ 
      message: "Payment confirmed successfully",
      status,
      modifiedCount: result.modifiedCount
    });
  } catch (error: unknown) {
    console.error("POST /api/users/[id]/confirm-payment error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
