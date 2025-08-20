'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { syncOperations } from '../utils/offlineQueue';
import queueOperations from '../utils/offlineQueue';
import { localforageUtils, queueOperations as baseQueueOps } from '../utils/localforageClient';
import { WifiOff, Wifi, RefreshCw, AlertTriangle, CheckCircle, X } from 'lucide-react';

// Offline Provider Context
// Manages sync operations and provides offline state to components

export interface OfflineContextValue {
  // Connection status
  isOnline: boolean;
  isOffline: boolean;
  isChecking: boolean;
  
  // Queue status
  pendingCount: number;
  syncingCount: number;
  failedCount: number;
  
  // Sync operations
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
  
  // Methods
  forceSync: () => Promise<void>;
  clearFailedOperations: () => Promise<void>;
  getQueueStatus: () => Promise<any>;
  
  // Helper flags
  hasUnsyncedData: boolean;
  isHealthy: boolean;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

export interface OfflineProviderProps {
  children: React.ReactNode;
  autoSync?: boolean; // Auto sync when coming online, default true
  syncOnMount?: boolean; // Sync pending operations on mount, default true
  enableLogging?: boolean; // Enable console logging, default true
}

// Offline Status Display Component
export function OfflineStatusDisplay() {
  const { 
    isOnline, 
    isOffline, 
    pendingCount, 
    failedCount, 
    isSyncing, 
    forceSync,
    getQueueStatus
  } = useOffline();

  const [showFailedDetails, setShowFailedDetails] = useState(false);
  const [failedOperations, setFailedOperations] = useState<any[]>([]);

  const handleSync = async () => {
    if (isOnline && !isSyncing) {
      await forceSync();
    }
  };

  const handleViewFailed = async () => {
    if (failedCount > 0) {
      try {
        const status = await getQueueStatus();
        const failed = status.operations?.filter((op: any) => op.status === 'failed') || [];
        setFailedOperations(failed);
        setShowFailedDetails(true);
      } catch (error) {
        console.error('Failed to get failed operations:', error);
      }
    }
  };

  return (
    <>
      <div className="offline-status-display">
        <div className="status-indicators">
          {/* Connection Status */}
          <div className={`status-item ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="status-text">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Pending Operations */}
          {pendingCount > 0 && (
            <div className="status-item pending">
              <RefreshCw className={`w-4 h-4 text-orange-500 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="status-text">
                {pendingCount} operations waiting to upload
              </span>
            </div>
          )}

          {/* Failed Operations */}
          {failedCount > 0 && (
            <button
              onClick={handleViewFailed}
              className="status-item failed clickable"
            >
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="status-text">
                {failedCount} failed
              </span>
            </button>
          )}

          {/* Sync Button */}
          {pendingCount > 0 && isOnline && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="sync-button"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
          )}

          {/* Success Indicator */}
          {pendingCount === 0 && failedCount === 0 && isOnline && (
            <div className="status-item success">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="status-text">All synced</span>
            </div>
          )}
        </div>
      </div>

