/*
  AfroMessage SMS Service
  ---------------------------------
  Environment variables expected:
  - AFROMESSAGE_BASE_URL   (e.g., https://api.afromessage.com)
  - AFROMESSAGE_API_KEY    (API key/token)
  - AFROMESSAGE_SENDER_ID  (registered sender ID)

  All functions return simple primitives and log errors for server visibility.
*/

export type AfroMessageResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

const BASE_URL = process.env.AFROMESSAGE_BASE_URL || "";
const API_KEY = process.env.AFROMESSAGE_API_KEY || "";
const SENDER_ID = process.env.AFROMESSAGE_SENDER_ID || "";

function ensureConfigured(): void {
  if (!BASE_URL || !API_KEY || !SENDER_ID) {
    throw new Error(
      "AfroMessage is not configured. Please set AFROMESSAGE_BASE_URL, AFROMESSAGE_API_KEY, and AFROMESSAGE_SENDER_ID."
    );
  }
}

async function httpPost<T = unknown>(path: string, body: unknown): Promise<AfroMessageResponse<T>> {
  ensureConfigured();
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { success: false, error: text || `HTTP ${res.status}` };
    }

    const data = (await res.json().catch(() => ({}))) as T;
    return { success: true, data };
  } catch (error) {
    console.error("[AfroMessage] POST error:", error);
    return { success: false, error: (error as Error).message };
  }
}

async function httpGet<T = unknown>(path: string): Promise<AfroMessageResponse<T>> {
  ensureConfigured();
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { success: false, error: text || `HTTP ${res.status}` };
    }

    const data = (await res.json().catch(() => ({}))) as T;
    return { success: true, data };
  } catch (error) {
    console.error("[AfroMessage] GET error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function sendOTPSMS(to: string, otpCode: string): Promise<boolean> {
  try {
    const message = `Your Longtea password reset OTP is: ${otpCode}. Valid for 10 minutes.`;
    const payload = {
      to,
      from: SENDER_ID,
      message,
      type: "otp",
    };

    // NOTE: Replace "/sms/send" with the actual AfroMessage OTP endpoint path if different
    const res = await httpPost("/sms/send", payload);
    if (!res.success) {
      console.error("[AfroMessage] sendOTPSMS error:", res.error);
    }
    return !!res.success;
  } catch (error) {
    console.error("[AfroMessage] sendOTPSMS exception:", error);
    return false;
  }
}

export async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    const payload = {
      to,
      from: SENDER_ID,
      message,
      type: "text",
    };

    // NOTE: Replace "/sms/send" with the actual AfroMessage Send path if needed
    const res = await httpPost("/sms/send", payload);
    if (!res.success) {
      console.error("[AfroMessage] sendSMS error:", res.error);
    }
    return !!res.success;
  } catch (error) {
    console.error("[AfroMessage] sendSMS exception:", error);
    return false;
  }
}

export async function verifyConnection(): Promise<boolean> {
  try {
    // NOTE: Replace "/health" with a real AfroMessage health endpoint if available.
    const res = await httpGet("/health");
    if (!res.success) {
      console.error("[AfroMessage] verifyConnection error:", res.error);
    }
    return !!res.success;
  } catch (error) {
    console.error("[AfroMessage] verifyConnection exception:", error);
    return false;
  }
}

export async function getBalance(): Promise<number | null> {
  try {
    // NOTE: Replace "/account/balance" with the actual AfroMessage balance endpoint
    const res = await httpGet<{ balance?: number | string }>("/account/balance");
    if (!res.success) {
      console.error("[AfroMessage] getBalance error:", res.error);
      return null;
    }
    const data = res.data || {};
    const raw = (data as any).balance;
    if (raw == null) return null;
    const num = typeof raw === "string" ? parseFloat(raw) : Number(raw);
    return Number.isFinite(num) ? num : null;
  } catch (error) {
    console.error("[AfroMessage] getBalance exception:", error);
    return null;
  }
}





