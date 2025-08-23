"use client";
import { useState, useEffect } from "react";
import { DollarSign, CheckCircle, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import EthiopianDate from "./EthiopianDate";

interface PaymentConfirmationOperation {
  _id?: string;
  name: string;
  price: number;
  status: string;
  createdAt: string;
  paymentConfirmedDate?: string;
  workerConfirmedDate?: string;
  workerName?: string;
  workerRole?: string;
  workerId?: string;
  by?: 'cash' | 'mobile banking(telebirr)';
  paymentImageUrl?: string;
}

interface PaymentConfirmationCardProps {
  userId: string;
  userRole: string;
}

export default function PaymentConfirmationCard({ userId, userRole }: PaymentConfirmationCardProps) {
  const [pendingConfirmations, setPendingConfirmations] = useState<PaymentConfirmationOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updatingIndex, setUpdatingIndex] = useState<number | null>(null);

  // Polling for real-time updates
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchPendingConfirmations = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔄 Fetching pending confirmations for user:', userId);
      console.log('🔄 User role:', userRole);
      
      const response = await fetch(`/api/users/${userId}/payment-confirmations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Pending confirmations data:', data);
        console.log('📋 Operations count:', data.operations?.length || 0);
        if (data.operations && data.operations.length > 0) {
          console.log('📋 First operation details:', {
            name: data.operations[0].name,
            price: data.operations[0].price,
            status: data.operations[0].status,
            createdAt: data.operations[0].createdAt
          });
        }
        setPendingConfirmations(data.operations || []);
      } else {
        console.error('❌ Failed to fetch pending confirmations:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error details:', errorData);
      }
    } catch (error) {
      console.error('❌ Error fetching pending confirmations:', error);
    }
  };

  useEffect(() => {
    fetchPendingConfirmations();
    
    // Start polling every 2 seconds
    const interval = setInterval(() => {
      fetchPendingConfirmations();
    }, 2000);
    
    setPollingInterval(interval);
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [userId]);

  const handleConfirmPayment = async (operationIndex: number) => {
    setUpdatingIndex(operationIndex);
    try {
      const token = localStorage.getItem('token');
      console.log('🔧 Worker confirming payment for operation index:', operationIndex);
      console.log('🔧 Token available:', !!token);
      console.log('🔧 User ID:', userId);
      console.log('🔧 User Role:', userRole);
      
      // Get the actual operation
      const operation = pendingConfirmations[operationIndex];
      if (!operation) {
        alert('Operation not found');
        return;
      }
      
      console.log('🔧 Operation data being sent:', operation);
      console.log('🔧 Pending confirmations array:', pendingConfirmations);
      
      // Use the same pattern as Owner Flow - single operation update
      const updateData = {
        operationIndices: [0], // Dummy index, will be ignored since we have operationsData
        status: 'finished', // Worker changes to finished
        workerConfirmedDate: new Date().toISOString(),
        operationsData: [operation] // Pass operation data for matching
      };
      
      console.log('📤 Sending request to API:', {
        url: `/api/users/${userId}/operations/bulk-update`,
        method: 'PATCH',
        body: updateData
      });
      
      // Use the same API endpoint as Owner Flow
      const response = await fetch(`/api/users/${userId}/operations/bulk-update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Payment confirmation result:', result);
        // Refresh the list
        await fetchPendingConfirmations();
        // Show success message
        alert('Payment confirmed successfully!');
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to confirm payment:', errorData);
        alert(`Failed to confirm payment: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error confirming payment:', error);
    } finally {
      setUpdatingIndex(null);
    }
  };

  const handleConfirmAllPayments = async () => {
    if (pendingConfirmations.length === 0) return;
    
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      
      // Use the same pattern as Owner Flow - bulk update
      const updateData = {
        operationIndices: [0, 1], // Dummy indices, will be ignored since we have operationsData
        status: 'finished', // Worker changes to finished
        workerConfirmedDate: new Date().toISOString(),
        operationsData: pendingConfirmations // Pass operation data for matching
      };
      
      // Use the same API endpoint as Owner Flow
      const response = await fetch(`/api/users/${userId}/operations/bulk-update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Bulk payment confirmation result:', result);
        await fetchPendingConfirmations();
        // Show success message
        alert(`${result.updatedCount || pendingConfirmations.length} operations confirmed successfully!`);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to confirm all payments:', errorData);
        alert(`Failed to confirm all payments: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error confirming all payments:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Always show the card, but display different content based on data availability
  const hasData = pendingConfirmations.length > 0;

  const totalAmount = pendingConfirmations.reduce((sum, op) => sum + op.price, 0);

  return (
    <div className="payment-confirmation-card">
      <div className="card-header">
        <div className="header-content">
          <div className="header-icon">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="header-text">
            <h3 className="card-title">Payment Confirmations</h3>
            <p className="card-subtitle">
              {hasData 
                ? `${pendingConfirmations.length} operation${pendingConfirmations.length !== 1 ? 's' : ''} waiting for payment confirmation`
                : 'No pending payment confirmations'
              }
            </p>
          </div>
        </div>
        {hasData && (
          <div className="header-actions">
            <button
              onClick={handleConfirmAllPayments}
              disabled={updating}
              className="confirm-all-button"
            >
              {updating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Confirm All
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="card-content">
        {hasData ? (
          <>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">Total Amount:</span>
                <span className="stat-value">{totalAmount}ብር</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Operations:</span>
                <span className="stat-value">{pendingConfirmations.length}</span>
              </div>
            </div>

            <div className="operations-list">
              {pendingConfirmations.map((operation, index) => (
            <div key={index} className="operation-item">
              <div className="operation-info">
                <div className="operation-details">
                  <h4 className="operation-name">{operation.name}</h4>
                  <div className="operation-meta">
                    <span className="operation-price">{operation.price}ብር</span>
                    <span className="operation-date">
                      <Clock className="w-3 h-3 mr-1" />
                      <EthiopianDate dateString={operation.paymentConfirmedDate || operation.createdAt} showTime={true} showWeekday={false} />
                    </span>
                  </div>
                </div>
              </div>
              <div className="operation-actions">
                <button
                  onClick={() => handleConfirmPayment(index)}
                  disabled={updatingIndex === index || updating}
                  className="confirm-button"
                >
                  {updatingIndex === index ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Confirm
                </button>
              </div>
            </div>
          ))}
            </div>
          </>
        ) : (
          <div className="no-data-message">
            <div className="no-data-icon">
              <AlertTriangle className="w-12 h-12" />
            </div>
            <h4 className="no-data-title">No Payment Confirmations</h4>
            <p className="no-data-text">You have not been assigned any payment confirmations at this time.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .payment-confirmation-card {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 2px solid #f59e0b;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 8px 25px rgba(245, 158, 11, 0.2);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          padding: 0.75rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        .header-text {
          display: flex;
          flex-direction: column;
        }

        .card-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #92400e;
          margin: 0 0 0.25rem 0;
        }

        .card-subtitle {
          font-size: 0.875rem;
          color: #a16207;
          margin: 0;
        }

        .confirm-all-button {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .confirm-all-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
        }

        .confirm-all-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .card-content {
          space-y: 1rem;
        }

        .summary-stats {
          display: flex;
          gap: 2rem;
          margin-bottom: 1rem;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #a16207;
          font-weight: 500;
        }

        .stat-value {
          font-size: 1.125rem;
          font-weight: 700;
          color: #92400e;
        }

        .operations-list {
          space-y: 0.75rem;
        }

        .operation-item {
          background: white;
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .operation-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .operation-details {
          display: flex;
          flex-direction: column;
        }

        .operation-name {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.25rem 0;
        }

        .operation-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.875rem;
          color: #64748b;
        }

        .operation-price {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.75rem;
        }

        .operation-date {
          display: flex;
          align-items: center;
        }

        .confirm-button {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }

        .confirm-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .confirm-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        .no-data-message {
          text-align: center;
          padding: 2rem 1rem;
        }

        .no-data-icon {
          color: #f59e0b;
          margin-bottom: 1rem;
        }

        .no-data-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #92400e;
          margin: 0 0 0.5rem 0;
        }

        .no-data-text {
          font-size: 0.875rem;
          color: #a16207;
          margin: 0;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .card-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .header-content {
            justify-content: center;
          }

          .summary-stats {
            flex-direction: column;
            gap: 1rem;
          }

          .operation-item {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .operation-meta {
            flex-direction: column;
            gap: 0.5rem;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
