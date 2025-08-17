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

    // Get the withdrawal ID from params
    const withdrawalId = params.id;
    const adminId = decoded._id;

    // Get the update data from request body
    const updateData = await request.json();

    console.log('Updating withdrawal:', withdrawalId, 'for admin:', adminId, 'with data:', updateData);

    // Update the withdrawal using DatabaseService
    const updatedWithdrawal = await DatabaseService.updateWithdrawal(adminId, withdrawalId, {
      reason: updateData.reason,
      amount: updateData.amount,
      updatedAt: new Date()
    });

    console.log('Withdrawal updated successfully:', updatedWithdrawal);

    return NextResponse.json({
      success: true,
      message: 'Withdrawal updated successfully',
      withdrawal: updatedWithdrawal
    });

  } catch (error) {
    console.error('Error updating withdrawal:', error);
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

    // Get the withdrawal ID from params
    const withdrawalId = params.id;
    const adminId = decoded._id;

    // Delete the withdrawal from the user's withdrawals array
    const result = await DatabaseService.deleteWithdrawal(adminId, withdrawalId);

    return NextResponse.json({
      success: true,
      message: 'Withdrawal deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting withdrawal:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
