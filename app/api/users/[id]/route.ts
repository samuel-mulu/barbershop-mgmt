import { NextResponse } from "next/server";
import User from "@/models/User";
import Branch from "@/models/Branch";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/verifyToken";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    // Verify token
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { branchId } = await req.json();
    const userId = params.id;

    // Validate branchId
    if (!branchId) {
      return NextResponse.json({ error: "Branch ID is required" }, { status: 400 });
    }

    // Check if branch exists
    const branchExists = await Branch.findById(branchId);
    if (!branchExists) {
      return NextResponse.json({ error: "Branch does not exist" }, { status: 400 });
    }

    // Update user's branchId
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { branchId },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error: unknown) {
    console.error("PUT /api/users/[id] error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
} 