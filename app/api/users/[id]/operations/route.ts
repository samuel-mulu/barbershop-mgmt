import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/verifyToken";

export async function GET(
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

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const { id: userId } = await params;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let operations: unknown[] = [];

    if (user.role === "admin") {
      // For admin users, get adminServiceOperations
      operations = user.adminServiceOperations || [];
    } else {
      // For workers, get serviceOperations
      operations = user.serviceOperations || [];
    }

    // Filter by date if provided
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      operations = operations.filter(operation => {
        const operationDate = new Date(operation.createdAt);
        return operationDate >= startOfDay && operationDate < endOfDay;
      });
    }

    // Sort by creation date (newest first)
    operations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(operations);
  } catch (error: unknown) {
    console.error("GET /api/users/[id]/operations error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

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

    const { operationId } = await req.json();
    const { id: userId } = await params;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const finishedDate = new Date().toISOString();

    // Update the operation status
    if (user.role === "admin") {
      // Update adminServiceOperations
      await User.updateOne(
        { 
          _id: userId,
          "adminServiceOperations._id": operationId 
        },
        { 
          $set: { 
            "adminServiceOperations.$.status": "finished",
            "adminServiceOperations.$.finishedDate": finishedDate
          } 
        }
      );
    } else {
      // Update serviceOperations
      await User.updateOne(
        { 
          _id: userId,
          "serviceOperations._id": operationId 
        },
        { 
          $set: { 
            "serviceOperations.$.status": "finished",
            "serviceOperations.$.finishedDate": finishedDate
          } 
        }
      );
    }

    return NextResponse.json({ message: "Operation status updated successfully" });
  } catch (error: unknown) {
    console.error("PATCH /api/users/[id]/operations error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 