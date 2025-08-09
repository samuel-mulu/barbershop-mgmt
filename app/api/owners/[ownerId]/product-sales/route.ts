import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/dbService";
import { verifyToken } from "@/lib/verifyToken";

// GET - List all product sales for a specific owner
export async function GET(
  request: NextRequest,
  { params }: { params: { ownerId: string } }
) {
  try {
    // Verify the token and get user info
    const decoded = verifyToken(request);
    if (!decoded || !decoded._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownerId = params.ownerId;
    const productSales = await DatabaseService.getProductSales(ownerId);

    return NextResponse.json({
      success: true,
      productSales,
      count: productSales.length
    });

  } catch (error: any) {
    console.error("Owner Product Sales GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product sales" },
      { status: 500 }
    );
  }
}
