import { NextResponse } from "next/server";
import { DatabaseService } from "@/lib/dbService";
import { verifyToken } from "@/lib/verifyToken";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify token
    const decoded = verifyToken(req);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const updateData = await req.json();
    
    console.log("🔧 [API] Received update request:", {
      id,
      updateData,
      convertToNewStructure: updateData.convertToNewStructure
    });

    // Update the operation using DatabaseService
    const updatedOperation = await DatabaseService.updateAdminServiceOperation(
      decoded._id,
      id,
      updateData
    );
    

    
    return NextResponse.json({ 
      message: "Service operation updated successfully",
      updatedOperation: updatedOperation
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify token
    const decoded = verifyToken(req);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Delete the operation using DatabaseService
    const deletedOperation = await DatabaseService.deleteAdminServiceOperation(
      decoded._id,
      id
    );
    
    return NextResponse.json({ 
      message: "Service operation deleted successfully",
      deletedOperation: deletedOperation
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
