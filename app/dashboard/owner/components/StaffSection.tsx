"use client";
import React, { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import {
  User,
  Scissors,
  Droplets,
  Building2,
  ArrowLeft,
  BarChart3,
  Phone,
  Eye,
  ChevronDown,
  ChevronRight,
  Package,
  ShoppingCart,
  DollarSign,
  ChevronDown as ChevronDownIcon,
  Users,
  TrendingUp
} from "lucide-react";

const fetcher = (url: string) => {
  const token = localStorage.getItem("token");
  return fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  }).then((res) => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  });
};

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
    finishedDate?: string;
    originalPrice?: number;
    by?: 'cash' | 'mobile banking(telebirr)';
    paymentImageUrl?: string;
  }>;
  adminServiceOperations?: Array<{
    name: string;
    price: number;
    status: string;
    createdAt: string;
    finishedDate?: string;
    workerName: string;
    workerRole: string;
    workerId: string;
    by?: 'cash' | 'mobile banking(telebirr)';
    paymentImageUrl?: string;
  }>;
}

interface StaffSectionProps {
  ownerId: string;
  selectedBranch: Branch | null;
  onSelectBranch: (branch: Branch | null) => void;
  onViewReports: (user: User, mode: 'pending' | 'finished') => void;
  onViewOwnerData: (ownerId: string, dataType: 'products' | 'productSales' | 'withdrawals') => void;
}

