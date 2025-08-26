import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyTokenAsync } from "@/lib/verifyToken";

export async function GET(req: Request) {
  try {
    await connectDB();
    
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyTokenAsync(token);
    
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get user from database
    const user = await User.findById(decoded._id).select('-password');
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check user status
    if (user.isActive === false) {
      return NextResponse.json({ 
        error: "Account deactivated",
        status: "deactivated"
      }, { status: 403 });
    }

    if (user.isSuspended === true) {
      return NextResponse.json({ 
        error: "Account suspended",
        status: "suspended"
      }, { status: 403 });
    }

    // Return user info if active
    return NextResponse.json({
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        branchId: user.branchId,
        isActive: user.isActive,
        isSuspended: user.isSuspended
      },
      status: "active"
    });
  } catch (error: unknown) {
    console.error("GET /api/auth/me error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
