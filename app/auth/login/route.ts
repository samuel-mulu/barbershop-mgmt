import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Branch from "@/models/Branch";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production";

export async function POST(req: Request) {
  await connectDB();
  const { phone, password, branchId, checkOnly } = await req.json();

  const user = await User.findOne({ phone });
  if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

  if (checkOnly) {
    // Step 1: Only return user info for role check
    return new Response(JSON.stringify({ user: { _id: user._id, name: user.name, phone: user.phone, role: user.role } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });

  // For admin/barber/washer, check branchId
  if (["admin", "barber", "washer"].includes(user.role)) {
    if (!branchId) {
      return new Response(JSON.stringify({ error: "Branch ID is required" }), { status: 401 });
    }
    // Check if branchId exists in Branch collection
    const branchExists = await Branch.findById(branchId);
    if (!branchExists) {
      return new Response(JSON.stringify({ error: "Branch does not exist" }), { status: 401 });
    }
    // Now check if the user's branchId matches
    if (String(user.branchId) !== String(branchId)) {
      return new Response(JSON.stringify({ error: "Invalid branch ID for this user" }), { status: 401 });
    }
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
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
