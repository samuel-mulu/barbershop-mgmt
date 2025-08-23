import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/verifyToken";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    // Verify token
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { operationIndices, workerConfirmedDate, operationsData } = await req.json();
    const { id: userId } = await params;

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

    if (!operationIndices || !Array.isArray(operationIndices) || operationIndices.length === 0) {
      return NextResponse.json({ error: "Operation indices are required" }, { status: 400 });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let result;
    let updatedCount = 0;

    if (user.role === "admin") {
      // Update adminServiceOperations
      const adminOperations = user.adminServiceOperations || [];
      
      // If we have operationsData, use that to find operations by matching properties
      if (operationsData && Array.isArray(operationsData)) {
        operationsData.forEach((operationData: any) => {
                     const foundIndex = adminOperations.findIndex(op => 
             op.name === operationData.name && 
             op.price === operationData.price
           );
          
          if (foundIndex !== -1) {
            adminOperations[foundIndex].status = 'finished';
            adminOperations[foundIndex].finishedDate = new Date().toISOString();
            if (workerConfirmedDate) {
              adminOperations[foundIndex].workerConfirmedDate = workerConfirmedDate;
            }
            updatedCount++;
          }
        });
      } else {
                 // Fallback to using indices
         operationIndices.forEach(index => {
           if (index >= 0 && index < adminOperations.length) {
             // Update regardless of current status
             adminOperations[index].status = 'finished';
             adminOperations[index].finishedDate = new Date().toISOString();
             if (workerConfirmedDate) {
               adminOperations[index].workerConfirmedDate = workerConfirmedDate;
             }
             updatedCount++;
           }
         });
      }

      result = await User.updateOne(
        { _id: userId },
        { $set: { adminServiceOperations: adminOperations } }
      );
    } else {
      // Update serviceOperations
      const serviceOperations = user.serviceOperations || [];
      
      // If we have operationsData, use that to find operations by matching properties
      if (operationsData && Array.isArray(operationsData)) {
        operationsData.forEach((operationData: any) => {
                     const foundIndex = serviceOperations.findIndex(op => 
             op.name === operationData.name && 
             op.price === operationData.price
           );
          
          if (foundIndex !== -1) {
            serviceOperations[foundIndex].status = 'finished';
            serviceOperations[foundIndex].finishedDate = new Date().toISOString();
            if (workerConfirmedDate) {
              serviceOperations[foundIndex].workerConfirmedDate = workerConfirmedDate;
            }
            updatedCount++;
          }
        });
      } else {
                 // Fallback to using indices
         operationIndices.forEach(index => {
           if (index >= 0 && index < serviceOperations.length) {
             // Update regardless of current status
             serviceOperations[index].status = 'finished';
             serviceOperations[index].finishedDate = new Date().toISOString();
             if (workerConfirmedDate) {
               serviceOperations[index].workerConfirmedDate = workerConfirmedDate;
             }
             updatedCount++;
           }
         });
      }

      result = await User.updateOne(
        { _id: userId },
        { $set: { serviceOperations: serviceOperations } }
      );
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "No operations were updated" }, { status: 400 });
    }

    return NextResponse.json({ 
      message: `Successfully confirmed ${updatedCount} payments`,
      updatedCount,
      status: 'finished'
    });
  } catch (error: unknown) {
    console.error("POST /api/users/[id]/bulk-confirm-payment error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
