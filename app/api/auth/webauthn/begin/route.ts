// app/api/auth/webauthn/begin/route.ts
import { connectDB } from "@/lib/db";
import User from "@/models/User";

function toB64Url(buf: Uint8Array | ArrayBuffer) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf as ArrayBuffer);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return Buffer.from(str, "binary").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const { phone } = await req.json();
    if (!phone) {
      return new Response(JSON.stringify({ error: "phone is required" }), { status: 400 });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    const creds = (user.webauthnCredentials || []) as any[];
    if (!creds.length) {
      return new Response(JSON.stringify({ error: "No biometric credential found for this user" }), { status: 404 });
    }

    // Build allowCredentials using base64url IDs (client converts to ArrayBuffer)
    const allowCredentials = creds.map((c) => ({
      type: "public-key",
      id: c.credentialId, // base64url string
      transports: c.transports || undefined,
    }));

    // Create a random challenge and send as base64url
    const challenge = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
      crypto.getRandomValues(challenge);
    } else {
      for (let i = 0; i < challenge.length; i++) challenge[i] = Math.floor(Math.random() * 256);
    }
    const challengeB64 = toB64Url(challenge);

    const publicKey = {
      challenge: challengeB64, // base64url string
      allowCredentials, // ids are base64url strings
      userVerification: "preferred",
      timeout: 60000,
    };

    return new Response(
      JSON.stringify({ publicKey, phone }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("webauthn begin error", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
} 