"use client";
import { useState, useEffect } from "react";
import { Scissors } from "lucide-react";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    
    // Check for error parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error === 'deactivated') {
      alert('⚠️ Your account has been deactivated.\n\nPlease contact your administrator to restore access.');
    } else if (error === 'suspended') {
      alert('⚠️ Your account has been suspended.\n\nPlease contact your administrator to restore access.');
    }
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Complete login with existing branchId from database
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.user.branchId) {
          localStorage.setItem("branchId", data.user.branchId);
        }
        
        // Redirect to appropriate dashboard based on user role
        const dashboardPath = `/dashboard/${data.user.role}`;
        console.log("🔍 Redirecting to dashboard:", dashboardPath);
        window.location.href = dashboardPath;
      } else {
        // Handle specific error messages
        const errorMessage = data.error || "Login failed";
        if (errorMessage.includes("deactivated") || errorMessage.includes("suspended")) {
          alert(`⚠️ ${errorMessage}\n\nPlease contact your administrator to restore access.`);
        } else {
          alert(errorMessage);
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        <div className="container">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg mb-3">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-800 mb-1">
              ፈታ
            </h1>
            <p className="text-slate-600 text-xs">
              Professional Management System
            </p>
          </div>
          <div className="heading">Sign In</div>
          <div className="form">
            <div className="input-skeleton"></div>
            <div className="input-skeleton"></div>
            <div className="button-skeleton"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="container">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg mb-3">
            </div>
          <h1 className="text-lg font-bold text-slate-800 mb-1">
          <Scissors className="w-6 h-6 text-white" />
          ፈታ
          </h1>
          <h1 className="text-lg font-bold text-slate-800 mb-1">
            barber pro
          </h1>
          
        </div>

        
        <form key={mounted ? 'mounted' : 'loading'} className="form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          {/* Phone Input */}
          <input
            required
            className="input"
            type="tel"
            name="phone"
            id="phone"
            placeholder="Phone Number"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            autoComplete="tel"
            inputMode="tel"
            suppressHydrationWarning
          />

          {/* Password Input */}
          <div className="relative">
            <input
              required
              type="password"
              className="input"
              name="password"
              id="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              suppressHydrationWarning
            />
          </div>

          <span className="forgot-password">
            <a href="/forgot-password">Forgot Password ?</a>
          </span>

          <button
            className="login-button"
            type="submit"
            disabled={loading || !phone || !password}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>



        <span className="agreement">
          <a href="#">Learn user licence agreement</a>
        </span>
      </div>

      <style jsx>{`
        .container {
          max-width: 350px;
          background: #F8F9FD;
          background: linear-gradient(0deg, rgb(255, 255, 255) 0%, rgb(244, 247, 251) 100%);
          border-radius: 40px;
          padding: 25px 35px;
          border: 5px solid rgb(255, 255, 255);
          box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 30px 30px -20px;
          margin: 20px;
          /* Ensure proper scaling */
          max-width: 90vw;
          transform: translateZ(0);
        }

        /* Mobile responsive adjustments */
        @media (max-width: 480px) {
          .container {
            max-width: 95vw;
            margin: 10px;
            padding: 20px;
            border-radius: 20px;
          }
          
          .heading {
            font-size: 24px;
          }
          
          .form .input {
            font-size: 16px; /* Prevent zoom on iOS */
            padding: 12px 16px;
          }
          
          .form .login-button {
            font-size: 16px; /* Prevent zoom on iOS */
            padding: 12px 20px;
          }
        }

        .heading {
          text-align: center;
          font-weight: 900;
          font-size: 30px;
          color: rgb(16, 137, 211);
        }

        .form {
          margin-top: 20px;
        }

        .form .input {
          width: 100%;
          background: white;
          border: none;
          padding: 15px 20px;
          border-radius: 20px;
          margin-top: 15px;
          box-shadow: #cff0ff 0px 10px 10px -5px;
          border-inline: 2px solid transparent;
          font-size: 14px;
        }

        .form .input::-moz-placeholder {
          color: rgb(170, 170, 170);
        }

        .form .input::placeholder {
          color: rgb(170, 170, 170);
        }

        .form .input:focus {
          outline: none;
          border-inline: 2px solid #12B1D1;
        }

        .form .forgot-password {
          display: block;
          margin-top: 10px;
          margin-left: 10px;
        }

        .form .forgot-password a {
          font-size: 11px;
          color: #0099ff;
          text-decoration: none;
        }

        .form .login-button {
          display: block;
          width: 100%;
          font-weight: bold;
          background: linear-gradient(45deg, rgb(16, 137, 211) 0%, rgb(18, 177, 209) 100%);
          color: white;
          padding-block: 15px;
          margin: 20px auto;
          border-radius: 20px;
          box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 20px 10px -15px;
          border: none;
          transition: all 0.2s ease-in-out;
          cursor: pointer;
        }

        .form .login-button:hover:not(:disabled) {
          transform: scale(1.03);
          box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 23px 10px -20px;
        }

        .form .login-button:active:not(:disabled) {
          transform: scale(0.95);
          box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 15px 10px -10px;
        }

        .form .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }



        .agreement {
          display: block;
          text-align: center;
          margin-top: 15px;
        }

        .agreement a {
          text-decoration: none;
          color: #0099ff;
          font-size: 9px;
        }

        .input-skeleton {
          width: 100%;
          height: 50px;
          background: #f1f5f9;
          border-radius: 20px;
          margin-top: 15px;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .button-skeleton {
          width: 100%;
          height: 50px;
          background: #e2e8f0;
          border-radius: 20px;
          margin: 20px auto;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}