import { NextRequest, NextResponse } from "next/server";
import { sendOTPSMS } from "../../../src/services/afromessage";

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otpCode } = await request.json();

    if (!phoneNumber || !otpCode) {
      return NextResponse.json(
        { success: false, error: "phoneNumber and otpCode are required" },
        { status: 400 }
      );
    }

    const ok = await sendOTPSMS(String(phoneNumber), String(otpCode));
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "Failed to send OTP" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("/api/send-otp error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || "Internal error" },
      { status: 500 }
    );
  }
}


