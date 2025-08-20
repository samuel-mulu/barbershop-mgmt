import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/verifyToken";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ ownerId: string }> }
) {
  try {
    await connectDB();
    
    // Verify token
    const decoded = verifyToken(req);
    if (!decoded || decoded.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { operationIndices, status, finishedDate } = await req.json();
    const { ownerId } = await params;

    if (!operationIndices || !Array.isArray(operationIndices) || operationIndices.length === 0) {
      return NextResponse.json({ error: "Operation indices are required" }, { status: 400 });
    }

    // Find the owner
    const owner = await User.findById(ownerId);
    if (!owner) {
      return NextResponse.json({ error: "Owner not found" }, { status: 404 });
    }

    // Update productSales
    const productSales = owner.productSales || [];
    let updatedCount = 0;
    
    operationIndices.forEach(index => {
      if (index >= 0 && index < productSales.length) {
        productSales[index].status = status;
        if (finishedDate) {
          productSales[index].finishedDate = finishedDate;
        }
        updatedCount++;
      }
    });

    const result = await User.updateOne(
      { _id: ownerId },
      { $set: { productSales: productSales } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "No operations were updated" }, { status: 400 });
    }

    return NextResponse.json({ 
      message: `Successfully updated ${updatedCount} operations`,
      updatedCount,
      status 
    });
  } catch (error: unknown) {
    console.error("PATCH /api/owners/[ownerId]/product-sales/bulk-update error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
