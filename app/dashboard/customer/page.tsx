"use client";
import { useState, useEffect } from "react";
import { getUserFromLocalStorage } from "@/utils/auth";
import { User, LogOut } from "lucide-react";

export default function CustomerPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = getUserFromLocalStorage();
    if (userData) {
      setUser(userData);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("branchId");
    window.location.href = "/login";
  };

  if (!user) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading customer dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header Section */}
      <div className="header-section">
        <div className="header-content">
          <div className="header-icon">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="heading">Customer Dashboard</h1>
            <p className="subtitle">Welcome back, {user.name}</p>
          </div>
        </div>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="logout-button"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>

      {/* Content Section */}
      <div className="content-section">
        <h2 className="section-title">Customer Features</h2>
        <p className="text-slate-600">Customer dashboard features coming soon...</p>
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          background: #f8fafc;
          padding: 1rem;
        }

        .header-section {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 1rem;
          border-radius: 16px;
          box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
        }

        .heading {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .subtitle {
          color: #64748b;
          margin: 0.25rem 0 0 0;
          font-size: 1.1rem;
        }

        .logout-button {
          display: flex;
          align-items: center;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .logout-button:hover {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
        }

        .logout-button:active {
          transform: translateY(0);
        }

        .content-section {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 1rem;
        }

        .loading-state {
          text-align: center;
          padding: 3rem 1rem;
          color: #64748b;
        }

        .loading-spinner {
          width: 2rem;
          height: 2rem;
          border: 3px solid #e2e8f0;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
  