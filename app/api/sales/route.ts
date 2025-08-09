import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/dbService";
import { verifyToken } from "@/lib/verifyToken";

// GET - List all product sales and withdrawals for an admin
export async function GET(request: NextRequest) {
  try {
    // Verify the token and get user info
    const decoded = verifyToken(request);
    if (!decoded || !decoded._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminId = decoded._id;
    
    // Get both product sales and withdrawals
    const productSales = await DatabaseService.getProductSales(adminId);
    const withdrawals = await DatabaseService.getWithdrawals(adminId);

    return NextResponse.json({
      success: true,
      productSales,
      withdrawals,
      productSalesCount: productSales.length,
      withdrawalsCount: withdrawals.length
    });

  } catch (error: any) {
    console.error("Sales GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales data" },
      { status: 500 }
    );
  }
}

// POST - Add new product sale or withdrawal for an admin
export async function POST(request: NextRequest) {
  try {
    // Verify the token and get user info
    const decoded = verifyToken(request);
    if (!decoded || !decoded._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminId = decoded._id;
    const body = await request.json();
    const { type, productSales, withdrawalReason, withdrawalAmount } = body;

    if (type === 'product_sale') {
      // Handle product sale - create individual product sale records
      const createdSales = [];
      for (const productSale of productSales || []) {
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

    } else if (type === 'withdrawal') {
      // Handle withdrawal - create withdrawal record
      const newWithdrawal = await DatabaseService.createWithdrawal(adminId, {
        reason: withdrawalReason || "Withdrawal",
        amount: withdrawalAmount || 0
      });

      return NextResponse.json({
        success: true,
        withdrawal: newWithdrawal,
        message: "Withdrawal recorded successfully"
      }, { status: 201 });

    } else {
      return NextResponse.json(
        { error: "Invalid sale type" },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error("Sales POST error:", error);
    return NextResponse.json(
      { error: "Failed to record sale" },
      { status: 500 }
    );
  }
}
