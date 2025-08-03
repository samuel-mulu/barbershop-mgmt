import { NextResponse } from "next/server";
import Branch from "@/models/Branch";
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
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: branchId } = await params;
    
    if (!branchId) {
      return NextResponse.json({ error: "Branch ID is required" }, { status: 400 });
    }

    const branch = await Branch.findById(branchId).select("_id name ownerId");
    
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    return NextResponse.json(branch);
  } catch (error: unknown) {
    console.error("GET /api/branches/[id] error:", error);
    let errorMessage = "Server error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 