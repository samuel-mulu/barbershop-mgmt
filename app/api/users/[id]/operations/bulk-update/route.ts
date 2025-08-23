import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/verifyToken";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    // Verify token
    const decoded = verifyToken(req);
    // Allow owners and workers to update operations
    if (!decoded || !['owner', 'barber', 'washer', 'admin'].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { operationIndices, status, finishedDate, paymentConfirmedDate, workerConfirmedDate, operationsData } = await req.json();
    const { id: userId } = await params;
    
    console.log('🚀 Bulk update request:', {
      userId,
      operationIndices,
      status,
      finishedDate,
      paymentConfirmedDate,
      workerConfirmedDate,
      userRole: decoded.role
    });

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
      
      operationIndices.forEach((index: number) => {
        if (index >= 0 && index < adminOperations.length) {
          adminOperations[index].status = status;
          if (finishedDate) {
            adminOperations[index].finishedDate = new Date(finishedDate);
          }
          if (status === 'finished' && !finishedDate) {
            adminOperations[index].finishedDate = new Date();
          }
          if (paymentConfirmedDate) {
            adminOperations[index].paymentConfirmedDate = new Date(paymentConfirmedDate);
          }
          if (workerConfirmedDate) {
            adminOperations[index].workerConfirmedDate = new Date(workerConfirmedDate);
          }
          updatedCount++;
        }
      });

      result = await User.updateOne(
        { _id: userId },
        { $set: { adminServiceOperations: adminOperations } }
      );
    } else {
      // Update serviceOperations for workers
      console.log('🔧 Updating serviceOperations for worker role:', user.role);
      const serviceOperations = user.serviceOperations || [];
      console.log('🔧 Total service operations count:', serviceOperations.length);
      console.log('🔧 Operations to update indices:', operationIndices);
      console.log('🔧 Operations data:', operationsData);
      
      // If we have operationsData, use that to find operations by matching properties
      if (operationsData && Array.isArray(operationsData)) {
        operationsData.forEach((operationData: any) => {
          console.log('🔍 Looking for operation with data:', operationData);
          
          // Find operation by matching properties
          const foundIndex = serviceOperations.findIndex(op => 
            op.name === operationData.name && 
            op.price === operationData.price &&
            op.status === 'pending_to_confirm'
          );
          
          console.log('🔍 Found index:', foundIndex);
          
          if (foundIndex !== -1) {
            console.log('🔍 Updating operation at index:', foundIndex);
            serviceOperations[foundIndex].status = status;
            if (finishedDate) {
              serviceOperations[foundIndex].finishedDate = new Date(finishedDate);
            }
            if (status === 'finished' && !finishedDate) {
              serviceOperations[foundIndex].finishedDate = new Date();
            }
            if (paymentConfirmedDate) {
              serviceOperations[foundIndex].paymentConfirmedDate = new Date(paymentConfirmedDate);
            }
            if (workerConfirmedDate) {
              serviceOperations[foundIndex].workerConfirmedDate = new Date(workerConfirmedDate);
            }
            updatedCount++;
          }
        });
      } else {
        // Fallback to using indices
        operationIndices.forEach((index: number) => {
          if (index >= 0 && index < serviceOperations.length) {
            serviceOperations[index].status = status;
            if (finishedDate) {
              serviceOperations[index].finishedDate = new Date(finishedDate);
            }
            if (status === 'finished' && !finishedDate) {
              serviceOperations[index].finishedDate = new Date();
            }
            if (paymentConfirmedDate) {
              serviceOperations[index].paymentConfirmedDate = new Date(paymentConfirmedDate);
            }
            if (workerConfirmedDate) {
              serviceOperations[index].workerConfirmedDate = new Date(workerConfirmedDate);
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
      message: `Successfully updated ${updatedCount} operations`,
      updatedCount,
      status 
    });
  } catch (error: unknown) {
    console.error("PATCH /api/users/[id]/operations/bulk-update error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
