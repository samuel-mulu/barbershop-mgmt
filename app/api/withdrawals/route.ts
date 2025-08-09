import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/dbService";
import { verifyToken } from "@/lib/verifyToken";

// GET - List all withdrawals for an admin
export async function GET(request: NextRequest) {
  try {
    // Verify the token and get user info
    const decoded = verifyToken(request);
    if (!decoded || !decoded._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminId = decoded._id;
    const withdrawals = await DatabaseService.getWithdrawals(adminId);

    return NextResponse.json({
      success: true,
      withdrawals,
      count: withdrawals.length
    });

  } catch (error: any) {
    console.error("Withdrawals GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch withdrawals" },
      { status: 500 }
    );
  }
}

// POST - Add new withdrawal for an admin
export async function POST(request: NextRequest) {
  try {
    // Verify the token and get user info
    const decoded = verifyToken(request);
    if (!decoded || !decoded._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminId = decoded._id;
    const body = await request.json();
    const { reason, amount } = body;

    if (!reason || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Withdrawal reason and positive amount are required" },
        { status: 400 }
      );
    }

    // Handle withdrawal - create withdrawal record
    const newWithdrawal = await DatabaseService.createWithdrawal(adminId, {
      reason: reason,
      amount: amount
    });

    return NextResponse.json({
      success: true,
      withdrawal: newWithdrawal,
      message: "Withdrawal recorded successfully"
    }, { status: 201 });

  } catch (error: any) {
    console.error("Withdrawals POST error:", error);
    return NextResponse.json(
      { error: "Failed to record withdrawal" },
      { status: 500 }
    );
  }
}

