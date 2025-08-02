import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/db";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const ownerId = searchParams.get("ownerId");

    if (!branchId && !ownerId) {
      return NextResponse.json({ error: "Branch ID or Owner ID is required" }, { status: 400 });
    }

    let query: any = {};

    if (branchId) {
      // Fetch workers for a specific branch
      query.branchId = branchId;
      query.role = { $in: ["barber", "washer", "admin"] };
    } else if (ownerId) {
      // Fetch all workers across all branches owned by the owner
      // First, get all branches owned by this owner
      const Branch = (await import("@/models/Branch")).default;
      const branches = await Branch.find({ ownerId: ownerId });
      const branchIds = branches.map(branch => branch._id);
      
      query.branchId = { $in: branchIds };
      query.role = { $in: ["barber", "washer", "admin"] };
    }

    // Fetch users with barber/washer/admin roles
    const workers = await User.find(query).select("-password");

    return NextResponse.json(workers);
  } catch (error: any) {
    console.error("GET /api/workers error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const { name, role, branchId, phone, password } = await req.json();
    
    if (!name || !role || !branchId || !phone || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Create a new user with barber/washer role
    const worker = await User.create({ 
      name, 
      role, 
      branchId, 
      phone, 
      password 
    });

    return NextResponse.json(worker, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/workers error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
} 