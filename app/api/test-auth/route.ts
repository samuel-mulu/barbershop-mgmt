import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";

export async function GET(req: Request) {
  try {
    console.log("🔍 Testing authentication endpoint");
    console.log("🔍 JWT_SECRET exists:", !!process.env.JWT_SECRET);
    console.log("🔍 Headers:", Object.fromEntries(req.headers.entries()));
    
    const decoded = verifyToken(req);
    console.log("🔍 Token verification result:", decoded);
    
    return NextResponse.json({
      status: "success",
      hasJWTSecret: !!process.env.JWT_SECRET,
      tokenVerified: !!decoded,
      decoded: decoded ? {
        userId: decoded.userId,
        role: decoded.role,
        email: decoded.email
      } : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Test auth error:", error);
    return NextResponse.json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 