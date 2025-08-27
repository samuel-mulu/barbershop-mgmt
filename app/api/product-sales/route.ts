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
    
    // Get status filter from query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const productSales = await DatabaseService.getProductSales(adminId, status || undefined);

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
    console.log('🛒 Received request body:', body);
    console.log('🛒 Payment method:', body.by);
    console.log('🛒 Payment image URL:', body.paymentImageUrl);
    console.log('🛒 Product sales array:', body.productSales);
    const { productSales, by, paymentImageUrl } = body;

    if (!productSales || !Array.isArray(productSales) || productSales.length === 0) {
      return NextResponse.json(
        { error: "Product sales data is required" },
        { status: 400 }
      );
    }

    // Handle product sale - create individual product sale records
    const createdSales = [];
    for (const productSale of productSales) {
      const { productId, soldQuantity, status } = productSale;
      
      console.log('🛒 Processing product sale:', productSale);
      console.log('🛒 Status from request:', status);

      // Get product details - use global search since product might belong to any admin
      const product = await DatabaseService.findProductById(productId);
      console.log('🛒 Found product:', product);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${productId}` },
          { status: 400 }
        );
      }
      
      // Note: Quantity validation is handled in the frontend before this API call
      // We don't check quantity here to avoid race conditions with frontend quantity updates
      
      // Create individual product sale record
      const saleData = {
        productName: product.name,
        soldQuantity,
        pricePerUnit: product.pricePerUnit,
        totalSoldMoney: soldQuantity * product.pricePerUnit,
        productId,
        by: by || 'cash',
        paymentImageUrl: paymentImageUrl || undefined,
        status: productSale.status || 'pending'
      };
      
      console.log('🛒 Creating sale with status:', saleData.status);
      
      console.log('🛒 Creating product sale with data:', saleData);
      const newProductSale = await DatabaseService.createProductSale(adminId, saleData);
      console.log('🛒 Created product sale:', newProductSale);

      createdSales.push(newProductSale);

      // Note: Product quantity is updated separately via /api/products/update-quantity
      // to avoid double subtraction
    }

    return NextResponse.json({
      success: true,
      sales: createdSales,
      message: "Product sales recorded successfully"
    }, { status: 201 });

  } catch (error: any) {
    console.error("Product Sales POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record product sale" },
      { status: 500 }
    );
  }
}

