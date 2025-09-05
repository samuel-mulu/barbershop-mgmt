import { NextResponse } from "next/server";
import Branch from "@/models/Branch";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/verifyToken";

// One-time migration: copy branch-level shareSettings to each service if missing
// and remove branch-level shareSettings field.
export async function POST(req: Request) {
  try {
    await connectDB();

    const decoded = verifyToken(req);
    if (!decoded || decoded.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const branches = await Branch.find({});
    let updatedBranches = 0;
    for (const branch of branches) {
      let changed = false;
      // Determine defaults from any existing branch-level setting or use 50/10
      // @ts-ignore legacy field may still exist in db
      const legacy = (branch as any).shareSettings || { barberShare: 50, washerShare: 10 };

      // Ensure per-service shareSettings
      for (const service of branch.services) {
        if (!service.shareSettings) {
          // @ts-ignore nested path
          service.shareSettings = {
            barberShare: typeof legacy.barberShare === 'number' ? legacy.barberShare : 50,
            washerShare: typeof legacy.washerShare === 'number' ? legacy.washerShare : 10,
          };
          changed = true;
        }
      }

      // Unset legacy field if present
      // @ts-ignore legacy field may exist
      if ((branch as any).shareSettings !== undefined) {
        // @ts-ignore
        branch.set('shareSettings', undefined, { strict: false });
        // @ts-ignore
        branch.markModified('shareSettings');
        changed = true;
      }

      if (changed) {
        await branch.save();
        updatedBranches += 1;
      }
    }

    return NextResponse.json({ message: "Migration complete", updatedBranches });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to run migration" });
}

