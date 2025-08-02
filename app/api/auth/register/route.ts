// app/api/auth/register/route.ts
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Branch from "@/models/Branch";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { phone, name, password, role, branchId } = await req.json();

    if (!phone || !name || !password || !role)
      return new Response(JSON.stringify({ error: "All fields are required" }), { status: 400 });

    if (!["owner", "admin", "barber", "washer", "customer"].includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), { status: 400 });
    }

    // Check if branch exists if branchId is provided
    if (branchId) {
      const branchExists = await Branch.findById(branchId);
      if (!branchExists) {
        return new Response(JSON.stringify({ error: "Branch does not exist" }), { status: 400 });
      }
    }

    const existing = await User.findOne({ phone });
    if (existing)
      return new Response(JSON.stringify({ error: "User already exists" }), { status: 400 });

    const hashed = await bcrypt.hash(password, 10);
    
    // Create user data object with proper typing
    const userData: any = { phone, name, password: hashed, role };
    
    // Add branchId only if provided
    if (branchId) {
      userData.branchId = branchId;
    }
    
    await User.create(userData);

    return new Response(JSON.stringify({ message: "Registered" }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
