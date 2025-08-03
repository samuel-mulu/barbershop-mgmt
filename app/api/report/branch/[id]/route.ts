import { NextResponse } from "next/server";
import Report from "@/models/Report";
import { connectDB } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id: branchId } = await params;
  const reports = await Report.find({ branchId }).populate("serviceId").populate("workerId").populate("adminId");
  return NextResponse.json(reports);
} 