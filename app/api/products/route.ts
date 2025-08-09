import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/dbService";
import { verifyToken } from "@/lib/verifyToken";

// GET - List all products for an admin
export async function GET(request: NextRequest) {
  try {
    // Verify the token and get user info
    const decoded = verifyToken(request);
    if (!decoded || !decoded._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminId = decoded._id;
    const products = await DatabaseService.getProducts(adminId);

    return NextResponse.json({ 
      success: true, 
      products,
      count: products.length 
    });

  } catch (error: any) {
    console.error("Products GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST - Add new product for an admin
export async function POST(request: NextRequest) {
  try {
    // Verify the token and get user info
    const decoded = verifyToken(request);
    if (!decoded || !decoded._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminId = decoded._id;
    const body = await request.json();
    const { name, quantity, quantityType, pricePerUnit } = body;

    const product = await DatabaseService.createProduct(adminId, {
      name,
      quantity,
      quantityType,
      pricePerUnit
    });

    return NextResponse.json({
      success: true,
      product,
      message: "Product added successfully"
    }, { status: 201 });

  } catch (error: any) {
    console.error("Products POST error:", error);
    return NextResponse.json(
      { error: "Failed to add product" },
      { status: 500 }
    );
  }
}
