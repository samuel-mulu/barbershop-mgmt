import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check if environment variables are set
    const hasMongoDB = !!process.env.MONGODB_URI;
    const hasJWT = !!process.env.JWT_SECRET;
    
    return NextResponse.json({
      status: "ok",
      environment: process.env.NODE_ENV,
      hasMongoDB,
      hasJWT,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 