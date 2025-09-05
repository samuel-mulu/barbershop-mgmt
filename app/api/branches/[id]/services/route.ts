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
      shareSettings: service.shareSettings && typeof service.shareSettings === 'object' ? {
        barberShare: typeof service.shareSettings.barberShare === 'number' ? service.shareSettings.barberShare : 50,
        washerShare: typeof service.shareSettings.washerShare === 'number' ? service.shareSettings.washerShare : 10,
      } : branch.services[serviceIndex].shareSettings || { barberShare: 50, washerShare: 10 },
    } as any;

    await branch.save();
    console.log("Service updated successfully");

    return NextResponse.json(branch);
  } catch (error: unknown) {
    console.error("PUT /api/branches/[id]/services error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
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
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
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
      if (service.shareSettings) {
        const { barberShare, washerShare } = service.shareSettings;
        if ((barberShare < 0 || barberShare > 100) || (washerShare < 0 || washerShare > 100)) {
          return NextResponse.json({ error: "Share settings must be between 0 and 100" }, { status: 400 });
        }
      }
    }

    // Add services to the branch
    const branch = await Branch.findById(id);
    if (!branch) {
      console.log("Branch not found for service addition:", id);
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    // Normalize incoming services to ensure shareSettings defaults exist
    const normalizedServices = services.map((s: any) => {
      // Coerce numeric-like strings to numbers
      const barberPriceNum = typeof s.barberPrice === 'string' ? parseInt(s.barberPrice, 10) : s.barberPrice;
      const washerPriceNum = typeof s.washerPrice === 'string' ? parseInt(s.washerPrice, 10) : s.washerPrice;
      let incomingShare = s.shareSettings && typeof s.shareSettings === 'object' ? s.shareSettings : undefined;
      const barberShareNum = incomingShare && typeof incomingShare.barberShare === 'string' ? parseInt(incomingShare.barberShare, 10) : incomingShare?.barberShare;
      const washerShareNum = incomingShare && typeof incomingShare.washerShare === 'string' ? parseInt(incomingShare.washerShare, 10) : incomingShare?.washerShare;

      const hasBarber = typeof barberPriceNum === 'number' && !isNaN(barberPriceNum);
      const hasWasher = typeof washerPriceNum === 'number' && !isNaN(washerPriceNum);
      let share = (incomingShare ? { barberShare: barberShareNum, washerShare: washerShareNum } : undefined) as { barberShare?: number; washerShare?: number } | undefined;
      // If UI forgot to send shareSettings, default based on which roles are priced.
      if (!share) {
        // Default split: if both priced, keep existing defaults 50/10; if single role priced, 100% to that role
        if (hasBarber && hasWasher) {
          share = { barberShare: 50, washerShare: 10 };
        } else if (hasBarber) {
          share = { barberShare: 100, washerShare: 0 };
        } else if (hasWasher) {
          share = { barberShare: 0, washerShare: 100 };
        } else {
          share = { barberShare: 50, washerShare: 10 };
        }
      }
      return {
        name: s.name,
        barberPrice: hasBarber ? barberPriceNum : undefined,
        washerPrice: hasWasher ? washerPriceNum : undefined,
        shareSettings: {
          barberShare: typeof share.barberShare === 'number' ? share.barberShare : 50,
          washerShare: typeof share.washerShare === 'number' ? share.washerShare : 10,
        }
      };
    });

    branch.services.push(...normalizedServices);
    await branch.save();

    console.log("Services added successfully to branch:", branch._id);
    return NextResponse.json(branch);
  } catch (error: unknown) {
    console.error("POST /api/branches/[id]/services error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 