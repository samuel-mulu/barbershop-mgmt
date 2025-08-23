import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/verifyToken";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    // Verify token
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = await params;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let operations: any[] = [];

    console.log('🔍 User role:', user.role);
    console.log('🔍 User ID:', userId);
    console.log('🔍 Admin service operations count:', user.adminServiceOperations?.length || 0);
    console.log('🔍 Service operations count:', user.serviceOperations?.length || 0);

    if (user.role === "admin") {
      // For admin users, get adminServiceOperations that are pending_to_confirm
      operations = (user.adminServiceOperations || []).filter(op => 
        op.status === 'pending_to_confirm'
      );
      console.log('🔍 Admin operations with pending_to_confirm status:', operations.length);
    } else {
      // For workers, get serviceOperations that are pending_to_confirm
      operations = (user.serviceOperations || []).filter(op => 
        op.status === 'pending_to_confirm'
      );
      console.log('🔍 Worker operations with pending_to_confirm status:', operations.length);
      
      // Debug: Show all service operations and their statuses
      if (user.serviceOperations && user.serviceOperations.length > 0) {
        console.log('🔍 All service operations statuses:', user.serviceOperations.map(op => ({
          name: op.name,
          price: op.price,
          status: op.status,
          createdAt: op.createdAt
        })));
      }
    }

    // Sort by payment confirmed date (newest first)
    operations.sort((a, b) => {
      const dateA = new Date(a.paymentConfirmedDate || a.createdAt);
      const dateB = new Date(b.paymentConfirmedDate || b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({ 
      operations,
      count: operations.length
    });
  } catch (error: unknown) {
    console.error("GET /api/users/[id]/payment-confirmations error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
