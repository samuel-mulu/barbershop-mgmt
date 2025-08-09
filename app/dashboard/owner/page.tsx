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
  LogOut
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
    <div className="container">


      {/* Navigation Tabs */}
      <div className="navigation-section">
        <div className="nav-tabs">
          <button
            onClick={() => setActiveSection('branches')}
            className={`nav-tab ${activeSection === 'branches' ? 'active' : ''}`}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Branches
          </button>
          <button
            onClick={() => setActiveSection('staff')}
            className={`nav-tab ${activeSection === 'staff' ? 'active' : ''}`}
          >
            <Users className="w-4 h-4 mr-2" />
            Staff
          </button>
          <button 
            onClick={() => setActiveSection('reports')}
            className={`nav-tab ${activeSection === 'reports' ? 'active' : ''}`}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Reports
          </button>
        </div>
        
        {/* Logout Button */}
        <div className="logout-section">
          <button
            onClick={handleLogout}
            className="logout-button"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>



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

      <style jsx>{`
        .container {
          min-height: 100vh;
          background: #f8fafc;
          padding: 1rem;
        }



        .navigation-section {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .nav-tabs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .nav-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem 1rem;
          border-radius: 16px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid transparent;
          background: rgba(255, 255, 255, 0.8);
          color: #64748b;
          min-height: 100px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .nav-tab:hover {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
        }

        .nav-tab.active {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .nav-tab:hover {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
        }

        .nav-tab.active {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .logout-section {
          display: flex;
          justify-content: flex-end;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
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
          .container {
            padding: 0.5rem;
          }



          .nav-tabs {
            grid-template-columns: repeat(3, 1fr);
            gap: 0.5rem;
          }

          .nav-tab {
            min-height: 70px;
            padding: 0.75rem 0.5rem;
            font-size: 0.75rem;
          }

          .section-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .breadcrumb {
            flex-wrap: wrap;
            justify-content: center;
          }

          .content-section {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
} 