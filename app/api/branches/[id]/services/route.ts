import { NextResponse } from "next/server";
import Branch from "@/models/Branch";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/verifyToken";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    // Verify token
    const decoded = verifyToken(req);
    if (!decoded || decoded.role !== "owner") {
      console.log("Unauthorized access attempt for service update:", decoded);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serviceIndex, service } = await req.json();
    const { id } = await params;
    console.log("Updating service:", { branchId: id, serviceIndex, service });
    
    if (serviceIndex === undefined || serviceIndex < 0) {
      return NextResponse.json({ error: "Service index is required" }, { status: 400 });
    }

    if (!service.name) {
      return NextResponse.json({ error: "Service name is required" }, { status: 400 });
    }

    // Update the specific service in the branch
    const branch = await Branch.findById(id);
    if (!branch) {
      console.log("Branch not found:", id);
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    if (serviceIndex >= branch.services.length) {
      console.log("Service index out of bounds:", serviceIndex, "services length:", branch.services.length);
      return NextResponse.json({ error: "Service index out of bounds" }, { status: 400 });
    }

    // Update the service at the specified index
    branch.services[serviceIndex] = {
      name: service.name,
      barberPrice: service.barberPrice,
      washerPrice: service.washerPrice,
    };

    await branch.save();
    console.log("Service updated successfully");

    return NextResponse.json(branch);
  } catch (error: unknown) {
    console.error("PUT /api/branches/[id]/services error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    // Verify token
    const decoded = verifyToken(req);
    if (!decoded || decoded.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const serviceIndex = searchParams.get("serviceIndex");
    
    if (!serviceIndex || isNaN(parseInt(serviceIndex))) {
      return NextResponse.json({ error: "Service index is required" }, { status: 400 });
    }

    const index = parseInt(serviceIndex);
    const { id } = await params;

    // Remove the service at the specified index
    const branch = await Branch.findById(id);
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    if (index >= branch.services.length) {
      return NextResponse.json({ error: "Service index out of bounds" }, { status: 400 });
    }

    // Remove the service at the specified index
    branch.services.splice(index, 1);
    await branch.save();

    return NextResponse.json(branch);
  } catch (error: unknown) {
    console.error("DELETE /api/branches/[id]/services error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    // Verify token
    const decoded = verifyToken(req);
    if (!decoded || decoded.role !== "owner") {
      console.log("Unauthorized access attempt for service creation:", decoded);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { services } = await req.json();
    const { id } = await params;
    console.log("Adding services to branch:", id, services);
    
    if (!services || !Array.isArray(services) || services.length === 0) {
      return NextResponse.json({ error: "Services array is required" }, { status: 400 });
    }

    // Validate each service
    for (const service of services) {
      if (!service.name) {
        return NextResponse.json({ error: "Service name is required" }, { status: 400 });
      }
    }

    // Add services to the branch
    const branch = await Branch.findByIdAndUpdate(
      id,
      { $push: { services: { $each: services } } },
      { new: true }
    );

    if (!branch) {
      console.log("Branch not found for service addition:", id);
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    console.log("Services added successfully to branch:", branch._id);
    return NextResponse.json(branch);
  } catch (error: unknown) {
    console.error("POST /api/branches/[id]/services error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
} 