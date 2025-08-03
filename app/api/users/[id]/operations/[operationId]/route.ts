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

    const decoded = verifyToken(req);
    if (!decoded || decoded.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status, finishedDate } = await req.json();
    const { id: userId, operationId } = await params;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const operationIndex = parseInt(operationId);

    if (user.role === "admin") {
      const adminOperations = user.adminServiceOperations || [];

      if (operationIndex < 0 || operationIndex >= adminOperations.length) {
        return NextResponse.json({ error: "Operation not found" }, { status: 404 });
      }

      adminOperations[operationIndex].status = status;
      if (finishedDate) {
        adminOperations[operationIndex].finishedDate = finishedDate;
      }

      const result = await User.updateOne(
        { _id: userId },
        { $set: { adminServiceOperations: adminOperations } }
      );

      if (result.modifiedCount === 0) {
        return NextResponse.json({ error: "Operation not updated" }, { status: 404 });
      }
    } else {
      const serviceOperations = user.serviceOperations || [];

      if (operationIndex < 0 || operationIndex >= serviceOperations.length) {
        return NextResponse.json({ error: "Operation not found" }, { status: 404 });
      }

      serviceOperations[operationIndex].status = status;
      if (finishedDate) {
        serviceOperations[operationIndex].finishedDate = finishedDate;
      }

      const result = await User.updateOne(
        { _id: userId },
        { $set: { serviceOperations: serviceOperations } }
      );

      if (result.modifiedCount === 0) {
        return NextResponse.json({ error: "Operation not updated" }, { status: 404 });
      }
    }

    return NextResponse.json({ message: "Operation status updated successfully" });
  } catch (error: unknown) {
    console.error("PATCH /api/users/[id]/operations/[operationId] error:", String(error));
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
