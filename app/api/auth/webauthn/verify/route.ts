// app/api/auth/webauthn/verify/route.ts
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Branch from "@/models/Branch";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { phone, assertion } = await req.json();

    if (!phone || !assertion) {
      return new Response(JSON.stringify({ error: "phone and assertion are required" }), { status: 400 });
    }

    const user = await User.findOne({ phone });
    if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

    // Basic account checks
    if (user.isActive === false) {
      return new Response(JSON.stringify({ error: "Account is deactivated. Please contact your administrator." }), { status: 403 });
    }
    if (user.isSuspended === true) {
      return new Response(JSON.stringify({ error: "Account is suspended. Please contact your administrator." }), { status: 403 });
    }

    // Admin/barber/washer must have a valid branch
    if (["admin", "barber", "washer"].includes(user.role)) {
      if (!user.branchId) {
        return new Response(JSON.stringify({ error: "User is not assigned to any branch" }), { status: 401 });
      }
      const branchExists = await Branch.findById(user.branchId);
      if (!branchExists) {
        return new Response(JSON.stringify({ error: "User's assigned branch does not exist" }), { status: 401 });
      }
    }

    // Placeholder verification: In production, verify signature using stored public key.
    // Here we only check that the credentialId matches one on file.
    const credId = assertion.id || assertion.rawId;
    const hasCred = (user.webauthnCredentials || []).some((c: any) => c.credentialId === credId);
    if (!hasCred) {
      return new Response(JSON.stringify({ error: "Biometric credential not recognized" }), { status: 401 });
    }

    const token = jwt.sign(
      { _id: user._id, name: user.name, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return new Response(
      JSON.stringify({
        message: "Login success",
        token,
        user: {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          branchId: user.branchId,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("webauthn verify error", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
} 