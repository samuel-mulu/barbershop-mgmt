import { NextRequest, NextResponse } from "next/server";
import { sendSMS } from "../../../src/services/afromessage";

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { success: false, error: "phoneNumber and message are required" },
        { status: 400 }
      );
    }

    const ok = await sendSMS(String(phoneNumber), String(message));
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "Failed to send SMS" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("/api/send-sms error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || "Internal error" },
      { status: 500 }
    );
  }
}


