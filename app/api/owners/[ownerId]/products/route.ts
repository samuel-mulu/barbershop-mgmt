import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/dbService";
import { verifyToken } from "@/lib/verifyToken";

// GET - List all products for a specific owner
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
    const products = await DatabaseService.getProducts(ownerId);

    return NextResponse.json({ 
      success: true, 
      products,
      count: products.length 
    });

  } catch (error: any) {
    console.error("Owner Products GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
} 