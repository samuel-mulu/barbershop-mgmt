import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/verifyToken";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // Verify token
    const decoded = verifyToken(req);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { originalOperation, ...updateData } = await req.json();
    
    console.log("🔍 Updating service operation:", id, "with data:", updateData);
    console.log("🔍 Original operation for reference:", originalOperation);

    // Find the admin user
    const user = await User.findById(decoded._id);
    if (!user) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    console.log("🔍 Looking for operation with ID:", id);
    console.log("🔍 Original operation:", originalOperation);
    console.log("🔍 Available operations in database:", user.adminServiceOperations);
    
    // Find the specific operation in the adminServiceOperations array
    const operationIndex = user.adminServiceOperations.findIndex((op: any) => {
      console.log("🔍 Checking operation:", op);
      console.log("🔍 Operation _id:", op._id);
      console.log("🔍 Looking for ID:", id);
      
      // Try to match by _id first, then by other properties
      if (op._id && op._id.toString() === id) {
        console.log("🔍 Found by _id match");
        return true;
      }
      
      // If no _id match, try to match by other properties
      if (originalOperation) {
        // Match by essential properties, excluding createdAt which might have slight differences
        const propertyMatch = (
          op.name === originalOperation.name &&
          op.price === originalOperation.price &&
          op.workerName === originalOperation.workerName &&
          op.workerRole === originalOperation.workerRole &&
          op.by === originalOperation.by
        );
        
        if (propertyMatch) {
          console.log("🔍 Found by property match (excluding createdAt)");
        }
        
        return propertyMatch;
      }
      
      return false;
    });

    if (operationIndex === -1) {
      console.log("❌ Operation not found in adminServiceOperations");
      return NextResponse.json({ error: "Service operation not found" }, { status: 404 });
    }

    // Update the specific operation
    user.adminServiceOperations[operationIndex] = {
      ...user.adminServiceOperations[operationIndex],
      ...updateData,
      updatedAt: new Date()
    };

    await user.save();

    console.log("✅ Service operation updated successfully");
    return NextResponse.json({ 
      message: "Service operation updated successfully",
      updatedOperation: user.adminServiceOperations[operationIndex]
    });
  } catch (error: unknown) {
    console.error("PUT /api/admin/service-operations/[id] error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // Verify token
    const decoded = verifyToken(req);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { originalOperation } = await req.json();
    
    console.log("🔍 Deleting service operation:", id);
    console.log("🔍 Original operation for reference:", originalOperation);

    // Find the admin user
    const user = await User.findById(decoded._id);
    if (!user) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    // Find and remove the specific operation from the adminServiceOperations array
    const initialLength = user.adminServiceOperations.length;
    
    user.adminServiceOperations = user.adminServiceOperations.filter((op: any) => {
      // Try to match by _id first, then by other properties
      if (op._id && op._id.toString() === id) {
        return false; // Remove this operation
      }
      
      // If no _id match, try to match by other properties
      if (originalOperation) {
        const shouldRemove = (
          op.name === originalOperation.name &&
          op.price === originalOperation.price &&
          op.workerName === originalOperation.workerName &&
          op.workerRole === originalOperation.workerRole &&
          op.by === originalOperation.by
        );
        return !shouldRemove; // Keep operations that don't match
      }
      
      return true; // Keep all operations if no originalOperation provided
    });

    if (user.adminServiceOperations.length === initialLength) {
      console.log("❌ Operation not found in adminServiceOperations");
      return NextResponse.json({ error: "Service operation not found" }, { status: 404 });
    }

    await user.save();

    console.log("✅ Service operation deleted successfully");
    return NextResponse.json({ message: "Service operation deleted successfully" });
  } catch (error: unknown) {
    console.error("DELETE /api/admin/service-operations/[id] error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
