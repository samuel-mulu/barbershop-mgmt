import { NextResponse } from "next/server";
import Branch from "@/models/Branch";
import Owner from "@/models/Owner";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";
import { verifyToken } from "@/lib/verifyToken";

export async function POST(req: Request) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded || decoded.role !== "owner") {
      console.log("Unauthorized access attempt:", decoded);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const ownerId = decoded._id;
    console.log("Creating branch for owner:", ownerId);
    
    const { name, services } = await req.json();
    console.log("Received data:", { name, services });
    
    if (!name) {
      return NextResponse.json({ error: "Branch name is required" }, { status: 400 });
    }
    if (!Array.isArray(services)) {
      return NextResponse.json({ error: "Services must be an array" }, { status: 400 });
    }
    
    const branch = await Branch.create({ name, ownerId, services });
    console.log("Branch created:", branch._id);
    
    // Update owner's branches array
    await Owner.findByIdAndUpdate(ownerId, { $push: { branches: branch._id } });
    
    return NextResponse.json(branch, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/branches error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    console.log("🔍 GET /api/branches - Headers:", Object.fromEntries(req.headers.entries()));
    
    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get("ownerId");
    console.log("🔍 OwnerId from query params:", ownerId);
    
    let branches;
    
    if (ownerId && mongoose.Types.ObjectId.isValid(ownerId)) {
      branches = await Branch.find({ ownerId });
    } else if (ownerId) {
      return NextResponse.json({ error: "Invalid ownerId" }, { status: 400 });
    } else {
      // Return all branches for login selection
      branches = await Branch.find().select("_id name");
    }
    
    return NextResponse.json(branches);
  } catch (error: unknown) {
    console.error("GET /api/branches error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 