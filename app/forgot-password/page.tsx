"use client";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const sendOtp = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otpCode }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback("✅ OTP sent successfully.");
      } else {
        setFeedback(data.error || "Failed to send OTP");
      }
    } catch (error) {
      setFeedback("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const sendGeneric = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, message }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback("✅ SMS sent successfully.");
      } else {
        setFeedback(data.error || "Failed to send SMS");
      }
    } catch (error) {
      setFeedback("Failed to send SMS");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
        <h1 className="text-xl font-bold text-slate-800 mb-1">Forgot Password</h1>
        <p className="text-slate-600 text-sm mb-4">Send a password reset OTP to your phone.</p>

        <div className="space-y-3">
          <input
            type="tel"
            placeholder="Phone number"
            className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <input
            type="text"
            placeholder="OTP code"
            className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
          />
          <button
            onClick={sendOtp}
            disabled={loading || !phoneNumber || !otpCode}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-3 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </div>

        <div className="mt-6 border-t pt-4 space-y-3">
          <p className="text-slate-600 text-sm">Send generic SMS (demo)</p>
          <input
            type="text"
            placeholder="Message"
            className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            onClick={sendGeneric}
            disabled={loading || !phoneNumber || !message}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl p-3 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send SMS"}
          </button>
        </div>

        {feedback && (
          <div className="mt-4 text-center text-sm text-slate-700">{feedback}</div>
        )}
      </div>
    </div>
  );
}


