"use client";
import React, { useState } from "react";
import EthiopianDate from "@/components/EthiopianDate";
import { gregorianToEthiopian } from "@/utils/ethiopianCalendar";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  User,
  Scissors,
  Droplets,
  Eye,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Filter,
  Phone
} from "lucide-react";

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
  }>;
}

interface ServiceOperation {
  _id?: string;
  name: string;
  price: number;
  status: string;
  createdAt: string;
  finishedDate?: string;
  workerName?: string;
  workerRole?: string;
  workerId?: string;
  originalPrice?: number;
  operationIndex?: number;
}

interface ReportsSectionProps {
  selectedUser: User | null;
  onBackToStaff: () => void;
  viewMode: 'pending' | 'finished';
}

export default function ReportsSection({ selectedUser, onBackToStaff, viewMode }: ReportsSectionProps) {
  const [selectedOperations, setSelectedOperations] = useState<Set<string>>(new Set());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [expandedFinishedCards, setExpandedFinishedCards] = useState<Set<number>>(new Set());
  const [expandedOperations, setExpandedOperations] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [updateProgress, setUpdateProgress] = useState({ current: 0, total: 0, isUpdating: false });

  // Get operations based on user role
  const getOperations = (): ServiceOperation[] => {
    if (!selectedUser) return [];
    
    if (selectedUser.role === 'admin') {
      return selectedUser.adminServiceOperations || [];
    } else {
      return selectedUser.serviceOperations || [];
    }
  };

  // Group operations by Ethiopian date with numbering (only pending operations)
  const groupOperationsByDate = (operations: ServiceOperation[]) => {
    const grouped: { [key: string]: ServiceOperation[] } = {};
    
    // Filter only pending operations but preserve original indices
    operations.forEach((operation, originalIndex) => {
      if (operation.status === 'pending') {
        const date = new Date(operation.createdAt);
        const ethiopian = gregorianToEthiopian(date);
        const ethiopianDateKey = `${ethiopian.day} ${ethiopian.monthName} ${ethiopian.year}`;
        
        if (!grouped[ethiopianDateKey]) {
          grouped[ethiopianDateKey] = [];
        }
        grouped[ethiopianDateKey].push({ ...operation, operationIndex: originalIndex });
      }
    });
    
    return grouped;
  };

  // Handle individual operation status update
  const handleUpdateOperationStatus = async (operationIndex: number, newStatus: string, userId: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const updateData: any = { status: newStatus };
      
      // Add finishedDate when marking as finished
      if (newStatus === 'finished') {
        updateData.finishedDate = new Date().toISOString();
      }
      
      const response = await fetch(`/api/users/${userId}/operations/${operationIndex}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        alert("Status updated successfully!");
        // Don't reload, just update the local state
        setSelectedOperations(new Set());
        setExpandedOperations(new Set());
        // Trigger a re-render by updating a state
        setExpandedDates(new Set(expandedDates));
      } else {
        const errorData = await response.json();
        alert(`Failed to update status: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle bulk status update for selected operations
  const handleUpdateSelectedOperations = async (newStatus: string) => {
    if (!selectedUser || selectedOperations.size === 0) return;
    
    setIsLoading(true);
    setUpdateProgress({ current: 0, total: selectedOperations.size, isUpdating: true });
    
    // Store the count before clearing selections
    const selectedCount = selectedOperations.size;
    
    try {
      const token = localStorage.getItem("token");
      
      // Get all operations to find the correct indices
      const allOperations = getOperations();
      
      // Collect all operation indices to update
      const operationIndices: number[] = [];
      
      Array.from(selectedOperations).forEach(operationKey => {
        const [date, displayIndex] = operationKey.split('-');
        const displayIndexNum = parseInt(displayIndex);
        
        // Find the actual operation in the pending operations array
        const groupedOperations = groupOperationsByDate(allOperations);
        const dateOperations = groupedOperations[date] || [];
        const selectedOperation = dateOperations[displayIndexNum];
        
        if (selectedOperation && selectedOperation.operationIndex !== undefined) {
          operationIndices.push(selectedOperation.operationIndex);
        }
      });
      
      console.log('Updating operations:', operationIndices);
      
      // Single bulk update API call
      const updateData = {
        operationIndices,
        status: newStatus,
        finishedDate: newStatus === 'finished' ? new Date().toISOString() : undefined
      };
      
      const response = await fetch(`/api/users/${selectedUser._id}/operations/bulk-update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Bulk update result:', result);
      
      // Clear selections and refresh
      setSelectedOperations(new Set());
      setExpandedOperations(new Set());
      
      // Force a re-render by updating the expanded dates
      setExpandedDates(new Set(expandedDates));
      
      // Force a re-render by toggling a state to trigger data refresh
      if (onBackToStaff) {
        setTimeout(() => {
          onBackToStaff();
        }, 500);
      }
      
      // Show success message with correct count
      const operationText = selectedCount === 1 ? 'operation' : 'operations';
      alert(`${selectedCount} ${operationText} marked as finished successfully!`);
      
    } catch (error) {
      console.error("Error updating operations:", error);
      alert("Error updating operations. Please try again.");
    } finally {
      setIsLoading(false);
      setUpdateProgress({ current: 0, total: 0, isUpdating: false });
    }
  };



  // Handle operation selection
  const handleOperationSelect = (operationKey: string, checked: boolean) => {
    const newSelected = new Set(selectedOperations);
    if (checked) {
      newSelected.add(operationKey);
    } else {
      newSelected.delete(operationKey);
    }
    setSelectedOperations(newSelected);
  };

  // Handle select all for a date
  const handleSelectAllForDate = (date: string, operations: ServiceOperation[], checked: boolean) => {
    const newSelected = new Set(selectedOperations);
    operations.forEach((operation, index) => {
      const operationKey = `${date}-${index}`;
      if (checked) {
        newSelected.add(operationKey);
      } else {
        newSelected.delete(operationKey);
      }
    });
    setSelectedOperations(newSelected);
  };

  // Calculate time difference between creation and finish
  const calculateTimeDifference = (createdAt: string, finishedDate: string) => {
    const start = new Date(createdAt);
    const end = new Date(finishedDate);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} day(s)`;
    if (diffHours > 0) return `${diffHours} hour(s)`;
    return `${diffMins} minute(s)`;
  };

  // Get finished operations
  const getFinishedOperations = (): ServiceOperation[] => {
    if (!selectedUser) return [];
    
    const operations = getOperations();
    return operations.filter(op => op.status === 'finished');
  };

  // Group finished operations by Ethiopian date
  const groupFinishedOperationsByDate = (operations: ServiceOperation[]) => {
    const grouped: { [key: string]: ServiceOperation[] } = {};
    
    operations.forEach(operation => {
      const date = new Date(operation.finishedDate || operation.createdAt);
      const ethiopian = gregorianToEthiopian(date);
      const ethiopianDateKey = `${ethiopian.day} ${ethiopian.monthName} ${ethiopian.year}`;
      
      if (!grouped[ethiopianDateKey]) {
        grouped[ethiopianDateKey] = [];
      }
      grouped[ethiopianDateKey].push(operation);
    });
    
    return grouped;
  };

  // Toggle date expansion
  const toggleDateExpansion = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  // Toggle finished card expansion
  const toggleFinishedCardExpansion = (cardIndex: number) => {
    const newExpanded = new Set(expandedFinishedCards);
    if (newExpanded.has(cardIndex)) {
      newExpanded.delete(cardIndex);
    } else {
      newExpanded.add(cardIndex);
    }
    setExpandedFinishedCards(newExpanded);
  };

  // Toggle operation expansion
  const toggleOperationExpansion = (operationKey: string) => {
    const newExpanded = new Set(expandedOperations);
    if (newExpanded.has(operationKey)) {
      newExpanded.delete(operationKey);
    } else {
      newExpanded.add(operationKey);
    }
    setExpandedOperations(newExpanded);
  };

  if (!selectedUser) {
    return (
      <div className="empty-state">
        <div className="empty-content">
          <User className="w-16 h-16 mb-4 text-slate-400" />
          <h3>No User Selected</h3>
          <p>Please select a user to view their reports.</p>
          <button
            onClick={onBackToStaff}
            className="action-button primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Staff
          </button>
        </div>
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

  return (
    <div className="reports-container">
      {/* Back Button */}
      <div className="back-button-container">
        <button
          onClick={onBackToStaff}
          className="action-button secondary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Staff
        </button>
      </div>

      {/* User Info Card */}
      <div className="user-info-card">
        <div className="user-header">
          <div className="user-avatar">
            {getRoleIcon(selectedUser.role)}
          </div>
          <div className="user-details">
            <h3 className="user-name">{selectedUser.name}</h3>
            <div className="user-meta">
              <span className={`role-badge ${getRoleColor(selectedUser.role)}`}>
                {getRoleDisplayName(selectedUser.role)}
              </span>
              <span className="user-phone">
                <Phone className="w-3 h-3 mr-1" />
                {selectedUser.phone}
              </span>
            </div>
          </div>
        </div>
        <div className="user-stats">
          {viewMode === 'pending' ? (
            <div className="stat-item">
              <Clock className="w-4 h-4" />
              <span>{getStatusDisplayName('pending')} ዝተሰረሐ: {getOperations().filter(op => op.status === 'pending').length || 0}</span>
            </div>
          ) : (
            <div className="stat-item">
              <CheckCircle className="w-4 h-4" />
              <span>{getStatusDisplayName('finished')} ዝተሰረሐ: {getOperations().filter(op => op.status === 'finished').length || 0}</span>
            </div>
          )}
        </div>
      </div>

      {/* Reports Content */}
      <div className="reports-content">
        {viewMode === 'pending' ? (
          // Pending Operations View
          <div className="pending-operations">
            {selectedOperations.size > 0 && (
              <div className="bulk-actions">
                <div className="bulk-info">
                  <span className="selected-count">
                    {selectedOperations.size} operation{selectedOperations.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <button
                  onClick={() => handleUpdateSelectedOperations('finished')}
                  disabled={isLoading}
                  className="action-button success large"
                >
                  {isLoading ? (
                    <>
                      <div className="loading-spinner"></div>
                      <span>Updating {updateProgress.current}/{updateProgress.total}...</span>
                    </>
                  ) : (
                    <>
                                          <CheckCircle className="w-5 h-5 mr-2" />
                    Mark Selected as {getStatusDisplayName('finished')}
                    </>
                  )}
                </button>
              </div>
            )}

            {(() => {
              const operations = getOperations();
              const groupedOperations = groupOperationsByDate(operations);
              const dates = Object.keys(groupedOperations);

              if (dates.length === 0) {
                return (
                  <div className="empty-operations">
                    <CheckCircle className="w-16 h-16 mb-4 text-green-400" />
                    <h3>No {getStatusDisplayName('pending')} ዝተሰረሐ</h3>
                    <p>All ዝተሰረሐ have been completed!</p>
                  </div>
                );
              }

              return (
                <div className="operations-list">
                  {dates.map(date => {
                    const dateOperations = groupedOperations[date];
                    const isDateExpanded = expandedDates.has(date);
                    const dateSelectedCount = dateOperations.filter((_, index) => 
                      selectedOperations.has(`${date}-${index}`)
                    ).length;
                    const isAllSelected = dateSelectedCount === dateOperations.length;
                    const totalPrice = dateOperations.reduce((sum, operation) => sum + operation.price, 0);

                    return (
                      <div key={date} className="date-group">
                        <div className="date-header">
                          <div className="date-info">
                            <button
                              onClick={() => toggleDateExpansion(date)}
                              className="expand-button"
                            >
                              {isDateExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            <div className="date-details">
                              <h4 className="date-title">{date}</h4>
                              <div className="date-stats">
                                <span className="date-count">{dateOperations.length} operations</span>
                                <span className="date-total-price">Total: {totalPrice}ብር</span>
                              </div>
                            </div>
                          </div>
                                                      <div className="date-actions">
                              <label className="select-all">
                                <input
                                  type="checkbox"
                                  checked={isAllSelected}
                                  onChange={(e) => handleSelectAllForDate(date, dateOperations, e.target.checked)}
                                  className="checkbox"
                                />
                                <span className="checkmark"></span>
                                Select All
                              </label>
                            </div>
                        </div>

                        {isDateExpanded && (
                          <div className="operations-grid">
                            {dateOperations.map((operation, index) => {
                              const operationKey = `${date}-${index}`;
                              const isSelected = selectedOperations.has(operationKey);
                              const isExpanded = expandedOperations.has(operationKey);

                              return (
                                <div key={operationKey} className="operation-card">
                                  <div className="operation-header">
                                    <div className="operation-info">
                                      <label className="operation-select">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => handleOperationSelect(operationKey, e.target.checked)}
                                          className="checkbox"
                                        />
                                        <span className="checkmark"></span>
                                      </label>
                                      <div className="operation-details">
                                        <h5 className="operation-name">{operation.name}</h5>
                                        <div className="operation-meta">
                                          <span className="operation-price">
                                            {operation.price}ብር
                                          </span>
                                          <span className="operation-date">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            <EthiopianDate dateString={operation.createdAt} showTime={true} showWeekday={false} />
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                                                          <div className="operation-actions">
                                        <button
                                          onClick={() => toggleOperationExpansion(operationKey)}
                                          className="expand-button small"
                                        >
                                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        </button>
                                      </div>
                                  </div>

                                  {isExpanded && (
                                    <div className="operation-details-expanded">
                                      <div className="details-grid">
                                        <div className="detail-item">
                                          <label>Service Name</label>
                                          <div>{operation.name}</div>
                                        </div>
                                        <div className="detail-item">
                                          <label>Price</label>
                                          <div>{operation.price}ብር</div>
                                        </div>
                                        <div className="detail-item">
                                          <label>Created At</label>
                                          <div>
                                            <EthiopianDate dateString={operation.createdAt} showTime={true} showWeekday={false} />
                                          </div>
                                        </div>
                                        <div className="detail-item">
                                          <label>Status</label>
                                          <div className="status pending">
                                            <Clock className="w-3 h-3 mr-1" />
                                            Pending
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        ) : (
          // Finished Operations View
          <div className="finished-operations">

            {(() => {
              const finishedOperations = getFinishedOperations();
              const groupedFinished = groupFinishedOperationsByDate(finishedOperations);
              const finishedDates = Object.keys(groupedFinished);

              if (finishedDates.length === 0) {
                return (
                  <div className="empty-operations">
                    <Clock className="w-16 h-16 mb-4 text-blue-400" />
                    <h3>No {getStatusDisplayName('finished')} ዝተሰረሐ</h3>
                    <p>No ዝተሰረሐ have been completed yet.</p>
                  </div>
                );
              }

              return (
                <div className="finished-list">
                  {finishedDates.map((date, cardIndex) => {
                    const dateOperations = groupedFinished[date];
                    const isExpanded = expandedFinishedCards.has(cardIndex);
                    const totalValue = dateOperations.reduce((sum, op) => sum + op.price, 0);
                    const avgTime = dateOperations.reduce((sum, op) => {
                      if (op.finishedDate) {
                        return sum + (new Date(op.finishedDate).getTime() - new Date(op.createdAt).getTime());
                      }
                      return sum;
                    }, 0) / dateOperations.length;

                    return (
                      <div key={date} className="finished-card">
                        <div className="finished-header">
                          <div className="finished-info">
                            <button
                              onClick={() => toggleFinishedCardExpansion(cardIndex)}
                              className="expand-button"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            <div className="finished-details">
                              <h4 className="finished-date">{date}</h4>
                              <div className="finished-stats">
                                <span className="stat">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {dateOperations.length} operations
                                </span>
                                <span className="stat">
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  {totalValue}ብር
                                </span>
                                <span className="stat">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {Math.floor(avgTime / (1000 * 60))} min avg
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="finished-operations-list">
                            {dateOperations.map((operation, index) => (
                              <div key={index} className="finished-operation-item">
                                <div className="operation-info">
                                  <h5 className="operation-name">{operation.name}</h5>
                                  <div className="operation-meta">
                                    <span className="operation-price">{operation.price}ብር</span>
                                    <span className="operation-time">
                                      {operation.finishedDate && 
                                        calculateTimeDifference(operation.createdAt, operation.finishedDate)
                                      }
                                    </span>
                                  </div>
                                </div>
                                <div className="operation-timeline">
                                  <div className="timeline-item">
                                    <Calendar className="w-3 h-3" />
                                    <span>Created: <EthiopianDate dateString={operation.createdAt} showTime={true} showWeekday={false} /></span>
                                  </div>
                                  {operation.finishedDate && (
                                    <div className="timeline-item">
                                                                          <CheckCircle className="w-3 h-3" />
                                    <span>Finished: <EthiopianDate dateString={operation.finishedDate} showTime={true} showWeekday={false} /></span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <style jsx>{`
        .reports-container {
          space-y: 1.5rem;
        }

        .back-button-container {
          display: flex;
          justify-content: flex-start;
          margin-bottom: 1rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 0.75rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .section-subtitle {
          color: #64748b;
          margin: 0.25rem 0 0 0;
          font-size: 0.875rem;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .action-button {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          text-decoration: none;
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

        .action-button.success {
          background: linear-gradient(135deg, #10b981, #047857);
          color: white;
        }

        .action-button.success:hover {
          transform: translateY(-1px);
        }

        .action-button.small {
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
        }

        .user-info-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .user-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
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
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.25rem 0;
        }

        .user-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
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

        .user-phone {
          display: flex;
          align-items: center;
          color: #64748b;
          font-size: 0.875rem;
        }

        .user-stats {
          display: flex;
          gap: 2rem;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
          font-size: 0.875rem;
        }

        .reports-content {
          space-y: 2rem;
        }

        .view-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .view-title {
          display: flex;
          align-items: center;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .bulk-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border-radius: 12px;
          border: 2px solid #10b981;
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.15);
        }

        .bulk-info {
          display: flex;
          align-items: center;
        }

        .selected-count {
          font-size: 1rem;
          font-weight: 600;
          color: #059669;
          background: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
        }

        .action-button.large {
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 0.5rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-operations {
          text-align: center;
          padding: 3rem 1rem;
        }

        .empty-operations h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.5rem 0;
        }

        .empty-operations p {
          color: #64748b;
          margin: 0;
        }

        .operations-list {
          space-y: 1.5rem;
        }

        .date-group {
          background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.12);
          border: 2px solid #e2e8f0;
          overflow: hidden;
          transition: all 0.3s ease;
          position: relative;
        }

        .date-group::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #3b82f6, #6366f1);
        }

        .date-group:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(59, 130, 246, 0.18);
          border-color: #3b82f6;
        }

        .date-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.75rem;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%);
        }

        .date-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .expand-button {
          background: transparent;
          border: none;
          color: #667eea;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }

        .expand-button:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        .expand-button.small {
          padding: 0.125rem;
        }

        .date-details {
          display: flex;
          flex-direction: column;
        }

        .date-title {
          font-size: 1.25rem;
          font-weight: 700;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          letter-spacing: -0.025em;
        }

        .date-stats {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 0.25rem;
        }

        .date-count {
          font-size: 0.875rem;
          color: #64748b;
        }

        .date-total-price {
          font-size: 0.875rem;
          font-weight: 600;
          color: #059669;
          background: rgba(5, 150, 105, 0.1);
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
        }

        .date-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .select-all {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #64748b;
          cursor: pointer;
        }

        .checkbox {
          display: none;
        }

        .checkmark {
          width: 16px;
          height: 16px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          position: relative;
          transition: all 0.2s ease;
        }

        .checkbox:checked + .checkmark {
          background: #667eea;
          border-color: #667eea;
        }

        .checkbox:checked + .checkmark::after {
          content: '✓';
          position: absolute;
          top: -2px;
          left: 2px;
          color: white;
          font-size: 12px;
          font-weight: bold;
        }

        .operations-grid {
          padding: 1.5rem;
          space-y: 1rem;
        }

        .operation-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 16px;
          padding: 1.25rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 2px solid #e2e8f0;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .operation-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        }

        .operation-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
          border-color: #3b82f6;
        }

        .operation-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .operation-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .operation-select {
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .operation-details {
          display: flex;
          flex-direction: column;
        }

        .operation-name {
          font-size: 1.125rem;
          font-weight: 700;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.025em;
        }

        .operation-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.875rem;
          color: #64748b;
        }

        .operation-price {
          display: flex;
          align-items: center;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          font-weight: 700;
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }

        .operation-date {
          display: flex;
          align-items: center;
        }

        .operation-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .operation-details-expanded {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
        }

        .detail-item label {
          font-size: 0.75rem;
          color: #64748b;
          margin-bottom: 0.25rem;
        }

        .detail-item .price {
          font-weight: 600;
        }

        .status {
          display: flex;
          align-items: center;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .status.pending {
          color: #f59e0b;
        }

        .finished-list {
          space-y: 1.5rem;
        }

        .finished-card {
          background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(16, 185, 129, 0.15);
          border: 2px solid #dcfce7;
          overflow: hidden;
          transition: all 0.3s ease;
          position: relative;
        }

        .finished-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #10b981, #059669);
        }

        .finished-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(16, 185, 129, 0.25);
          border-color: #10b981;
        }

        .finished-header {
          padding: 1.75rem;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.05) 100%);
        }

        .finished-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .finished-details {
          display: flex;
          flex-direction: column;
        }

        .finished-date {
          font-size: 1.25rem;
          font-weight: 700;
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.025em;
        }

        .finished-stats {
          display: flex;
          gap: 1.5rem;
        }

        .stat {
          display: flex;
          align-items: center;
          font-size: 0.875rem;
          color: #64748b;
        }

        .finished-operations-list {
          padding: 1.5rem;
          space-y: 1rem;
        }

        .finished-operation-item {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 12px;
          padding: 1.25rem;
          box-shadow: 0 2px 12px rgba(16, 185, 129, 0.1);
          border: 1px solid #dcfce7;
          transition: all 0.2s ease;
        }

        .finished-operation-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.15);
        }

        .operation-timeline {
          margin-top: 0.75rem;
          space-y: 0.5rem;
        }

        .timeline-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #64748b;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
        }

        .empty-content {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 3rem 2rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .empty-content h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.5rem 0;
        }

        .empty-content p {
          color: #64748b;
          margin: 0 0 1.5rem 0;
        }

        @media (max-width: 768px) {
          .section-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .header-actions {
            justify-content: center;
          }

          .user-stats {
            flex-direction: column;
            gap: 1rem;
          }

          .date-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .date-actions {
            justify-content: space-between;
          }

          .operation-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .operation-actions {
            justify-content: space-between;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }

          .finished-stats {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
} 