"use client";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Smartphone, Lock, Scissors } from "lucide-react";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
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
        alert(data.error || "Login failed");
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
              Barbershop Pro
            </h1>
            <p className="text-slate-600 text-xs">
              Professional Management System
            </p>
          </div>
          <div className="heading">Sign In</div>
          <div className="form">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <input
                required
                className="input pl-12"
                type="tel"
                name="phone"
                id="phone"
                placeholder="Phone Number"
                autoComplete="tel"
                inputMode="tel"
                disabled
              />
            </div>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                required
                className="input pl-12 pr-12"
                type="password"
                name="password"
                id="password"
                placeholder="Password"
                autoComplete="current-password"
                disabled
              />
            </div>
            <button
              className="login-button"
              type="submit"
              disabled
            >
              Sign In
            </button>
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
            <Scissors className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg font-bold text-slate-800 mb-1">
            Barbershop Pro
          </h1>
          <p className="text-slate-600 text-xs">
            Professional Management System
          </p>
        </div>

        <div className="heading">Sign In</div>
        
        <form className="form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          {/* Phone Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <input
              required
              className="input pl-12"
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
          </div>

          {/* Password Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              required
              className="input pl-12 pr-12"
              type={showPassword ? "text" : "password"}
              name="password"
              id="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              suppressHydrationWarning
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              suppressHydrationWarning
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
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

        <div className="social-account-container">
          <span className="title">Or</span>
          <div className="social-accounts">
            <a href="/register" className="social-button register">
              <span className="text-white text-xs font-medium">Register</span>
            </a>
          </div>
        </div>

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

        .social-account-container {
          margin-top: 25px;
        }

        .social-account-container .title {
          display: block;
          text-align: center;
          font-size: 10px;
          color: rgb(170, 170, 170);
        }

        .social-account-container .social-accounts {
          width: 100%;
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 5px;
        }

        .social-account-container .social-accounts .social-button {
          background: linear-gradient(45deg, rgb(0, 0, 0) 0%, rgb(112, 112, 112) 100%);
          border: 5px solid white;
          padding: 5px 15px;
          border-radius: 25px;
          min-width: 80px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 12px 10px -8px;
          transition: all 0.2s ease-in-out;
          text-decoration: none;
        }

        .social-account-container .social-accounts .social-button:hover {
          transform: scale(1.1);
        }

        .social-account-container .social-accounts .social-button:active {
          transform: scale(0.9);
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
      `}</style>
    </div>
  );
}