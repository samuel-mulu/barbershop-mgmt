"use client";
import { useState, useEffect } from "react";
import { 
  Eye, 
  EyeOff, 
  Smartphone, 
  Lock, 
  User, 
  Building, 
  Scissors, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  Shield,
  ChevronDown,
  UserPlus
} from "lucide-react";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("admin");
  const [branchId, setBranchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [branches, setBranches] = useState<Array<{ _id: string; name: string }>>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const needsBranchId = ["admin", "barber", "washer"].includes(role);
  
  // Debug: Log when branch ID is needed
  console.log("Role:", role, "Needs Branch ID:", needsBranchId);

  // Fetch branches when component mounts
  useEffect(() => {
    const fetchBranches = async () => {
      setLoadingBranches(true);
      try {
        const response = await fetch("/api/branches");
        if (response.ok) {
          const branchesData = await response.json();
          setBranches(branchesData);
        } else {
          console.error("Failed to fetch branches");
        }
      } catch (error) {
        console.error("Error fetching branches:", error instanceof Error ? error.message : "Unknown error");
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchBranches();
  }, []);

  const selectedBranch = branches.find(branch => branch._id === branchId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.branch-dropdown-container')) {
        setShowBranchDropdown(false);
      }
    };

    if (showBranchDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBranchDropdown]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner": return <Shield className="w-4 h-4" />;
      case "admin": return <User className="w-4 h-4" />;
      case "barber": return <Scissors className="w-4 h-4" />;
      case "washer": return <Building className="w-4 h-4" />;
      case "customer": return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "owner": return "Full system access and management";
      case "admin": return "Branch management and oversight";
      case "barber": return "Service delivery and customer management";
      case "washer": return "Support services and maintenance";
      case "customer": return "Booking and service access";
      default: return "";
    }
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!canRegister) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    const body: Record<string, unknown> = { phone, password, name, role };
    if (needsBranchId) body.branchId = branchId;
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      
      if (res.ok) {
        alert("User registered successfully");
        window.location.href = "/login";
      } else {
        alert(data.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error instanceof Error ? error.message : "Unknown error");
      alert("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const canProceedToStep2 = name && phone;
  const canProceedToStep3 = password && confirmPassword && password === confirmPassword;
  const canRegister = name && phone && password && confirmPassword && password === confirmPassword && (!needsBranchId || branchId);
  
  // Show validation message for missing branch ID
  const showBranchIdError = needsBranchId && !branchId;

  // Show loading skeleton while mounting to prevent hydration mismatch
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
          <div className="heading">Create Account</div>
          <div className="form">
            <div className="relative">
              <div className="input bg-gray-100 animate-pulse" style={{ height: '50px', borderRadius: '20px' }} />
            </div>
            <div className="relative">
              <div className="input bg-gray-100 animate-pulse" style={{ height: '50px', borderRadius: '20px' }} />
            </div>
            <div className="login-button bg-gray-300 animate-pulse" style={{ height: '50px', borderRadius: '20px' }} />
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

        <div className="heading">Create Account</div>

        {/* Register Button */}
        <div className="register-button-container">
          <button
            type="button"
            onClick={handleRegister}
            disabled={loading || !canRegister}
            className="register-button"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Account...
              </div>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Register Now
              </>
            )}
          </button>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="step-item">
              <div className={`step-circle ${step >= stepNumber ? 'active' : ''}`}>
                {step > stepNumber ? <CheckCircle className="w-4 h-4" /> : stepNumber}
              </div>
              {stepNumber < 3 && <div className={`step-line ${step > stepNumber ? 'active' : ''}`} />}
            </div>
          ))}
        </div>

        <form className="form" onSubmit={(e) => { e.preventDefault(); }}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="step-content">
              <div className="step-title">Basic Information</div>
              <div className="step-subtitle">Tell us about yourself</div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  required
                  className="input pl-12"
                  type="text"
                  name="name"
                  id="name"
                  placeholder="Full Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                  suppressHydrationWarning
                />
              </div>

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

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2}
                className="login-button"
                suppressHydrationWarning
              >
                Next Step
                <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Password */}
          {step === 2 && (
            <div className="step-content">
              <div className="step-title">Secure Your Account</div>
              <div className="step-subtitle">Create a strong password</div>

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
                  autoComplete="new-password"
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

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  required
                  className="input pl-12 pr-12"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  id="confirmPassword"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  suppressHydrationWarning
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {confirmPassword && password !== confirmPassword && (
                <div className="error-message">Passwords do not match</div>
              )}

              <div className="button-group">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="secondary-button"
                  suppressHydrationWarning
                >
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!canProceedToStep3}
                  className="login-button"
                  suppressHydrationWarning
                >
                  Next
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Role & Branch */}
          {step === 3 && (
            <div className="step-content">
              <div className="step-title">Choose Your Role</div>
              <div className="step-subtitle">Select your role in the system</div>

              {/* Role Selection */}
              <div className="role-grid">
                {["owner", "admin", "barber", "washer", "customer"].map((roleOption) => (
                  <button
                    key={roleOption}
                    type="button"
                    onClick={() => setRole(roleOption)}
                    className={`role-button ${role === roleOption ? 'active' : ''}`}
                    suppressHydrationWarning
                  >
                    <div className="role-icon">
                      {getRoleIcon(roleOption)}
                    </div>
                    <div className="role-info">
                      <div className="role-name">{roleOption}</div>
                      <div className="role-description">{getRoleDescription(roleOption)}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Branch Selection */}
              {needsBranchId && (
                <div className="relative">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <div className="text-sm font-medium text-blue-800 mb-2">
                      🏢 Branch Selection Required
                    </div>
                    <div className="text-xs text-blue-600 mb-3">
                      This role requires you to be assigned to a specific branch. Please select your branch from the list below.
                    </div>
                  </div>
                  
                  <div className="relative branch-dropdown-container">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Building className="w-4 h-4" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                      className="w-full input pl-12 pr-12 text-left flex items-center justify-between"
                      disabled={loadingBranches}
                      suppressHydrationWarning
                    >
                      <span className={selectedBranch ? "text-slate-800" : "text-slate-500"}>
                        {selectedBranch ? selectedBranch.name : (loadingBranches ? "Loading branches..." : "Select a branch")}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showBranchDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showBranchDropdown && !loadingBranches && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        {branches.length === 0 ? (
                          <div className="p-3 text-sm text-slate-500 text-center">
                            No branches available
                          </div>
                        ) : (
                          branches.map((branch) => (
                            <button
                              key={branch._id}
                              type="button"
                              onClick={() => {
                                setBranchId(branch._id);
                                setShowBranchDropdown(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
                              suppressHydrationWarning
                            >
                              <div className="font-medium text-slate-800">{branch.name}</div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  
                  {showBranchIdError && (
                    <div className="text-red-500 text-xs mt-1 ml-1">
                      Branch selection is required for this role
                    </div>
                  )}
                </div>
              )}

              <div className="button-group">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="secondary-button"
                  suppressHydrationWarning
                >
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={loading || !canRegister}
                  className="login-button"
                  suppressHydrationWarning
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="social-account-container">
          <span className="title">Or</span>
          <div className="social-accounts">
            <a href="/login" className="social-button register">
              <span className="text-white text-xs font-medium">Sign In</span>
            </a>
          </div>
        </div>

        <span className="agreement">
          <a href="#">Learn user licence agreement</a>
        </span>
      </div>

      <style jsx>{`
        .container {
          max-width: 400px;
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

        .register-button-container {
          text-align: center;
          margin: 20px 0;
        }

        .register-button {
          background: linear-gradient(45deg, rgb(34, 197, 94) 0%, rgb(16, 185, 129) 100%);
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 25px;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: rgba(34, 197, 94, 0.3) 0px 10px 20px -5px;
          min-width: 200px;
        }

        .register-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: rgba(34, 197, 94, 0.4) 0px 15px 25px -5px;
        }

        .register-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .register-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .progress-steps {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 20px 0;
          gap: 8px;
        }

        .step-item {
          display: flex;
          align-items: center;
        }

        .step-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e5e7eb;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .step-circle.active {
          background: rgb(16, 137, 211);
          color: white;
        }

        .step-line {
          width: 40px;
          height: 2px;
          background: #e5e7eb;
          margin: 0 4px;
          transition: all 0.2s ease;
        }

        .step-line.active {
          background: rgb(16, 137, 211);
        }

        .form {
          margin-top: 20px;
        }

        .step-content {
          animation: fadeIn 0.3s ease;
        }

        .step-title {
          text-align: center;
          font-weight: 700;
          font-size: 18px;
          color: rgb(16, 137, 211);
          margin-bottom: 4px;
        }

        .step-subtitle {
          text-align: center;
          font-size: 12px;
          color: rgb(170, 170, 170);
          margin-bottom: 20px;
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

        .role-grid {
          display: grid;
          gap: 10px;
          margin-bottom: 20px;
        }

        .role-button {
          display: flex;
          align-items: center;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 15px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .role-button:hover {
          border-color: #12B1D1;
          box-shadow: #cff0ff 0px 5px 10px -5px;
        }

        .role-button.active {
          border-color: #12B1D1;
          background: #f0f9ff;
          box-shadow: #cff0ff 0px 5px 10px -5px;
        }

        .role-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(45deg, rgb(16, 137, 211) 0%, rgb(18, 177, 209) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          color: white;
        }

        .role-info {
          flex: 1;
        }

        .role-name {
          font-weight: 600;
          font-size: 14px;
          color: #374151;
          text-transform: capitalize;
        }

        .role-description {
          font-size: 11px;
          color: #6b7280;
          margin-top: 2px;
        }

        .button-group {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .secondary-button {
          flex: 1;
          font-weight: 600;
          background: white;
          color: rgb(16, 137, 211);
          padding: 15px;
          border-radius: 20px;
          box-shadow: #cff0ff 0px 10px 10px -5px;
          border: 2px solid #e5e7eb;
          transition: all 0.2s ease-in-out;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .secondary-button:hover {
          border-color: #12B1D1;
          box-shadow: #cff0ff 0px 15px 15px -10px;
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
          display: flex;
          align-items: center;
          justify-content: center;
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

        .error-message {
          color: #ef4444;
          font-size: 12px;
          margin-top: 8px;
          text-align: center;
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

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