export default function StaffSection({ 
  ownerId, 
  selectedBranch, 
  onSelectBranch, 
  onViewReports,
  onViewOwnerData
}: StaffSectionProps) {
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>({
    admin: false,
    barber: false,
    washer: false
  });
  const [dropdownStates, setDropdownStates] = useState<Record<string, boolean>>({});
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Fetch all branches for this owner
  const { data: branches = [], isLoading: loadingBranches, error: branchesError } = useSWR(
    ownerId ? `/api/branches?ownerId=${ownerId}` : null,
    fetcher
  );

  // Fetch all users across all branches
  const { data: allUsers = [], isLoading: loadingUsers, error: usersError } = useSWR(
    ownerId ? `/api/users?ownerId=${ownerId}` : null,
    fetcher
  );

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      let shouldClose = true;
      
      // Check if click is inside any dropdown
      Object.keys(dropdownStates).forEach(userId => {
        if (dropdownStates[userId] && dropdownRefs.current[userId]) {
          if (dropdownRefs.current[userId]?.contains(target)) {
            shouldClose = false;
          }
        }
      });
      
      // Only close if click is outside all dropdowns
      if (shouldClose) {
        setDropdownStates(prev => {
          const newState = { ...prev };
          Object.keys(newState).forEach(userId => {
            newState[userId] = false;
          });
          return newState;
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownStates]);

  // Group users by branch with error handling
  interface UsersByBranch {
    [branchId: string]: User[];
  }
  
  const usersByBranch: UsersByBranch = Array.isArray(allUsers) ? allUsers.reduce((acc: UsersByBranch, user: User) => {
    if (!acc[user.branchId]) {
      acc[user.branchId] = [];
    }
    acc[user.branchId].push(user);
    return acc;
  }, {}) : {};

  // Get users by role for a specific branch
  const getUsersByRole = (branchId: string, role: string) => {
    const branchUsers = usersByBranch[branchId] || [];
    return branchUsers.filter((user: User) => user.role === role);
  };

  // Navigate to reports section
  const navigateToReports = (user: User, mode: 'pending' | 'finished') => {
    onViewReports(user, mode);
  };

  // Show error states
  if (branchesError || usersError) {
    return (
      <div className="error-state">
        <div className="error-content">
          <h3>Error Loading Data</h3>
          <p>
            {branchesError ? "Failed to load branches" : "Failed to load users"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loadingBranches || loadingUsers) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading staff data...</p>
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <User className="w-4 h-4" />;
      case 'barber': return <Scissors className="w-4 h-4" />;
      case 'washer': return <Droplets className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'admin';
      case 'barber': return 'barber';
      case 'washer': return 'washer';
      default: return 'default';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'ካሸር';
      case 'barber': return 'ቀምቀምቲ';
      case 'washer': return 'ሓጸብቲ';
      default: return role;
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'pending': return 'pending(ዘይተወደኡ)';
      case 'finished': return 'finished(ዝተወዱኡ)';
      default: return status;
    }
  };

  const toggleRoleExpansion = (role: string) => {
    setExpandedRoles(prev => ({
      ...prev,
      [role]: !prev[role]
    }));
  };

  const toggleDropdown = (userId: string) => {
    console.log('Toggle dropdown for user:', userId);
    setDropdownStates(prev => {
      const newState = {
        ...prev,
        [userId]: !prev[userId]
      };
      console.log('New dropdown state:', newState);
      return newState;
    });
  };

  const handleDataSelection = (userId: string, dataType: 'products' | 'productSales' | 'withdrawals') => {
    console.log('Data selection:', userId, dataType);
    onViewOwnerData(userId, dataType);
    setDropdownStates(prev => ({
      ...prev,
      [userId]: false
    }));
  };
              
              return (
    <div className="staff-container">
            {/* Branch Info */}
      <div className="section-header">
        {selectedBranch && (
          <div className="branch-info">
            <div className="branch-badge">
              <Building2 className="w-4 h-4 mr-2" />
              {selectedBranch.name}
                  </div>
                            <button
              onClick={() => onSelectBranch(null)}
              className="back-button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              View All Branches
                            </button>
                          </div>
                        )}
                      </div>

      {/* Branch Selection */}
      {!selectedBranch && (
        <div className="branch-selection">
          <h3 className="selection-title">
            <Building2 className="w-5 h-5 mr-2" />
            Select a Branch
          </h3>
          <div className="branches-grid">
            {Array.isArray(branches) && branches.map((branch: Branch) => {
              const adminCount = getUsersByRole(branch._id, 'admin').length;
              const barberCount = getUsersByRole(branch._id, 'barber').length;
              const washerCount = getUsersByRole(branch._id, 'washer').length;
              const totalStaff = adminCount + barberCount + washerCount;

              return (
                <div 
                  key={branch._id} 
                  className="branch-card"
                  onClick={() => onSelectBranch(branch)}
                >
                  <div className="branch-header">
                    <Building2 className="w-6 h-6 text-slate-400" />
                    <h4 className="branch-name">{branch.name}</h4>
                    </div>
                  <div className="branch-stats">
                    <div className="stat-item">
                      <span className="stat-label">Total Staff</span>
                      <span className="stat-value">{totalStaff}</span>
                    </div>
                    <div className="staff-breakdown">
                                            <div className="staff-item admin">
                        <User className="w-3 h-3" />
                        <span>{adminCount} ካሸር</span>
                    </div>
                      <div className="staff-item barber">
                        <Scissors className="w-3 h-3" />
                        <span>{barberCount} ቀምቀምቲ</span>
                      </div>
                      <div className="staff-item washer">
                        <Droplets className="w-3 h-3" />
                        <span>{washerCount} ሓጸብቲ</span>
                    </div>
                  </div>
                  </div>
                  <div className="branch-action">
                    <span className="action-text">Click to view staff</span>
                  </div>
                </div>
              );
            })}
                </div>
              </div>
            )}

            {/* Staff List for Selected Branch */}
      {selectedBranch && (
        <div className="staff-list-container">
          <div className="staff-sections">
            {['admin', 'barber', 'washer'].map(role => {
              const users = getUsersByRole(selectedBranch._id, role);
              if (users.length === 0) return null;
                          
                          return (
                                <div key={role} className="role-section">
                  <div className="role-header" onClick={() => toggleRoleExpansion(role)}>
                    <div className="role-info">
                      {getRoleIcon(role)}
                      <h4 className="role-title capitalize">
                        {getRoleDisplayName(role)} ({users.length})
                      </h4>
                      {expandedRoles[role] ? (
                        <ChevronDown className="w-4 h-4 ml-2 cursor-pointer" />
                      ) : (
                        <ChevronRight className="w-4 h-4 ml-2 cursor-pointer" />
                      )}
                                  </div>
                    <span className={`role-badge ${getRoleColor(role)}`}>
                      {getRoleDisplayName(role)}
                                  </span>
                              </div>
                              
                  {expandedRoles[role] && (
                    <div className="users-list">
                    {users.map((user: User) => (
                      <div key={user._id} className="user-card">
                        <div className="user-header">
                          <div className="user-info">
                            <div className="user-avatar">
                              {getRoleIcon(role)}
                                                </div>
                            <div className="user-details">
                              <h5 className="user-name">{user.name}</h5>
                                                          <div className="user-meta">
                              <span className="user-phone">
                                <Phone className="w-3 h-3 mr-1" />
                                {user.phone}
                                                  </span>
                                                </div>
                                                    </div>
                                                    </div>
                          <div className="user-stats">
                            <div className="stat-item">
                              <BarChart3 className="w-4 h-4" />
                              <span>
                                {user.role === 'admin' 
                                  ? (user.adminServiceOperations?.length || 0)
                                  : (user.serviceOperations?.length || 0)
                                } Operations
                                                      </span>
                                                    </div>
                                                      </div>
                                                  </div>
                        
                        <div className="user-actions">
                          {user.role === 'admin' && (
                            <div 
                              className="dropdown-container"
                              ref={(el) => {
                                dropdownRefs.current[user._id] = el;
                              }}
                            >
                              <button
                                onClick={() => toggleDropdown(user._id)}
                                className="action-button dropdown"
                              >
                                <span>View Data</span>
                                <ChevronDownIcon className={`w-4 h-4 ml-2 transition-transform ${dropdownStates[user._id] ? 'rotate-180' : ''}`} />
                              </button>
                              {dropdownStates[user._id] && (
                                <>
                                  <div className="dropdown-backdrop" onClick={() => toggleDropdown(user._id)}></div>
                                  <div className="dropdown-menu">
                                    <button
                                      onClick={() => handleDataSelection(user._id, 'products')}
                                      className="dropdown-item"
                                    >
                                      <Package className="w-4 h-4 mr-2" />
                                      Products
                                    </button>
                                    <button
                                      onClick={() => handleDataSelection(user._id, 'productSales')}
                                      className="dropdown-item"
                                    >
                                      <ShoppingCart className="w-4 h-4 mr-2" />
                                      Product Sales
                                    </button>
                                    <button
                                      onClick={() => handleDataSelection(user._id, 'withdrawals')}
                                      className="dropdown-item"
                                    >
                                      <DollarSign className="w-4 h-4 mr-2" />
                                      Withdrawals
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                          <button
                            onClick={() => navigateToReports(user, 'pending')}
                            className="action-button primary"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {getStatusDisplayName('pending')} Reports
                          </button>
                          <button
                            onClick={() => navigateToReports(user, 'finished')}
                            className="action-button secondary"
                          >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            {getStatusDisplayName('finished')} Reports
                          </button>
                        </div>
                                </div>
                    ))}
                                                    </div>
                                                  )}
                                                </div>
                                        );
                                      })}
                                </div>
                            </div>
      )}

      <style jsx>{`
        .staff-container {
          space-y: 1.5rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }



        .branch-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .branch-badge {
          display: flex;
          align-items: center;
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .back-button {
          display: flex;
          align-items: center;
          background: transparent;
          color: #667eea;
          border: 1px solid rgba(102, 126, 234, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .back-button:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        .branch-selection {
          space-y: 1.5rem;
        }

        .selection-title {
          display: flex;
          align-items: center;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .branches-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .branch-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .branch-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
        }

        .branch-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .branch-name {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .branch-stats {
          space-y: 0.75rem;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #64748b;
        }

        .stat-value {
          font-weight: 600;
          color: #1e293b;
        }

        .staff-breakdown {
          display: flex;
          gap: 0.5rem;
        }

        .staff-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .staff-item.admin {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        .staff-item.barber {
          background: rgba(59, 130, 246, 0.1);
          color: #1d4ed8;
        }

        .staff-item.washer {
          background: rgba(16, 185, 129, 0.1);
          color: #047857;
        }

        .branch-action {
          margin-top: 1rem;
          text-align: center;
        }

        .action-text {
          font-size: 0.875rem;
          color: #667eea;
          font-weight: 500;
        }

        .staff-list-container {
          space-y: 2rem;
        }

        .staff-summary {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .summary-title {
          display: flex;
          align-items: center;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 1rem 0;
        }

        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .summary-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: white;
          padding: 1rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .summary-icon {
          padding: 0.75rem;
          border-radius: 8px;
          color: white;
        }

        .summary-icon.admin {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }

        .summary-icon.barber {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        }

        .summary-icon.washer {
          background: linear-gradient(135deg, #10b981, #047857);
        }

        .summary-content {
          display: flex;
          flex-direction: column;
        }

        .summary-label {
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 0.25rem;
        }

        .summary-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
        }

        .staff-sections {
          space-y: 2rem;
        }

        .role-section {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .role-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0.75rem;
          border-radius: 8px;
        }

        .role-header:hover {
          background: rgba(102, 126, 234, 0.05);
        }

        .role-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .role-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .role-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .role-badge.admin {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        .role-badge.barber {
          background: rgba(59, 130, 246, 0.1);
          color: #1d4ed8;
        }

        .role-badge.washer {
          background: rgba(16, 185, 129, 0.1);
          color: #047857;
        }

        .users-list {
          space-y: 1rem;
        }

        .user-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(0, 0, 0, 0.05);
          position: relative;
        }

        .user-card:has(.dropdown-menu) {
          z-index: 9998;
        }

        .user-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-avatar {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          padding: 0.75rem;
          border-radius: 8px;
        }

        .user-details {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.25rem 0;
        }

        .user-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.875rem;
          color: #64748b;
        }

        .user-phone {
          display: flex;
          align-items: center;
        }

        .user-role {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-weight: 500;
        }

        .user-stats {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
          font-size: 0.875rem;
        }

        .user-actions {
          display: flex;
          gap: 0.75rem;
        }

        .action-button {
          display: flex;
          align-items: center;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          text-decoration: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .action-button.primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .action-button.primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
        }

        .action-button.secondary {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          border: 1px solid rgba(102, 126, 234, 0.2);
        }

        .action-button.secondary:hover {
          background: rgba(102, 126, 234, 0.15);
        }

        .action-button.dropdown {
          background: linear-gradient(135deg, #10b981 0%, #047857 100%);
          color: white;
          position: relative;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .action-button.dropdown:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
        }

        .dropdown-container {
          position: relative;
          z-index: 1;
        }

        .dropdown-container:has(.dropdown-menu) {
          z-index: 9999;
        }

        .dropdown-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: transparent;
          z-index: 9998;
        }

        .user-actions {
          display: flex;
          gap: 0.75rem;
          position: relative;
        }

        .user-actions:has(.dropdown-menu) {
          z-index: 9999;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          border: 2px solid rgba(255, 255, 255, 0.2);
          z-index: 99999;
          overflow: hidden;
          margin-top: 0.5rem;
          animation: slideDown 0.2s ease-out;
          min-width: 200px;
          transform: translateZ(0);
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 1rem 1.25rem;
          border: none;
          background: transparent;
          color: #1e293b;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .dropdown-item:hover {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          color: #047857;
        }

        .dropdown-item:not(:last-child) {
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .error-state {
          text-align: center;
          padding: 2rem;
        }

        .error-content {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          padding: 2rem;
        }

        .error-content h3 {
          color: #dc2626;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .error-content p {
          color: #991b1b;
          margin: 0 0 1rem 0;
        }

        .retry-button {
          background: #dc2626;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .retry-button:hover {
          background: #b91c1c;
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
          .section-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .branch-info {
            flex-direction: column;
            gap: 0.75rem;
          }

          .branches-grid {
            grid-template-columns: 1fr;
          }

          .summary-stats {
            grid-template-columns: 1fr;
          }

          .user-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .user-actions {
            flex-direction: column;
          }

          .action-button {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
} 