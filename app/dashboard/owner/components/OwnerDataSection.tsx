"use client";
import React, { useState } from "react";
import useSWR from "swr";
import EthiopianDate from "@/components/EthiopianDate";
import { gregorianToEthiopian } from "@/utils/ethiopianCalendar";
import Modal from "@/components/ui/modal";
import {
  ArrowLeft,
  Package,
  ShoppingCart,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Eye,
  Download,
  X
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

interface OwnerDataSectionProps {
  ownerId: string;
  dataType: 'products' | 'productSales' | 'withdrawals';
  onBackToStaff: () => void;
}

export default function OwnerDataSection({ ownerId, dataType, onBackToStaff }: OwnerDataSectionProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedOperations, setSelectedOperations] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [updateProgress, setUpdateProgress] = useState({ current: 0, total: 0, isUpdating: false });
  const [statusFilter, setStatusFilter] = useState<'pending' | 'finished'>('pending');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Modal state
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info"
  });

  // Fetch data based on type
  const { data, error, isLoading: loadingData } = useSWR(
    `/api/owners/${ownerId}/${dataType === 'productSales' ? 'product-sales' : dataType}`,
    fetcher
  );

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  // Utility functions for payment method and image handling
  const getPaymentMethodDisplay = (paymentMethod: string) => {
    switch (paymentMethod) {
      case 'cash':
        return { text: 'Cash', color: 'bg-green-100 text-green-800' };
      case 'mobile banking(telebirr)':
        return { text: 'Mobile Banking', color: 'bg-blue-100 text-blue-800' };
      default:
        return { text: paymentMethod || 'Unknown', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const downloadPaymentProof = async (imageUrl: string, productName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment-proof-${productName}-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
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
  const handleSelectAllForDate = (date: string, operations: any[], checked: boolean) => {
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

  // Handle bulk status update for selected operations
  const handleUpdateSelectedOperations = async (newStatus: string) => {
    if (selectedOperations.size === 0) return;
    
    setIsLoading(true);
    setUpdateProgress({ current: 0, total: selectedOperations.size, isUpdating: true });
    
    // Store the count before clearing selections
    const selectedCount = selectedOperations.size;
    
    try {
      const token = localStorage.getItem("token");
      
      // Get all operations to find the correct indices
      const allOperations = data?.[dataType === 'productSales' ? 'productSales' : dataType] || [];
      
      // Collect all operation indices to update
      const operationIndices: number[] = [];
      
      Array.from(selectedOperations).forEach(operationKey => {
        const [date, displayIndex] = operationKey.split('-');
        const displayIndexNum = parseInt(displayIndex);
        
        // Find the actual operation in the grouped operations array
        const groupedData = groupDataByDate(allOperations);
        const dateOperations = groupedData[date] || [];
        const selectedOperation = dateOperations[displayIndexNum];
        
        if (selectedOperation) {
          // Find the index in the original array
          const originalIndex = allOperations.findIndex((op: any) => op._id === selectedOperation._id);
          if (originalIndex !== -1) {
            operationIndices.push(originalIndex);
          }
        }
      });
      
      console.log('Updating operations:', operationIndices);
      
      // Single bulk update API call
      const updateData = {
        operationIndices,
        status: newStatus,
        finishedDate: newStatus === 'finished' ? new Date().toISOString() : undefined
      };
      
      const response = await fetch(`/api/owners/${ownerId}/product-sales/bulk-update`, {
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
      
      // Force a re-render by updating the expanded dates
      setExpandedDates(new Set(expandedDates));
      
      // Show success message with correct count
      const operationText = selectedCount === 1 ? 'operation' : 'operations';
      setModal({
        isOpen: true,
        title: "Success",
        message: `${selectedCount} ${operationText} marked as finished successfully!`,
        type: "success"
      });
      
    } catch (error) {
      console.error("Error updating operations:", error instanceof Error ? error.message : "Unknown error");
      setModal({
        isOpen: true,
        title: "Error",
        message: "Error updating operations. Please try again.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
      setUpdateProgress({ current: 0, total: 0, isUpdating: false });
    }
  };

  // Group data by Ethiopian date
  const groupDataByDate = (items: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    
    items.forEach((item) => {
      const date = new Date(item.createdAt);
      const ethiopian = gregorianToEthiopian(date);
      const ethiopianDateKey = `${ethiopian.day} ${ethiopian.monthName} ${ethiopian.year}`;
      
      if (!grouped[ethiopianDateKey]) {
        grouped[ethiopianDateKey] = [];
      }
      grouped[ethiopianDateKey].push(item);
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

  // Toggle item expansion
  const toggleItemExpansion = (itemKey: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemKey)) {
      newExpanded.delete(itemKey);
    } else {
      newExpanded.add(itemKey);
    }
    setExpandedItems(newExpanded);
  };

  // Get data type display info
  const getDataTypeInfo = () => {
    switch (dataType) {
      case 'products':
        return {
          title: 'Products Inventory',
          icon: <Package className="w-5 h-5" />,
          color: 'products',
          emptyMessage: 'No products found',
          emptyDescription: 'No products have been added yet.'
        };
      case 'productSales':
        return {
          title: 'Product Sales History',
          icon: <ShoppingCart className="w-5 h-5" />,
          color: 'sales',
          emptyMessage: 'No sales found',
          emptyDescription: 'No product sales have been recorded yet.'
        };
      case 'withdrawals':
        return {
          title: 'Withdrawals History',
          icon: <DollarSign className="w-5 h-5" />,
          color: 'withdrawals',
          emptyMessage: 'No withdrawals found',
          emptyDescription: 'No withdrawals have been recorded yet.'
        };
    }
  };

  const dataTypeInfo = getDataTypeInfo();

  if (error) {
    return (
      <div className="error-state">
        <div className="error-content">
          <AlertCircle className="w-16 h-16 mb-4 text-red-400" />
          <h3>Error Loading Data</h3>
          <p>Failed to load {dataTypeInfo.title.toLowerCase()}</p>
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

  if (loadingData) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading {dataTypeInfo.title.toLowerCase()}...</p>
      </div>
    );
  }

  const items = data?.[dataType === 'productSales' ? 'productSales' : dataType] || [];
  
  // Filter items by status for product sales
  const filteredItems = dataType === 'productSales' 
    ? items.filter((item: any) => (item.status || 'pending') === statusFilter)
    : items;
  
  const groupedData = groupDataByDate(filteredItems);
  const dates = Object.keys(groupedData);

  return (
    <div className="owner-data-container">
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

      {/* Header */}
      <div className="data-header">
        <div className="header-content">
          <div className={`header-icon ${dataTypeInfo.color}`}>
            {dataTypeInfo.icon}
          </div>
          <div>
            <h2 className="section-title">{dataTypeInfo.title}</h2>
            <p className="section-subtitle">
              Historical data for owner ID: {ownerId}
            </p>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <TrendingUp className="w-4 h-4" />
            <span>Total Items: {filteredItems.length}</span>
      </div>

          {/* Status Filter for Product Sales */}
          {dataType === 'productSales' && (
            <div className="status-filter">
              <label className="filter-label">Filter by Status:</label>
              <div className="filter-buttons">
              <button
                  onClick={() => setStatusFilter('pending')}
                  className={`filter-button ${statusFilter === 'pending' ? 'active' : ''}`}
                >
                  Pending ({items.filter((item: any) => (item.status || 'pending') === 'pending').length})
              </button>
                <button
                  onClick={() => setStatusFilter('finished')}
                  className={`filter-button ${statusFilter === 'finished' ? 'active' : ''}`}
                >
                  Finished ({items.filter((item: any) => item.status === 'finished').length})
                </button>
                      </div>
                    </div>
                  )}
        </div>
                </div>

      {/* Data Content */}
      <div className="data-content">
        {dates.length === 0 ? (
          <div className="empty-data">
            <div className="empty-icon">
              {dataTypeInfo.icon}
              </div>
            <h3>{dataTypeInfo.emptyMessage}</h3>
            <p>{dataTypeInfo.emptyDescription}</p>
                  </div>
                ) : (
          <>
            {/* Simple Table for Products */}
            {dataType === 'products' && (
                  <div className="products-table-container">
                    <table className="products-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Product Name</th>
                          <th>Quantity</th>
                          <th>Price Per Unit</th>
                          <th>Total Price</th>
                          <th>Date Added</th>
                        </tr>
                      </thead>
                      <tbody>
                    {items.map((item: any, index: number) => (
                      <tr key={item._id} className="product-row">
                            <td className="row-number">{index + 1}</td>
                        <td className="product-name">{item.name}</td>
                        <td className="product-quantity">
                          {item.quantity} {item.quantityType}
                            </td>
                        <td className="product-price">{item.pricePerUnit}ብር</td>
                        <td className="product-total">{item.totalPrice}ብር</td>
                        <td className="product-date">
                          <EthiopianDate dateString={item.createdAt} showTime={true} showWeekday={false} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

            {/* Grouped by Date for other data types */}
            {dataType !== 'products' && (
              <>
                {/* Bulk Actions for Product Sales */}
                {dataType === 'productSales' && selectedOperations.size > 0 && statusFilter === 'pending' && (
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
                          Mark Selected as Finished
                        </>
                      )}
                    </button>
          </div>
                )}

          <div className="data-list">
            {dates.map(date => {
              const dateItems = groupedData[date];
              const isDateExpanded = expandedDates.has(date);
              
              // Calculate totals for the date
              let totalValue = 0;
                  if (dataType === 'productSales') {
                totalValue = dateItems.reduce((sum: number, item: any) => sum + item.totalSoldMoney, 0);
              } else if (dataType === 'withdrawals') {
                totalValue = dateItems.reduce((sum: number, item: any) => sum + item.amount, 0);
              }

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
                          <span className="date-count">{dateItems.length} items</span>
                          <span className="date-total-value">
                            Total: {totalValue}ብር
                          </span>
                        </div>
                      </div>
                    </div>
                                                    <div className="date-actions">
                              {dataType === 'productSales' && statusFilter === 'pending' && (
                                <label className="select-all">
                                  <input
                                    type="checkbox"
                                    checked={dateItems.filter((_, index) => 
                                      selectedOperations.has(`${date}-${index}`)
                                    ).length === dateItems.filter((item: any) => (item.status || 'pending') === 'pending').length && 
                                    dateItems.filter((item: any) => (item.status || 'pending') === 'pending').length > 0}
                                    onChange={(e) => handleSelectAllForDate(date, dateItems.filter((item: any) => (item.status || 'pending') === 'pending'), e.target.checked)}
                                    className="checkbox"
                                  />
                                  <span className="checkmark"></span>
                                  Select All Pending
                                </label>
                              )}
                    </div>
                  </div>
                  
                  {isDateExpanded && (
                    <div className="items-grid">
                      {dateItems.map((item, index) => {
                        const itemKey = `${date}-${index}`;
                        const isExpanded = expandedItems.has(itemKey);
                        
                        return (
                          <div key={itemKey} className="item-card">
                            <div className="item-header">
                              <div className="item-info">
                                    {dataType === 'productSales' && (item.status || 'pending') === 'pending' && (
                                      <label className="operation-select">
                                        <input
                                          type="checkbox"
                                          checked={selectedOperations.has(itemKey)}
                                          onChange={(e) => handleOperationSelect(itemKey, e.target.checked)}
                                          className="checkbox"
                                        />
                                        <span className="checkmark"></span>
                                      </label>
                                    )}
                                    <div className="item-details">
                                  {dataType === 'productSales' && (
                                    <>
                                      <h5 className="item-name">{item.productName}</h5>
                                      <div className="item-meta">
                                        <span className="item-quantity">
                                          Sold: {item.soldQuantity}
                                        </span>
                                        <span className="item-price">
                                          {item.pricePerUnit}ብር/unit
                                        </span>
                                        <span className="item-total">
                                          Total: {item.totalSoldMoney}ብር
                                        </span>
                                        <span className={`item-status ${item.status || 'pending'}`}>
                                          {item.status || 'pending'}
                                        </span>
                                        {/* Payment Method */}
                                        {item.by && (
                                          <span className={`payment-method ${getPaymentMethodDisplay(item.by).color}`}>
                                            {getPaymentMethodDisplay(item.by).text}
                                          </span>
                                        )}
                                        {/* Payment Proof Image */}
                                        {item.by === 'mobile banking(telebirr)' && item.paymentImageUrl && (
                                          <div className="payment-proof-actions">
                                            <button
                                              onClick={() => setPreviewImage(item.paymentImageUrl)}
                                              className="proof-action-button view"
                                              title="View Payment Proof"
                                            >
                                              <Eye className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() => downloadPaymentProof(item.paymentImageUrl, item.productName)}
                                              className="proof-action-button download"
                                              title="Download Payment Proof"
                                            >
                                              <Download className="w-3 h-3" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  )}
                                  
                                  {dataType === 'withdrawals' && (
                                    <>
                                      <h5 className="item-name">{item.reason}</h5>
                                      <div className="item-meta">
                                        <span className="item-amount">
                                          Amount: {item.amount}ብር
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="item-actions">
                                <button
                                  onClick={() => toggleItemExpansion(itemKey)}
                                  className="expand-button small"
                                >
                                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                            
                            {isExpanded && (
                              <div className="item-details-expanded">
                                <div className="details-grid">
                                  {dataType === 'productSales' && (
                                    <>
                                      <div className="detail-item">
                                        <label>Product Name</label>
                                        <div>{item.productName}</div>
                                      </div>
                                      <div className="detail-item">
                                        <label>Sold Quantity</label>
                                        <div>{item.soldQuantity}</div>
                                      </div>
                                      <div className="detail-item">
                                        <label>Price Per Unit</label>
                                        <div>{item.pricePerUnit}ብር</div>
                                      </div>
                                      <div className="detail-item">
                                        <label>Total Sold Money</label>
                                        <div>{item.totalSoldMoney}ብር</div>
                                      </div>
                                          <div className="detail-item">
                                            <label>Status</label>
                                            <div className={`status ${item.status || 'pending'}`}>
                                              {item.status || 'pending'}
                                            </div>
                                      </div>
                                      <div className="detail-item">
                                        <label>Sold At</label>
                                        <div>
                                          <EthiopianDate dateString={item.createdAt} showTime={true} showWeekday={false} />
                                        </div>
                                      </div>
                                          {item.finishedDate && (
                                            <div className="detail-item">
                                              <label>Finished At</label>
                                              <div>
                                                <EthiopianDate dateString={item.finishedDate} showTime={true} showWeekday={false} />
                                              </div>
                                            </div>
                                          )}
                                    </>
                                  )}
                                  
                                  {dataType === 'withdrawals' && (
                                    <>
                                      <div className="detail-item">
                                        <label>Reason</label>
                                        <div>{item.reason}</div>
                                      </div>
                                      <div className="detail-item">
                                        <label>Amount</label>
                                        <div>{item.amount}ብር</div>
                                      </div>
                                      <div className="detail-item">
                                        <label>Withdrawn At</label>
                                        <div>
                                          <EthiopianDate dateString={item.createdAt} showTime={true} showWeekday={false} />
                                        </div>
                                      </div>
                                    </>
                                  )}
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
                </>
        )}
          </>
    )}
      </div>

      <style jsx>{`
        .owner-data-container {
          space-y: 1.5rem;
        }

        .back-button-container {
          display: flex;
          justify-content: flex-start;
          margin-bottom: 1rem;
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

        .operation-select {
          display: flex;
          align-items: center;
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

        .data-header {
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

        .header-icon.products {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        .header-icon.sales {
          background: linear-gradient(135deg, #10b981, #047857);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .header-icon.withdrawals {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
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

        .header-stats {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .status-filter {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin: 0;
        }

        .filter-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .filter-button {
          padding: 0.5rem 1rem;
          border: 2px solid #e2e8f0;
          background: white;
          color: #64748b;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-button:hover {
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .filter-button.active {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: white;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          font-weight: 500;
          color: #1e293b;
        }

        .data-content {
          space-y: 2rem;
        }

        .empty-data {
          text-align: center;
          padding: 3rem 1rem;
        }

        .empty-icon {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          width: 4rem;
          height: 4rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }

        .empty-data h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.5rem 0;
        }

        .empty-data p {
          color: #64748b;
          margin: 0;
        }

        .data-list {
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

        .date-total-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: #059669;
          background: rgba(5, 150, 105, 0.1);
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
        }

        .items-grid {
          padding: 1.5rem;
          space-y: 1rem;
        }

        .item-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 16px;
          padding: 1.25rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 2px solid #e2e8f0;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .item-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        }

        .item-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
          border-color: #3b82f6;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .item-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .item-details {
          display: flex;
          flex-direction: column;
        }

        .item-name {
          font-size: 1.125rem;
          font-weight: 700;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.025em;
        }

        .item-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.875rem;
          color: #64748b;
        }

        .item-quantity {
          display: flex;
          align-items: center;
          background: rgba(59, 130, 246, 0.1);
          color: #1d4ed8;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-weight: 500;
        }

        .item-price {
          display: flex;
          align-items: center;
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-weight: 500;
        }

        .item-total {
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

        .item-amount {
          display: flex;
          align-items: center;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          font-weight: 700;
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }

        .item-status {
          display: flex;
          align-items: center;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .item-status.pending {
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
        }

        .item-status.finished {
          background: rgba(16, 185, 129, 0.1);
          color: #047857;
        }

        .payment-method {
          display: flex;
          align-items: center;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .payment-proof-actions {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .proof-action-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .proof-action-button.view {
          background: rgba(59, 130, 246, 0.1);
          color: #1d4ed8;
        }

        .proof-action-button.view:hover {
          background: rgba(59, 130, 246, 0.2);
          transform: scale(1.1);
        }

        .proof-action-button.download {
          background: rgba(16, 185, 129, 0.1);
          color: #047857;
        }

        .proof-action-button.download:hover {
          background: rgba(16, 185, 129, 0.2);
          transform: scale(1.1);
        }

        /* Image Preview Modal */
        .image-preview-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .image-preview-modal .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
        }

        .image-preview-modal .modal-content {
          position: relative;
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          max-width: 90vw;
          max-height: 90vh;
          overflow: hidden;
        }

        .image-preview-modal .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .image-preview-modal .modal-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .image-preview-modal .close-button {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .image-preview-modal .close-button:hover {
          background: #e2e8f0;
          color: #374151;
        }

        .image-preview-modal .modal-body {
          padding: 1.5rem;
          display: flex;
          justify-content: center;
          align-items: center;
          max-height: 70vh;
          overflow: auto;
        }

        .preview-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .image-preview-modal .modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .download-button {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, #10b981, #047857);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .download-button:hover {
          background: linear-gradient(135deg, #059669, #065f46);
          transform: translateY(-1px);
        }

        .status {
          display: flex;
          align-items: center;
          font-size: 0.875rem;
          font-weight: 500;
          padding: 0.25rem 0.75rem;
          border-radius: 8px;
          text-transform: uppercase;
        }

        .status.pending {
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
        }

        .status.finished {
          background: rgba(16, 185, 129, 0.1);
          color: #047857;
        }

        .item-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .item-details-expanded {
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

        .detail-item div {
          font-weight: 500;
          color: #1e293b;
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

        /* Products Table Styles */
        .products-table-container {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .products-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .products-table th {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e2e8f0;
          font-size: 0.875rem;
        }

        .products-table td {
          padding: 1rem;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .products-table tr:hover {
          background: #f8fafc;
        }

        .row-number {
          font-weight: 600;
          color: #64748b;
            text-align: center;
          width: 50px;
        }

        .product-name {
          font-weight: 600;
          color: #1e293b;
        }

        .product-quantity {
          color: #64748b;
        }

        .product-price {
          font-weight: 600;
          color: #059669;
        }

        .product-total {
          font-weight: 700;
          color: #059669;
          background: rgba(5, 150, 105, 0.1);
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
        }

        .product-date {
          color: #64748b;
          font-size: 0.8rem;
        }

        @media (max-width: 768px) {
          .data-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .header-content {
            flex-direction: column;
            gap: 0.75rem;
            text-align: center;
          }

          .header-stats {
            justify-content: center;
            flex-direction: column;
            gap: 1rem;
          }

          .status-filter {
            align-items: center;
          }

          .filter-buttons {
            flex-wrap: wrap;
            justify-content: center;
          }

          .filter-button {
            font-size: 0.75rem;
            padding: 0.375rem 0.75rem;
          }

          .date-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .item-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .item-actions {
            justify-content: space-between;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }

          .item-meta {
            flex-direction: column;
            gap: 0.5rem;
            align-items: flex-start;
          }
        }
      `}</style>
      
      {/* Image Preview Modal */}
      {previewImage && (
        <div className="image-preview-modal">
          <div className="modal-overlay" onClick={() => setPreviewImage(null)} />
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Payment Proof</h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="close-button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="modal-body">
              <img 
                src={previewImage} 
                alt="Payment Proof" 
                className="preview-image"
                onError={(e) => {
                  console.error('Error loading image:', e);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="modal-footer">
              <button
                onClick={() => downloadPaymentProof(previewImage, 'payment-proof')}
                className="download-button"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
              <button
                onClick={() => setPreviewImage(null)}
                className="close-modal-button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        autoClose={modal.type === "success"}
        autoCloseDelay={3000}
      />
    </div>
  );
}
