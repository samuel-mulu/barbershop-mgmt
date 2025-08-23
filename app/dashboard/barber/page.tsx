"use client";
import useSWR from "swr";
import { useState, useEffect, useMemo, useCallback } from "react";
import { getUserFromLocalStorage } from "@/utils/auth";
import EthiopianDate from "@/components/EthiopianDate";
import PaymentConfirmationCard from "@/components/PaymentConfirmationCard";
import Pagination from "@/components/Pagination";
import { 
  Scissors, 
  Clock, 
  DollarSign, 
  AlertCircle,
  RefreshCw,
  LogOut,
  Menu,
  X
} from "lucide-react";

const fetcher = (url: string) => {
  const token = localStorage.getItem("token");
  return fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  }).then(res => res.json());
};

interface ServiceOperation {
  _id: string;
  name: string;
  price: number;
  status: string;
  createdAt: string;
  workerName: string;
  workerRole: string;
  workerId: string;
  originalPrice?: number;
}

export default function BarberDashboard() {
  const [user, setUser] = useState<{ name: string; branchId?: string; _id?: string } | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [branchName, setBranchName] = useState<string>("");

  // Get user data and branchId on component mount
  useEffect(() => {
    const userData = getUserFromLocalStorage();
    if (userData) {
      setUser(userData);
      setBranchId(userData.branchId);
    }
  }, []);

  // Fetch branch information
  const { data: branchData } = useSWR(
    branchId ? `/api/branches/${branchId}` : null,
    fetcher
  );

  // Update branch name when branch data is fetched
  useEffect(() => {
    if (branchData && branchData.name) {
      setBranchName(branchData.name);
    }
  }, [branchData]);

  // Fetch service operations for this worker
  const { data: serviceOperations = [], isLoading, error } = useSWR(
    user?._id ? `/api/users/service-operations?userId=${user._id}` : null,
    fetcher
  );

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  
  // Payment confirmation display state
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState<boolean>(false);

  // Ensure serviceOperations is always an array and filter to only pending operations (both pending and pending_to_confirm)
  const safeServiceOperations = Array.isArray(serviceOperations) ? serviceOperations.filter(op => 
    op.status === "pending" || op.status === "pending_to_confirm"
  ) : [];

  // Sort operations by newest first
  const sortedOperations = useMemo(() => {
    return [...safeServiceOperations].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [safeServiceOperations]);

  // Get paginated data
  const getPaginatedOperations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedOperations.slice(startIndex, endIndex);
  }, [sortedOperations, currentPage, itemsPerPage]);

  // Calculate pagination info
  const getPaginationInfo = useMemo(() => {
    const totalItems = sortedOperations.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return {
      totalItems,
      totalPages,
      startItem,
      endItem,
      currentPage
    };
  }, [sortedOperations, currentPage, itemsPerPage]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1); // Reset to first page when changing limit
  }, []);

  // Calculate totals - only count operations that are NOT finished
  const pendingCount = safeServiceOperations.length;
  const totalEarnings = safeServiceOperations.reduce((total, op) => total + op.price, 0);

  // Show loading if user data is not loaded yet
  if (!user || !branchId) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading barber dashboard...</p>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("branchId");
    window.location.href = "/login";
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const togglePaymentConfirmation = () => {
    setShowPaymentConfirmation(!showPaymentConfirmation);
  };

  return (
    <div className="dashboard-container">
      <div className="flex">
        {/* Sidebar */}
        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <div className="user-info">
              <p className="user-name">Welcome back, {user.name}</p>
              <p className="branch-name">Branch: {branchName || branchId}</p>
            </div>
            <button
              onClick={toggleSidebar}
              className="close-sidebar-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="sidebar-content">
            {/* Payment Confirmation Button in Sidebar */}
            {user._id && (
              <button
                onClick={() => {
                  togglePaymentConfirmation();
                  setSidebarOpen(false);
                }}
                className="sidebar-button payment-confirmation"
              >
                <DollarSign className="w-4 h-4 mb-1" />
                <span>Payment Confirmations</span>
              </button>
            )}
            
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
              <p className="welcome-text">Welcome back, {user.name}</p>
              <p className="branch-text">Branch: {branchName || branchId}</p>
            </div>
          </div>

                  {/* Content Container */}
          <div className="content-container">
            {/* Payment Confirmation Card - Display when button is clicked */}
            {showPaymentConfirmation && user._id && (
              <div className="payment-confirmation-section">
                <PaymentConfirmationCard userId={user._id} userRole="barber" />
              </div>
            )}
            
            {/* Summary Cards */}
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-icon pending">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="summary-title">ዘይተኸፈለ ስራሕ</h3>
                  <p className="summary-value pending">{pendingCount}</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon earnings">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="summary-title">ዘይተኸፈለ ብር</h3>
                  <p className="summary-value earnings">{totalEarnings} ብር</p>
                </div>
              </div>
            </div>

        {/* Services Section */}
      <div className="content-section">
        <div className="section-header">
          <h2 className="section-title">My Assigned Services</h2>
          <div className="section-actions">
            <button 
              onClick={() => window.location.reload()} 
              className="action-button"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
          
          {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading services...</p>
            </div>
          ) : error ? (
          <div className="error-state">
            <AlertCircle className="w-8 h-8" />
            <p>Error loading services: {error instanceof Error ? error.message : "Unknown error"}</p>
              <button 
                onClick={() => window.location.reload()} 
              className="retry-button"
              >
              <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          ) : safeServiceOperations.length === 0 ? (
          <div className="empty-state">
            <Scissors className="w-12 h-12" />
            <p>No services assigned to you yet.</p>
            <p className="text-sm text-slate-500">Check back later for new assignments.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
                <thead>
                    <tr>
                      <th>#</th>
                      <th>Service</th>
                      <th>Your Share</th>
                      <th>Status</th>
                      <th>Date Created</th>
                  </tr>
                </thead>
                <tbody>
                {getPaginatedOperations.map((operation: ServiceOperation, index: number) => {
                    // Get current share
                    const barberShare = operation.price; // This is already 50% of original
                    const paginationInfo = getPaginationInfo;
                    const rowNumber = paginationInfo.startItem + index;
                    
                    return (
                    <tr key={operation._id}>
                      <td className="text-center font-medium text-slate-600">
                        #{rowNumber}
                      </td>
                      <td className="font-medium">
                          {operation.name}
                        </td>
                                            <td>
                        <span className="price-tag earnings">
                          {barberShare} ብር
                          </span>
                        </td>
                      
                                            <td>
                        <span className="status-badge pending">
                          <Clock className="w-3 h-3" />
                          {operation.status === "pending" ? "ዘይተኸፈለ" : operation.status}
                          </span>
                        </td>
                      <td className="text-xs text-slate-500">
                          <EthiopianDate dateString={operation.createdAt} showTime={true} showWeekday={false} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {/* Pagination Component */}
              {sortedOperations.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={getPaginationInfo.totalPages}
                  totalItems={getPaginationInfo.totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  showItemsPerPage={true}
                />
              )}
            </div>
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

        .branch-name {
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

        .sidebar-payment-card {
          margin-bottom: 10px;
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

        .sidebar-button.logout {
          margin-top: auto;
          background: rgba(239, 68, 68, 0.8);
        }

        .sidebar-button.logout:hover {
          background: rgba(239, 68, 68, 1);
        }

        .sidebar-button.payment-confirmation {
          background: rgba(245, 158, 11, 0.8);
        }

        .sidebar-button.payment-confirmation:hover {
          background: rgba(245, 158, 11, 1);
        }

        .payment-confirmation-section {
          margin-bottom: 24px;
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
          background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
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
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
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

        .branch-text {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .content-container {
          padding: 0;
        }

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

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .summary-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .summary-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
        }

        .summary-icon {
          padding: 0.75rem;
          border-radius: 12px;
          color: white;
        }

        .summary-icon.pending {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        .summary-icon.earnings {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .summary-title {
          font-size: 0.875rem;
          font-weight: 500;
          color: #64748b;
          margin: 0;
        }

        .summary-value {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .summary-value.pending {
          color: #f59e0b;
        }

        .summary-value.earnings {
          color: #10b981;
        }

        .content-section {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .section-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
        }

        .loading-state, .error-state, .empty-state {
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

        .error-state {
          color: #ef4444;
        }

        .retry-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #ef4444;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          margin-top: 1rem;
          transition: all 0.2s ease;
        }

        .retry-button:hover {
          background: #dc2626;
          transform: translateY(-1px);
        }

        .empty-state {
          color: #64748b;
        }

        .empty-state svg {
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .table-container {
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .data-table th {
          background: linear-gradient(135deg, #f8fafc, #e2e8f0);
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #475569;
          border-bottom: 1px solid #e2e8f0;
        }

        .data-table td {
          padding: 1rem;
          border-bottom: 1px solid #f1f5f9;
          color: #475569;
        }

        .data-table tr:hover {
          background: #f8fafc;
        }

        .price-tag {
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
        }

        .price-tag.earnings {
          background: #dcfce7;
          color: #166534;
        }

        .price-tag.original {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-badge.pending {
          background: #fef3c7;
          color: #92400e;
        }

        @media (max-width: 768px) {
          .container {
            padding: 0.5rem;
          }

          .header-section {
            padding: 1.5rem;
          }

          .header-content {
            flex-direction: column;
            text-align: center;
          }

          .summary-grid {
            grid-template-columns: 1fr;
          }

          .content-section {
            padding: 1.5rem;
          }

          .section-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .data-table {
            font-size: 0.75rem;
          }

          .data-table th,
          .data-table td {
            padding: 0.75rem 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}
  