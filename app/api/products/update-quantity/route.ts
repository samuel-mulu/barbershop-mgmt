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
      
      console.log(`🛒 [UPDATE-QUANTITY] Processing update for product ${productId}:`, {
        quantitySold,
        isPositive: quantitySold > 0,
        isNegative: quantitySold < 0
      });
      
      if (!productId) {
        throw new Error("Invalid product update data");
      }

      // Get current product
      const product = await DatabaseService.findProductById(productId);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      console.log(`🛒 [UPDATE-QUANTITY] Found product:`, {
        name: product.name,
        currentQuantity: product.quantity,
        quantitySold,
        operation: quantitySold > 0 ? 'SALE' : 'ROLLBACK'
      });

      // Calculate new quantity (quantitySold can be negative for rollbacks)
      const newQuantity = Math.max(0, product.quantity - quantitySold);
      
      console.log(`🛒 [UPDATE-QUANTITY] Quantity calculation:`, {
        currentQuantity: product.quantity,
        quantitySold,
        newQuantity,
        operation: quantitySold > 0 ? 'SUBTRACT' : 'ADD_BACK'
      });
      
      // For positive quantitySold (sales), check if enough quantity available
      if (quantitySold > 0 && product.quantity < quantitySold) {
        throw new Error(`Insufficient quantity for product ${product.name}. Available: ${product.quantity}, Requested: ${quantitySold}`);
      }

      // Update product quantity
      const result = await DatabaseService.updateProductQuantity(productId, newQuantity);
      console.log(`🛒 [UPDATE-QUANTITY] Update completed for ${product.name}:`, {
        oldQuantity: product.quantity,
        newQuantity,
        success: !!result
      });
      
      return result;
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
