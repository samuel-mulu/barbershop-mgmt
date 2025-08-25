import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Branch from "@/models/Branch";
import { verifyTokenAsync } from "@/lib/verifyToken";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const decoded = await verifyTokenAsync(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Connect to database
    await connectDB();

    const { id } = params;

    // Find the branch
    const branch = await Branch.findById(id);
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    // Return share settings (with defaults if not set)
    const shareSettings = branch.shareSettings || {
      barberShare: 50,
      washerShare: 10
    };

    console.log(`🔍 Retrieved share settings for branch ${id}:`, shareSettings);

    return NextResponse.json(shareSettings);

  } catch (error) {
    console.error("❌ Error fetching share settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const decoded = await verifyTokenAsync(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if user is an owner
    if (decoded.role !== "owner") {
      return NextResponse.json({ error: "Only owners can update share settings" }, { status: 403 });
    }

    // Connect to database
    await connectDB();

    const { id } = params;
    const body = await request.json();
    const { shareSettings } = body;

    console.log("🔍 Received share settings update request:", {
      branchId: id,
      body: body,
      shareSettings: shareSettings
    });

    // Validate input
    if (!shareSettings) {
      return NextResponse.json({ error: "Share settings are required" }, { status: 400 });
    }

    if (typeof shareSettings.barberShare !== 'number' || shareSettings.barberShare < 0 || shareSettings.barberShare > 100) {
      return NextResponse.json({ error: "Barber share must be a number between 0 and 100" }, { status: 400 });
    }

    if (typeof shareSettings.washerShare !== 'number' || shareSettings.washerShare < 0 || shareSettings.washerShare > 100) {
      return NextResponse.json({ error: "Washer share must be a number between 0 and 100" }, { status: 400 });
    }

    // Find and update the branch
    const branch = await Branch.findById(id);
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    console.log("🔍 Found branch:", {
      id: branch._id,
      name: branch.name,
      currentShareSettings: branch.shareSettings,
      hasShareSettings: !!branch.shareSettings,
      shareSettingsType: typeof branch.shareSettings
    });

    // Update share settings
    const newShareSettings = {
      barberShare: shareSettings.barberShare,
      washerShare: shareSettings.washerShare
    };

    console.log("🔍 New share settings to save:", newShareSettings);

    branch.shareSettings = newShareSettings;

    console.log("🔍 Updated branch shareSettings:", branch.shareSettings);
    console.log("🔍 Branch before save:", {
      id: branch._id,
      shareSettings: branch.shareSettings,
      hasShareSettings: !!branch.shareSettings
    });

    // Save to database
    const savedBranch = await branch.save();
    console.log("🔍 Branch saved successfully:", {
      id: savedBranch._id,
      shareSettings: savedBranch.shareSettings,
      hasShareSettings: !!savedBranch.shareSettings
    });

    // Verify the save by fetching again
    const verifyBranch = await Branch.findById(id);
    console.log("🔍 Verification - branch after save:", {
      id: verifyBranch?._id,
      shareSettings: verifyBranch?.shareSettings,
      hasShareSettings: !!verifyBranch?.shareSettings
    });

    console.log(`✅ Share settings updated for branch ${id}:`, {
      barberShare: shareSettings.barberShare,
      washerShare: shareSettings.washerShare
    });

    return NextResponse.json({
      message: "Share settings updated successfully",
      shareSettings: branch.shareSettings
    });

  } catch (error) {
    console.error("❌ Error updating share settings:", error);
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to database
    await connectDB();

    const { id } = params;

    // Find the branch
    const branch = await Branch.findById(id);
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    // Test setting share settings
    const testShareSettings = {
      barberShare: 75,
      washerShare: 25
    };

    console.log("🧪 Testing share settings save...");
    console.log("🧪 Original branch:", {
      id: branch._id,
      name: branch.name,
      shareSettings: branch.shareSettings
    });

    branch.shareSettings = testShareSettings;
    const savedBranch = await branch.save();

    console.log("🧪 Saved branch:", {
      id: savedBranch._id,
      shareSettings: savedBranch.shareSettings
    });

    // Fetch again to verify
    const verifyBranch = await Branch.findById(id);
    console.log("🧪 Verified branch:", {
      id: verifyBranch?._id,
      shareSettings: verifyBranch?.shareSettings
    });

    return NextResponse.json({
      message: "Test completed",
      original: branch.shareSettings,
      saved: savedBranch.shareSettings,
      verified: verifyBranch?.shareSettings
    });

  } catch (error) {
    console.error("❌ Test error:", error);
    return NextResponse.json(
      { error: "Test failed" },
      { status: 500 }
    );
  }
}