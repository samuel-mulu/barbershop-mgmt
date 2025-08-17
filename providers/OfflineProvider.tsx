'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { syncOperations } from '../utils/offlineQueue';
import queueOperations from '../utils/offlineQueue';
import { localforageUtils, queueOperations as baseQueueOps } from '../utils/localforageClient';

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
