import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/db";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get("ownerId");

    if (!ownerId) {
      return NextResponse.json({ error: "Owner ID is required" }, { status: 400 });
    }

    // First, get all branches owned by this owner
    const Branch = (await import("@/models/Branch")).default;
    const branches = await Branch.find({ ownerId: ownerId });
    const branchIds = branches.map(branch => branch._id);
    
    // Fetch all users (workers) across all branches owned by the owner
    const users = await User.find({
      branchId: { $in: branchIds },
      role: { $in: ["barber", "washer", "admin"] }
    }).select("-password");

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
} 