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
  AlertCircle
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
  const groupedData = groupDataByDate(items);
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
            <span>Total Items: {items.length}</span>
          </div>
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
          <div className="data-list">
            {dates.map(date => {
              const dateItems = groupedData[date];
              const isDateExpanded = expandedDates.has(date);
              
              // Calculate totals for the date
              let totalValue = 0;
              if (dataType === 'products') {
                totalValue = dateItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
              } else if (dataType === 'productSales') {
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
                                <div className="item-details">
                                  {dataType === 'products' && (
                                    <>
                                      <h5 className="item-name">{item.name}</h5>
                                      <div className="item-meta">
                                        <span className="item-quantity">
                                          {item.quantity} {item.quantityType}
                                        </span>
                                        <span className="item-price">
                                          {item.pricePerUnit}ብር/unit
                                        </span>
                                        <span className="item-total">
                                          Total: {item.totalPrice}ብር
                                        </span>
                                      </div>
                                    </>
                                  )}
                                  
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
                                  {dataType === 'products' && (
                                    <>
                                      <div className="detail-item">
                                        <label>Product Name</label>
                                        <div>{item.name}</div>
                                      </div>
                                      <div className="detail-item">
                                        <label>Quantity</label>
                                        <div>{item.quantity} {item.quantityType}</div>
                                      </div>
                                      <div className="detail-item">
                                        <label>Price Per Unit</label>
                                        <div>{item.pricePerUnit}ብር</div>
                                      </div>
                                      <div className="detail-item">
                                        <label>Total Price</label>
                                        <div>{item.totalPrice}ብር</div>
                                      </div>
                                      <div className="detail-item">
                                        <label>Created At</label>
                                        <div>
                                          <EthiopianDate dateString={item.createdAt} showTime={true} showWeekday={false} />
                                        </div>
                                      </div>
                                    </>
                                  )}
                                  
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
                                        <label>Sold At</label>
                                        <div>
                                          <EthiopianDate dateString={item.createdAt} showTime={true} showWeekday={false} />
                                        </div>
                                      </div>
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
