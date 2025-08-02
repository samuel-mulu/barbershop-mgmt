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
    if (!decoded || decoded.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { operationIndices, status, finishedDate } = await req.json();
    const { id: userId } = await params;

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
      
      operationIndices.forEach(index => {
        if (index >= 0 && index < adminOperations.length) {
          adminOperations[index].status = status;
          if (finishedDate) {
            adminOperations[index].finishedDate = finishedDate;
          }
          updatedCount++;
        }
      });

      result = await User.updateOne(
        { _id: userId },
        { $set: { adminServiceOperations: adminOperations } }
      );
    } else {
      // Update serviceOperations
      const serviceOperations = user.serviceOperations || [];
      
      operationIndices.forEach(index => {
        if (index >= 0 && index < serviceOperations.length) {
          serviceOperations[index].status = status;
          if (finishedDate) {
            serviceOperations[index].finishedDate = finishedDate;
          }
          updatedCount++;
        }
      });

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