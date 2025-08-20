"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (limit: number) => void;
  showItemsPerPage?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="pagination-wrapper">
      <div className="pagination-info">
        <span>Showing {startItem} to {endItem} of {totalItems} items</span>
      </div>

      <div className="pagination-controls">
        {showItemsPerPage && onItemsPerPageChange && (
          <div className="items-per-page">
            <label>Items per page:</label>
            <select value={itemsPerPage} onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}

        <div className="pagination-buttons">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-button prev"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const shouldShow = 
                page === 1 || 
                page === totalPages || 
                Math.abs(page - currentPage) <= 1;

              if (!shouldShow) {
                if (page === 2 && currentPage > 3) {
                  return <span key="ellipsis-start">...</span>;
                }
                if (page === totalPages - 1 && currentPage < totalPages - 2) {
                  return <span key="ellipsis-end">...</span>;
                }
                return null;
              }

              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`page-number ${page === currentPage ? "active" : ""}`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-button next"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <style jsx>{`
        .pagination-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1.5rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .pagination-info {
          text-align: center;
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
        }

        .pagination-controls {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
        }

        .items-per-page {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .items-per-page label {
          font-size: 0.875rem;
          color: #374151;
          font-weight: 500;
        }

        .items-per-page select {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: white;
          font-size: 0.875rem;
          color: #374151;
          cursor: pointer;
        }

        .pagination-buttons {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .pagination-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: white;
          color: #374151;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 100px;
          justify-content: center;
        }

        .pagination-button:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #9ca3af;
          transform: translateY(-1px);
        }

        .pagination-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-numbers {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .page-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: white;
          color: #374151;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .page-number:hover:not(.active) {
          background: #f8fafc;
          border-color: #9ca3af;
          transform: translateY(-1px);
        }

        .page-number.active {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border-color: #3b82f6;
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
        }

        .page-numbers span {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          color: #9ca3af;
          font-size: 0.875rem;
          font-weight: 500;
        }

        @media (max-width: 640px) {
          .pagination-wrapper {
            padding: 1rem;
          }

          .pagination-button {
            padding: 0.5rem 0.75rem;
            min-width: 80px;
            font-size: 0.75rem;
          }

          .page-number {
            width: 35px;
            height: 35px;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
