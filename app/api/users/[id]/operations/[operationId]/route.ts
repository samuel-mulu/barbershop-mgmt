import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/verifyToken";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; operationId: string }> }
) {
  try {
    await connectDB();
    
    // Verify token
    const decoded = verifyToken(req);
    if (!decoded || decoded.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status, finishedDate } = await req.json();
    const { id: userId, operationId } = await params;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const result;

    if (user.role === "admin") {
      // Update adminServiceOperations using array index
      const adminOperations = user.adminServiceOperations || [];
      const operationIndex = parseInt(operationId);
      
      if (operationIndex >= 0 && operationIndex < adminOperations.length) {
        adminOperations[operationIndex].status = status;
        if (finishedDate) {
          adminOperations[operationIndex].finishedDate = finishedDate;
        }
        result = await User.updateOne(
          { _id: userId },
          { $set: { adminServiceOperations: adminOperations } }
        );
      } else {
        return NextResponse.json({ error: "Operation not found" }, { status: 404 });
      }
    } else {
      // Update serviceOperations using array index
      const serviceOperations = user.serviceOperations || [];
      const operationIndex = parseInt(operationId);
      
      if (operationIndex >= 0 && operationIndex < serviceOperations.length) {
        serviceOperations[operationIndex].status = status;
        if (finishedDate) {
          serviceOperations[operationIndex].finishedDate = finishedDate;
        }
        result = await User.updateOne(
          { _id: userId },
          { $set: { serviceOperations: serviceOperations } }
        );
      } else {
        return NextResponse.json({ error: "Operation not found" }, { status: 404 });
      }
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Operation not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Operation status updated successfully" });
  } catch (error: unknown) {
    console.error("PATCH /api/users/[id]/operations/[operationId] error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
} 