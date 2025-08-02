"use client";
import useSWR from "swr";
import { useState, useEffect } from "react";
import { getUserFromLocalStorage } from "@/utils/auth";
import EthiopianDate from "@/components/EthiopianDate";
import { 
  Droplets, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  User,
  Calendar,
  TrendingUp
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
}

export default function WasherDashboard() {
  const [user, setUser] = useState<any>(null);
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

  // Fetch service operations for this washer
  const { data: serviceOperations = [], isLoading, error } = useSWR(
    user?._id ? `/api/users/service-operations?userId=${user._id}` : null,
    fetcher
  );

  // Ensure serviceOperations is always an array and filter to only pending operations
  const safeServiceOperations = Array.isArray(serviceOperations) ? serviceOperations.filter(op => op.status === "pending") : [];

  // Calculate totals
  const pendingCount = safeServiceOperations.length;
  const totalEarnings = safeServiceOperations.reduce((total, op) => total + op.price, 0);

  // Show loading if user data is not loaded yet
  if (!user || !branchId) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading washer dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header Section */}
      <div className="header-section">
        <div className="header-content">
          <div className="header-icon">
            <Droplets className="w-8 h-8" />
          </div>
          <div>
            <h1 className="heading">Washer Dashboard</h1>
            <p className="subtitle">Welcome back, {user.name}</p>
            <p className="text-xs text-slate-500">Branch: {branchName || branchId}</p>
          </div>
        </div>
        </div>

        {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-icon pending">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="summary-title">Pending Services</h3>
            <p className="summary-value pending">{pendingCount}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon earnings">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h3 className="summary-title">Your Earnings (10%)</h3>
            <p className="summary-value earnings">${totalEarnings}</p>
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
            <p>Error loading services: {error.message}</p>
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
            <Droplets className="w-12 h-12" />
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
                  <th>Original Price</th>
                  <th>Status</th>
                  <th>Date Created</th>
                  </tr>
                </thead>
                <tbody>
                {safeServiceOperations.map((operation: ServiceOperation, index: number) => {
                    // Get original price and current share
                    const originalPrice = (operation as any).originalPrice || operation.price * 10; // If no original price, estimate
                    const washerShare = operation.price; // This is already 10% of original
                    
                    return (
                    <tr key={operation._id}>
                      <td className="text-center font-medium text-slate-600">
                        #{index + 1}
                      </td>
                      <td className="font-medium">
                          {operation.name}
                        </td>
                      <td>
                        <span className="price-tag earnings">
                            ${washerShare}
                          </span>
                        </td>
                      <td>
                        <span className="price-tag original">
                            ${originalPrice}
                          </span>
                        </td>
                      <td>
                        <span className="status-badge pending">
                          <Clock className="w-3 h-3" />
                            {operation.status}
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
            </div>
          )}
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
