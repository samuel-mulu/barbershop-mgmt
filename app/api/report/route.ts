import { NextResponse } from "next/server";
import Report from "@/models/Report";
import { connectDB } from "@/lib/db";

export async function POST(req: Request) {
  await connectDB();
  const { branchId, serviceId, workerId, adminId, price } = await req.json();
  if (!branchId || !serviceId || !workerId || !adminId || !price) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const report = await Report.create({ branchId, serviceId, workerId, adminId, price });
  return NextResponse.json(report, { status: 201 });
} 