import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Branch from "@/models/Branch";

export async function GET() {
  try {
    // Test database connection
    await connectDB();
    
    // Test User collection
    const userCount = await User.countDocuments();
    const sampleUser = await User.findOne();
    
    // Test Branch collection
    const branchCount = await Branch.countDocuments();
    const sampleBranch = await Branch.findOne();
    
    return NextResponse.json({
      status: "success",
      message: "Database connection and collections test successful",
      timestamp: new Date().toISOString(),
      collections: {
        users: {
          count: userCount,
          sample: sampleUser ? {
            _id: sampleUser._id,
            name: sampleUser.name,
            role: sampleUser.role,
            phone: sampleUser.phone
          } : null
        },
        branches: {
          count: branchCount,
          sample: sampleBranch ? {
            _id: sampleBranch._id,
            name: sampleBranch.name,
            ownerId: sampleBranch.ownerId
          } : null
        }
      }
    });
  } catch (error) {
    console.error("Database test error:", error);
    
    return NextResponse.json({
      status: "error",
      message: error instanceof Error ? error.message : "Database test failed",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.stack : "Unknown error"
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const { action, data } = await req.json();
    
    console.log("🔍 Test DB POST request:", { action, data });
    
    switch (action) {
      case "create-test-user":
        const testUser = new User({
          name: "Test User",
          phone: "1234567890",
          password: "$2b$10$test.hash.for.testing",
          role: "admin",
          branchId: data?.branchId || null
        });
        await testUser.save();
        return NextResponse.json({
          status: "success",
          message: "Test user created",
          user: {
            _id: testUser._id,
            name: testUser.name,
            phone: testUser.phone,
            role: testUser.role
          }
        });
        
      case "create-test-branch":
        const testBranch = new Branch({
          name: "Test Branch",
          ownerId: data?.ownerId || "507f1f77bcf86cd799439011"
        });
        await testBranch.save();
        return NextResponse.json({
          status: "success",
          message: "Test branch created",
          branch: {
            _id: testBranch._id,
            name: testBranch.name,
            ownerId: testBranch.ownerId
          }
        });
        
      case "list-users":
        const users = await User.find().select('name phone role branchId').limit(10);
        return NextResponse.json({
          status: "success",
          users: users
        });
        
      case "list-branches":
        const branches = await Branch.find().select('name ownerId').limit(10);
        return NextResponse.json({
          status: "success",
          branches: branches
        });
        
      case "find-user":
        const user = await User.findOne({ phone: data?.phone });
        return NextResponse.json({
          status: "success",
          user: user ? {
            _id: user._id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            branchId: user.branchId
          } : null
        });
        
      default:
        return NextResponse.json({
          status: "error",
          message: "Unknown action",
          availableActions: [
            "create-test-user",
            "create-test-branch", 
            "list-users",
            "list-branches",
            "find-user"
          ]
        }, { status: 400 });
    }
  } catch (error) {
    console.error("Test DB POST error:", error);
    
    return NextResponse.json({
      status: "error",
      message: error instanceof Error ? error.message : "Test operation failed",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.stack : "Unknown error"
    }, { status: 500 });
  }
} 