import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/dbService";
import { verifyToken } from "@/lib/verifyToken";

// GET - List all withdrawals for a specific owner
export async function GET(
  request: NextRequest,
  { params }: { params: { ownerId: string } }
) {
  try {
    // Verify the token and get user info
    const decoded = verifyToken(request);
    if (!decoded || !decoded._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownerId = params.ownerId;
    const withdrawals = await DatabaseService.getWithdrawals(ownerId);

    return NextResponse.json({
      success: true,
      withdrawals,
      count: withdrawals.length
    });

  } catch (error: any) {
    console.error("Owner Withdrawals GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch withdrawals" },
      { status: 500 }
    );
  }
}
