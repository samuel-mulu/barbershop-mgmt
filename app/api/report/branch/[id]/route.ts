import { NextResponse } from "next/server";
import Report from "@/models/Report";
import { connectDB } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const branchId = params.id;
  const reports = await Report.find({ branchId }).populate("serviceId").populate("workerId").populate("adminId");
  return NextResponse.json(reports);
} 