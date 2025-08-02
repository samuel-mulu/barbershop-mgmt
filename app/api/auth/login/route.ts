import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import Branch from '@/models/Branch';
import { connectDB } from '@/lib/db';

export async function POST(req: Request) {
  const { phone, password } = await req.json();
  await connectDB();

  const user = await User.findOne({ phone });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' });

  return NextResponse.json({ 
    token, 
    user: { 
      _id: user._id, 
      name: user.name, 
      phone: user.phone, 
      role: user.role,
      branchId: user.branchId 
    } 
  });
}
