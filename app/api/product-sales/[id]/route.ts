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

    // Update the product sale using DatabaseService
    const updatedSale = await DatabaseService.updateProductSale(adminId, saleId, {
      productName: updateData.productName,
      soldQuantity: updateData.soldQuantity,
      pricePerUnit: updateData.pricePerUnit,
      totalSoldMoney: updateData.totalSoldMoney,
      updatedAt: new Date()
    });

    // If there's a quantity difference, update the product quantity
    if (updateData.quantityDifference && updateData.productId) {
      console.log('Updating product quantity by:', updateData.quantityDifference);
      await DatabaseService.updateProductQuantityForAdmin(adminId, updateData.productId, -updateData.quantityDifference);
    }

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
      console.log('Restoring product quantity for deleted sale:', sale.soldQuantity);
      try {
        await DatabaseService.updateProductQuantityForAdmin(adminId, sale.productId, sale.soldQuantity);
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