      {/* Failed Operations Modal */}
      {showFailedDetails && (
        <div className="failed-operations-modal">
          <div className="modal-overlay" onClick={() => setShowFailedDetails(false)} />
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Failed Operations ({failedCount})</h3>
              <button
                onClick={() => setShowFailedDetails(false)}
                className="close-button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="modal-body">
              {failedOperations.length === 0 ? (
                <p className="no-failed">No failed operations found.</p>
              ) : (
                <div className="failed-list">
                  {failedOperations.map((operation, index) => (
                    <div key={index} className="failed-item">
                      <div className="failed-header">
                        <span className="operation-type">{operation.type || 'Unknown'}</span>
                        <span className="failed-time">
                          {new Date(operation.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="failed-details">
                        <p className="error-message">{operation.error || 'Unknown error'}</p>
                        <div className="operation-data">
                          <strong>Data:</strong>
                          <pre>{JSON.stringify(operation.data, null, 2)}</pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowFailedDetails(false)}
                className="close-modal-button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .offline-status-display {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.875rem;
        }

        .status-indicators {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          border: none;
          background: none;
          cursor: default;
        }

        .status-item.clickable {
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .status-item.clickable:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .status-item.online {
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        }

        .status-item.offline {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        .status-item.pending {
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
        }

        .status-item.failed {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        .status-item.success {
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        }

        .status-text {
          white-space: nowrap;
        }

        .sync-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.75rem;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sync-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb, #1e40af);
          transform: translateY(-1px);
        }

        .sync-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Failed Operations Modal */
        .failed-operations-modal {
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

        .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }

        .modal-content {
          position: relative;
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .modal-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: #e2e8f0;
          color: #374151;
        }

        .modal-body {
          padding: 1.5rem;
          max-height: 60vh;
          overflow-y: auto;
        }

        .no-failed {
          text-align: center;
          color: #64748b;
          font-style: italic;
        }

        .failed-list {
          space-y: 1rem;
        }

        .failed-item {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .failed-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .operation-type {
          font-weight: 600;
          color: #dc2626;
          text-transform: uppercase;
          font-size: 0.75rem;
        }

        .failed-time {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .failed-details {
          space-y: 0.5rem;
        }

        .error-message {
          color: #dc2626;
          font-size: 0.875rem;
          margin: 0 0 0.5rem 0;
        }

        .operation-data {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 0.5rem;
        }

        .operation-data pre {
          font-size: 0.75rem;
          color: #374151;
          margin: 0.25rem 0 0 0;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
          display: flex;
          justify-content: flex-end;
        }

        .close-modal-button {
          padding: 0.5rem 1rem;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .close-modal-button:hover {
          background: #4b5563;
        }

        @media (max-width: 768px) {
          .offline-status-display {
            gap: 0.5rem;
          }

          .status-indicators {
            gap: 0.5rem;
          }

          .status-text {
            display: none;
          }

          .status-item {
            padding: 0.25rem;
          }

          .modal-content {
            width: 95%;
            margin: 1rem;
          }
        }
      `}</style>
    </>
  );
}

export function OfflineProvider({ 
  children, 
  autoSync = true,
  syncOnMount = true,
  enableLogging = true
}: OfflineProviderProps) {
  // Connection status
  const {
    isOnline,
    isOffline,
    isChecking,
    forceCheck
  } = useConnectionStatus({
    enableHeartbeat: true,
    checkInterval: 2000
  });

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // Queue status
  const [queueStatus, setQueueStatus] = useState({
    pendingCount: 0,
    syncingCount: 0,
    failedCount: 0,
    totalCount: 0
  });

  // Initialize storage on mount
  useEffect(() => {
    const init = async () => {
      const initialized = await localforageUtils.initialize();
      if (!initialized && enableLogging) {
        console.error('❌ [OFFLINE] Failed to initialize offline storage');
      }
      
      // Update queue status
      await updateQueueStatus();
      
      // Sync on mount if enabled and online
      if (syncOnMount && isOnline && !isSyncing) {
        await performSync();
      }
    };
    
    init();
  }, []);

  // Update queue status
  const updateQueueStatus = useCallback(async () => {
    try {
      const status = await syncOperations.getSyncStatus();
      setQueueStatus(status);
      
      if (enableLogging && status.totalCount > 0) {
        console.log('📊 [OFFLINE] Queue status:', status);
      }
    } catch (error) {
      if (enableLogging) {
        console.error('❌ [OFFLINE] Failed to get queue status:', error);
      }
    }
  }, [enableLogging]);

  // Perform sync operation
  const performSync = useCallback(async () => {
    if (isSyncing || !isOnline) {
      if (enableLogging) {
        console.log('⏸️ [SYNC] Skipping sync - already syncing or offline');
      }
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      if (enableLogging) {
        console.log('🔄 [SYNC] Starting sync process...');
      }

      const result = await syncOperations.syncAllOperations();
      
      if (enableLogging) {
        console.log('✅ [SYNC] Sync completed:', result);
      }

      setLastSyncTime(new Date());
      
      // Show sync results
      if (result.total > 0) {
        if (result.synced === result.total) {
          console.log(`🎉 [SYNC] All ${result.synced} operations synced successfully!`);
        } else if (result.synced > 0) {
          console.log(`⚠️ [SYNC] ${result.synced}/${result.total} operations synced, ${result.failed} failed`);
        } else {
          console.log(`❌ [SYNC] No operations synced (${result.failed} failed)`);
          setSyncError(`Failed to sync ${result.failed} operations`);
        }
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Sync failed';
      setSyncError(errorMessage);
      
      if (enableLogging) {
        console.error('❌ [SYNC] Sync failed:', error);
      }
    } finally {
      setIsSyncing(false);
      await updateQueueStatus();
    }
  }, [isSyncing, isOnline, enableLogging, updateQueueStatus]);

  // Auto-sync when coming online
  useEffect(() => {
    if (autoSync && isOnline && !isSyncing && queueStatus.pendingCount > 0) {
      if (enableLogging) {
        console.log('🌐 [SYNC] Connection restored, auto-syncing...');
      }
      
      // Small delay to ensure connection is stable
      setTimeout(performSync, 1000);
    }
  }, [isOnline, autoSync, isSyncing, queueStatus.pendingCount, performSync, enableLogging]);

  // Force sync method
  const forceSync = useCallback(async () => {
    if (!isOnline) {
      throw new Error('Cannot sync while offline');
    }
    await performSync();
  }, [isOnline, performSync]);

  // Clear failed operations
  const clearFailedOperations = useCallback(async () => {
    try {
      // Get operations from all queues
      const { salesQueue, productsQueue, servicesQueue } = queueOperations;
      const salesOps = await salesQueue.getPendingSales();
      const productOps = await productsQueue.getPendingProducts();
      const serviceOps = await servicesQueue.getPendingServices();
      
      const allOperations = [...salesOps, ...productOps, ...serviceOps];
      const failedOperations = allOperations.filter((op: any) => op.status === 'failed');
      
      // Remove failed operations using the base queue operations
      for (const operation of failedOperations) {
        await baseQueueOps.remove(operation.id);
      }

      await updateQueueStatus();
      if (enableLogging) {
        console.log(`🗑️ [SYNC] Cleared ${failedOperations.length} failed operations`);
      }
    } catch (error) {
      if (enableLogging) {
        console.error('❌ [SYNC] Failed to clear failed operations:', error);
      }
    }
  }, [updateQueueStatus, enableLogging]);

  // Get detailed queue status
  const getQueueStatus = useCallback(async () => {
    const status = await syncOperations.getSyncStatus();
    
    // Get operations from all queues
    const { salesQueue, productsQueue, servicesQueue } = queueOperations;
    const salesOps = await salesQueue.getPendingSales();
    const productOps = await productsQueue.getPendingProducts();
    const serviceOps = await servicesQueue.getPendingServices();
    const allOperations = [...salesOps, ...productOps, ...serviceOps];
    
    return {
      ...status,
      operations: allOperations,
      storageInfo: await localforageUtils.getStorageInfo()
    };
  }, []);

  // Periodically update queue status
  useEffect(() => {
    const interval = setInterval(updateQueueStatus, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, [updateQueueStatus]);

  // Context value
  const contextValue: OfflineContextValue = {
    // Connection status
    isOnline,
    isOffline,
    isChecking,
    
    // Queue status
    pendingCount: queueStatus.pendingCount,
    syncingCount: queueStatus.syncingCount,
    failedCount: queueStatus.failedCount,
    
    // Sync operations
    isSyncing,
    lastSyncTime,
    syncError,
    
    // Methods
    forceSync,
    clearFailedOperations,
    getQueueStatus,
    
    // Helper flags
    hasUnsyncedData: queueStatus.pendingCount > 0 || queueStatus.failedCount > 0,
    isHealthy: isOnline && queueStatus.failedCount === 0 && !syncError
  };

  return (
    <OfflineContext.Provider value={contextValue}>
      {children}
    </OfflineContext.Provider>
  );
}

// Hook to use offline context
export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
}

// Hook to queue operations when offline
export function useOfflineQueue() {
  const { isOffline, pendingCount } = useOffline();
  
  const queueSale = useCallback(async (saleData: any) => {
    const { salesQueue } = await import('../utils/offlineQueue');
    return await salesQueue.addPendingSale(saleData);
  }, []);
  
  const queueProduct = useCallback(async (productData: any) => {
    const { productsQueue } = await import('../utils/offlineQueue');
    return await productsQueue.addPendingProduct(productData);
  }, []);
  
  const queueService = useCallback(async (serviceData: any) => {
    const { servicesQueue } = await import('../utils/offlineQueue');
    return await servicesQueue.addPendingService(serviceData);
  }, []);

  return {
    isOffline,
    pendingCount,
    queueSale,
    queueProduct,
    queueService
  };
}

export default OfflineProvider;
