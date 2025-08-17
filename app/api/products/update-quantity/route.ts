import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/dbService";
import { verifyToken } from "@/lib/verifyToken";

export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || !decoded._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productUpdates } = await request.json();
    
    if (!productUpdates || !Array.isArray(productUpdates)) {
      return NextResponse.json({ error: "Invalid product updates data" }, { status: 400 });
    }

    // Update each product quantity
    const updatePromises = productUpdates.map(async (update: { productId: string, quantitySold: number }) => {
      const { productId, quantitySold } = update;
      
      if (!productId || quantitySold <= 0) {
        throw new Error("Invalid product update data");
      }

      // Get current product
      const product = await DatabaseService.findProductById(productId);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      // Check if enough quantity available
      if (product.quantity < quantitySold) {
        throw new Error(`Insufficient quantity for product ${product.name}. Available: ${product.quantity}, Requested: ${quantitySold}`);
      }

      // Update product quantity
      const newQuantity = product.quantity - quantitySold;
      return await DatabaseService.updateProductQuantity(productId, newQuantity);
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ 
      success: true, 
      message: "Product quantities updated successfully",
      updatedProducts: productUpdates.length 
    });

  } catch (error: any) {
    console.error("Product quantity update error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to update product quantities" 
    }, { status: 500 });
  }
}
