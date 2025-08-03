"use client";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  className?: string;
  variant?: "default" | "red" | "outline";
}

export default function LogoutButton({ className = "", variant = "default" }: LogoutButtonProps) {
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("branchId");
    window.location.href = "/login";
  };

  const getButtonClasses = () => {
    const baseClasses = "flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors duration-200";
    
    switch (variant) {
      case "red":
        return `${baseClasses} bg-red-500 hover:bg-red-600 text-white shadow-sm`;
      case "outline":
        return `${baseClasses} border border-slate-300 hover:bg-slate-50 text-slate-700`;
      default:
        return `${baseClasses} bg-slate-100 hover:bg-slate-200 text-slate-700`;
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`${getButtonClasses()} ${className}`}
      title="Logout"
    >
      <LogOut className="w-4 h-4 mr-2" />
      Logout
    </button>
  );
} 