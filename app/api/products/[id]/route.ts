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

    // Get the product ID from params
    const productId = params.id;
    const adminId = decoded._id;

    // Get the update data from request body
    const updateData = await request.json();

    console.log('Updating product:', productId, 'for admin:', adminId, 'with data:', updateData);

    // Update the product using DatabaseService
    const updatedProduct = await DatabaseService.updateProduct(adminId, productId, {
      name: updateData.name,
      quantity: updateData.quantity,
      quantityType: updateData.quantityType,
      pricePerUnit: updateData.pricePerUnit,
      totalPrice: updateData.totalPrice,
      updatedAt: new Date()
    });

    console.log('Product updated successfully:', updatedProduct);

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Error updating product:', error);
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

    // Get the product ID from params
    const productId = params.id;
    const adminId = decoded._id;

    // Delete the product from the user's products array
    const result = await DatabaseService.deleteProduct(adminId, productId);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
