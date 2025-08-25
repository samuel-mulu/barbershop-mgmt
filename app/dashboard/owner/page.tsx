"use client";
import { useState, useEffect } from "react";
import BranchesSection from "./components/BranchesSection";
import StaffSection from "./components/StaffSection";
import ReportsSection from "./components/ReportsSection";
import OwnerDataSection from "./components/OwnerDataSection";
import { 
  Building2, 
  Users, 
  BarChart3,
  LogOut,
  Menu,
  X,
  UserPlus
} from "lucide-react";

interface Branch {
  _id: string;
  name: string;
  ownerId: string;
  services: Array<{
    name: string;
    barberPrice?: number;
    washerPrice?: number;
  }>;
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  role: string;
  branchId: string;
  phone: string;
  serviceOperations?: Array<{
    name: string;
    price: number;
    status: string;
    createdAt: string;
    originalPrice?: number;
  }>;
  adminServiceOperations?: Array<{
    name: string;
    price: number;
    status: string;
    createdAt: string;
    workerName: string;
    workerRole: string;
    workerId: string;
  }>;
}

export default function OwnerDashboard() {
  // ===== STATE MANAGEMENT =====
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'branches' | 'staff' | 'reports' | 'ownerData'>('branches');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'pending' | 'finished'>('pending');
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [selectedDataType, setSelectedDataType] = useState<'products' | 'productSales' | 'withdrawals' | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // ===== INITIALIZATION =====
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setOwnerId(user._id || user.id);
  }, []);

  // ===== EVENT HANDLERS =====
  const handleViewStaff = (branch: Branch) => {
    setSelectedBranch(branch);
    setActiveSection('staff');
  };

  const handleSelectBranch = (branch: Branch | null) => {
    setSelectedBranch(branch);
  };

  const handleViewReports = (user: User, mode: 'pending' | 'finished') => {
    setSelectedUser(user);
    setViewMode(mode);
    setActiveSection('reports');
  };

  const handleBackToStaff = () => {
    setSelectedUser(null);
    setActiveSection('staff');
  };

  const handleViewOwnerData = (ownerId: string, dataType: 'products' | 'productSales' | 'withdrawals') => {
    setSelectedOwnerId(ownerId);
    setSelectedDataType(dataType);
    setActiveSection('ownerData');
  };

  const handleBackToStaffFromOwnerData = () => {
    setSelectedOwnerId(null);
    setSelectedDataType(null);
    setActiveSection('staff');
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("branchId");
    window.location.href = "/login";
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // ===== MAIN RENDER =====
  if (!ownerId) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading owner dashboard...</p>
      </div>
    );
  }



  return (
    <div className="dashboard-container">
      <div className="flex">
        {/* Sidebar */}
        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <div className="user-info">
              <p className="user-name">Owner Dashboard</p>
            </div>
            <button
              onClick={toggleSidebar}
              className="close-sidebar-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="sidebar-content">
            <button
              onClick={() => {
                setActiveSection('branches');
                setSidebarOpen(false);
              }}
              className={`sidebar-button ${activeSection === 'branches' ? 'active' : ''}`}
            >
              <Building2 className="w-4 h-4 mb-1" />
              <span>Branches</span>
            </button>
            
            <button
              onClick={() => {
                setActiveSection('staff');
                setSidebarOpen(false);
              }}
              className={`sidebar-button ${activeSection === 'staff' ? 'active' : ''}`}
            >
              <Users className="w-4 h-4 mb-1" />
              <span>Staff</span>
            </button>
            
            <button
              onClick={() => {
                setActiveSection('reports');
                setSidebarOpen(false);
              }}
              className={`sidebar-button ${activeSection === 'reports' ? 'active' : ''}`}
            >
              <BarChart3 className="w-4 h-4 mb-1" />
              <span>Reports</span>
            </button>
            
            <button
              onClick={() => {
                window.location.href = "/register";
              }}
              className="sidebar-button register"
            >
              <UserPlus className="w-4 h-4 mb-1" />
              <span>Register</span>
            </button>
            
            <button
              onClick={() => {
                handleLogout();
                setSidebarOpen(false);
              }}
              className="sidebar-button logout"
            >
              <LogOut className="w-4 h-4 mb-1" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
          {/* Top Bar */}
          <div className="top-bar">
            <button
              onClick={toggleSidebar}
              className="menu-button"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="top-bar-info">
              <p className="welcome-text">Owner Dashboard</p>
            </div>
          </div>

          {/* Content Container */}
          <div className="content-container">
            {/* Main Content */}
            <div className="content-section">
              {activeSection === 'branches' && (
                <BranchesSection 
                  ownerId={ownerId} 
                  onViewStaff={handleViewStaff} 
                />
              )}
              
              {activeSection === 'staff' && (
                <StaffSection 
                  ownerId={ownerId}
                  selectedBranch={selectedBranch}
                  onSelectBranch={handleSelectBranch}
                  onViewReports={handleViewReports}
                  onViewOwnerData={handleViewOwnerData}
                />
              )}
              
              {activeSection === 'reports' && (
                <ReportsSection 
                  selectedUser={selectedUser}
                  onBackToStaff={handleBackToStaff}
                  viewMode={viewMode}
                />
              )}
              
              {activeSection === 'ownerData' && selectedOwnerId && selectedDataType && (
                <OwnerDataSection 
                  ownerId={selectedOwnerId}
                  dataType={selectedDataType}
                  onBackToStaff={handleBackToStaffFromOwnerData}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          background: #f8fafc;
        }

        /* Sidebar Styles */
        .sidebar {
          position: fixed;
          top: 0;
          left: -80px;
          width: 80px;
          height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          transition: left 0.3s ease;
          z-index: 1000;
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
        }

        .sidebar.open {
          left: 0;
        }

        .sidebar-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 15px 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .user-info {
          text-align: center;
          margin-bottom: 10px;
        }

        .user-name {
          font-size: 10px;
          font-weight: 600;
          margin: 0 0 2px 0;
          line-height: 1.2;
        }

        .user-id {
          font-size: 8px;
          opacity: 0.8;
          margin: 0;
          line-height: 1.2;
        }

        .close-sidebar-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          font-size: 10px;
        }

        .close-sidebar-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .sidebar-content {
          padding: 10px 5px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sidebar-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 8px 4px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          font-size: 8px;
          min-height: 50px;
        }

        .sidebar-button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .sidebar-button.active {
          background: rgba(255, 255, 255, 0.25);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .sidebar-button.register {
          background: rgba(34, 197, 94, 0.8);
        }

        .sidebar-button.register:hover {
          background: rgba(34, 197, 94, 1);
        }

        .sidebar-button.logout {
          margin-top: auto;
          background: rgba(239, 68, 68, 0.8);
        }

        .sidebar-button.logout:hover {
          background: rgba(239, 68, 68, 1);
        }

        /* Main Content */
        .main-content {
          flex: 1;
          margin-left: 0;
          transition: margin-left 0.3s ease;
          min-height: 100vh;
          padding: 20px;
        }

        .main-content.sidebar-open {
          margin-left: 80px;
        }

        /* Top Bar */
        .top-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding: 16px 24px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .menu-button {
          background: linear-gradient(45deg, rgb(16, 137, 211) 0%, rgb(18, 177, 209) 100%);
          color: white;
          border: none;
          padding: 12px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .menu-button:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(16, 137, 211, 0.3);
        }

        .top-bar-info {
          flex: 1;
        }

        .welcome-text {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .user-id-text {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .content-container {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }



        .content-section {
          background: transparent;
          padding: 0;
          box-shadow: none;
          border: none;
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

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 0.5rem;
          }

          .main-content {
            padding: 10px;
          }

          .top-bar {
            padding: 12px 16px;
            margin-bottom: 16px;
          }

          .welcome-text {
            font-size: 14px;
          }

          .user-id-text {
            font-size: 12px;
          }

          .content-container {
            padding: 1.5rem;
          }

          .sidebar {
            width: 70px;
            left: -70px;
          }

          .sidebar.open {
            left: 0;
          }

          .main-content.sidebar-open {
            margin-left: 70px;
          }
        }
      `}</style>
    </div>
  );
} 