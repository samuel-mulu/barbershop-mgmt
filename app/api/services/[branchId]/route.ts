import { NextResponse } from "next/server";
import Branch from "@/models/Branch";
import { connectDB } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ branchId: string }> }) {
  try {
    await connectDB();
    const { branchId } = await params;
    
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    // Return the services array from the branch
    return NextResponse.json(branch.services || []);
  } catch (error: unknown) {
    console.error("GET /api/services/[branchId] error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 