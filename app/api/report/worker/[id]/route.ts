import { NextResponse } from "next/server";
import Report from "@/models/Report";
import { connectDB } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id: workerId } = await params;
  const reports = await Report.find({ workerId }).populate("serviceId").populate("branchId");
  return NextResponse.json(reports);
} 