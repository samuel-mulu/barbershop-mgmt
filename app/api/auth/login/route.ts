import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Branch from "@/models/Branch";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production";

export async function POST(req: Request) {
  await connectDB();
  const { phone, password, branchId, checkOnly } = await req.json();

  console.log("🔍 Login request:", { phone, branchId, checkOnly });

  const user = await User.findOne({ phone });
  
  console.log("🔍 User from database:", { 
    _id: user?._id, 
    name: user?.name, 
    role: user?.role, 
    branchId: user?.branchId 
  });
  if (!user) {
    console.log("❌ User not found for phone:", phone);
    return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
  }

  console.log("✅ User found:", { _id: user._id, name: user.name, role: user.role, branchId: user.branchId });

  // Check if user is deactivated
  if (user.isActive === false) {
    console.log("❌ User is deactivated:", user.name);
    return new Response(JSON.stringify({ error: "Account is deactivated. Please contact your administrator." }), { status: 403 });
  }

  // Check if user is suspended
  if (user.isSuspended === true) {
    console.log("❌ User is suspended:", user.name);
    return new Response(JSON.stringify({ error: "Account is suspended. Please contact your administrator." }), { status: 403 });
  }

  if (checkOnly) {
    // Step 1: Only return user info for role check
    return new Response(JSON.stringify({ user: { _id: user._id, name: user.name, phone: user.phone, role: user.role } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    console.log("❌ Invalid password for user:", user.name);
    return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
  }

  // For admin/barber/washer, check if they have a branchId in the database
  if (["admin", "barber", "washer"].includes(user.role)) {
    if (!user.branchId) {
      console.log("❌ User has no branchId assigned:", user.name);
      return new Response(JSON.stringify({ error: "User is not assigned to any branch" }), { status: 401 });
    }
    
    // Check if the user's branchId exists in Branch collection
    const branchExists = await Branch.findById(user.branchId);
    if (!branchExists) {
      console.log("❌ User's branch not found:", user.branchId);
      return new Response(JSON.stringify({ error: "User's assigned branch does not exist" }), { status: 401 });
    }
    
    console.log("✅ User branch verified:", user.branchId);
  }

  const token = jwt.sign(
    { _id: user._id, name: user.name, phone: user.phone, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  console.log("✅ Login successful for user:", user.name, "Role:", user.role);

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
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
