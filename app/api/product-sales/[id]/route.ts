import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../lib/dbService';
import { verifyTokenAsync } from '../../../lib/verifyToken';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = await verifyTokenAsync(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the product sale ID from params
    const saleId = params.id;
    const adminId = decoded._id;

    // Get the update data from request body
    const updateData = await request.json();

    console.log('Updating product sale:', saleId, 'for admin:', adminId, 'with data:', updateData);
    console.log('Payment method:', updateData.by);
    console.log('Payment image URL:', updateData.paymentImageUrl);

    // Update the product sale using DatabaseService
    const updatedSale = await DatabaseService.updateProductSale(adminId, saleId, {
      productName: updateData.productName,
      soldQuantity: updateData.soldQuantity,
      pricePerUnit: updateData.pricePerUnit,
      totalSoldMoney: updateData.totalSoldMoney,
      status: updateData.status || 'pending',
      by: updateData.by, // Update payment method
      paymentImageUrl: updateData.paymentImageUrl, // Update payment image URL
      updatedAt: new Date()
    });
    
    console.log('🛒 Updated sale with status:', updateData.status || 'pending');

    // Note: Quantity updates are now handled by the frontend before calling this API
    // This ensures proper rollback if the sale update fails

    console.log('Product sale updated successfully:', updatedSale);

    return NextResponse.json({
      success: true,
      message: 'Product sale updated successfully',
      sale: updatedSale
    });

  } catch (error) {
    console.error('Error updating product sale:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = await verifyTokenAsync(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the product sale ID from params
    const saleId = params.id;
    const adminId = decoded._id;

    console.log('Attempting to delete product sale:', saleId, 'for admin:', adminId);

    // Get the sale details before deleting to restore quantity
    const sale = await DatabaseService.getProductSaleById(adminId, saleId);
    console.log('Found sale to delete:', sale);
    
    if (sale && sale.productId) {
      console.log('🛒 [DELETE] Restoring product quantity for deleted sale:', sale.soldQuantity);
      try {
        // Get current product to calculate new quantity
        const product = await DatabaseService.findProductById(sale.productId);
        if (product) {
          const newQuantity = product.quantity + sale.soldQuantity;
          console.log('🛒 [DELETE] Quantity restoration:', {
            currentQuantity: product.quantity,
            restoredQuantity: sale.soldQuantity,
            newQuantity
          });
          
          await DatabaseService.updateProductQuantity(sale.productId, newQuantity);
          console.log('🛒 [DELETE] Product quantity restored successfully');
        } else {
          console.log('🛒 [DELETE] Product not found for quantity restoration:', sale.productId);
        }
      } catch (error) {
        if (error instanceof Error) {
          console.log('Could not restore product quantity (product may not exist):', error.message);
        } else {
          console.log('Could not restore product quantity (product may not exist):', error);
        }
        // Continue with deletion even if quantity restoration fails
      }
    }

    // Delete the product sale from the user's productSales array
    const result = await DatabaseService.deleteProductSale(adminId, saleId);
    console.log('Delete result:', result);

    return NextResponse.json({
      success: true,
      message: 'Product sale deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product sale:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
