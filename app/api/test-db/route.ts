import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET() {
  try {
    // Test database connection
    await connectDB();
    
    return NextResponse.json({
      status: "success",
      message: "Database connection successful",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Database connection error:", error);
    
    return NextResponse.json({
      status: "error",
      message: error instanceof Error ? error.message : "Database connection failed",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 