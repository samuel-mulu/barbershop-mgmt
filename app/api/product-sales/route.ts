import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/dbService";
import { verifyToken } from "@/lib/verifyToken";

// GET - List all product sales for an admin
export async function GET(request: NextRequest) {
  try {
    // Verify the token and get user info
    const decoded = verifyToken(request);
    if (!decoded || !decoded._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminId = decoded._id;
    const productSales = await DatabaseService.getProductSales(adminId);

    return NextResponse.json({
      success: true,
      productSales,
      count: productSales.length
    });

  } catch (error: any) {
    console.error("Product Sales GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product sales" },
      { status: 500 }
    );
  }
}

// POST - Add new product sale for an admin
export async function POST(request: NextRequest) {
  try {
    // Verify the token and get user info
    const decoded = verifyToken(request);
    if (!decoded || !decoded._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminId = decoded._id;
    const body = await request.json();
    const { productSales } = body;

    if (!productSales || !Array.isArray(productSales) || productSales.length === 0) {
      return NextResponse.json(
        { error: "Product sales data is required" },
        { status: 400 }
      );
    }

    // Handle product sale - create individual product sale records
    const createdSales = [];
    for (const productSale of productSales) {
      const { productId, soldQuantity } = productSale;

      // Get product details
      const product = await DatabaseService.getProductById(adminId, productId);
      if (product) {
        // Check if enough quantity is available
        if (product.quantity < soldQuantity) {
          return NextResponse.json(
            { error: `Insufficient quantity for ${product.name}. Available: ${product.quantity}, Requested: ${soldQuantity}` },
            { status: 400 }
          );
        }

        // Create individual product sale record
        const newProductSale = await DatabaseService.createProductSale(adminId, {
          productName: product.name,
          soldQuantity,
          pricePerUnit: product.pricePerUnit,
          totalSoldMoney: soldQuantity * product.pricePerUnit,
          productId
        });

        createdSales.push(newProductSale);

        // Update product quantity - ensure it doesn't go below 0
        const newQuantity = Math.max(0, product.quantity - soldQuantity);
        await DatabaseService.updateProduct(adminId, productId, {
          quantity: newQuantity
        });
      }
    }

    return NextResponse.json({
      success: true,
      sales: createdSales,
      message: "Product sales recorded successfully"
    }, { status: 201 });

  } catch (error: any) {
    console.error("Product Sales POST error:", error);
    return NextResponse.json(
      { error: "Failed to record product sale" },
      { status: 500 }
    );
  }
}

