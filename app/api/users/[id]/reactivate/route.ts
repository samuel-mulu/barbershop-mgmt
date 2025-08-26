import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { verifyTokenAsync } from "@/lib/verifyToken";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyTokenAsync(token);
    
    if (!decoded || decoded.role !== "owner") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const userId = params.id;
    
    // Update user to active and not suspended
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isActive: true, isSuspended: false },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "User reactivated successfully",
      user: updatedUser 
    });
  } catch (error: unknown) {
    console.error("PUT /api/users/[id]/reactivate error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
