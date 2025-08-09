import localforage from 'localforage';

// LocalForage configuration for offline data storage
// Used to store pending operations when offline

// Initialize separate stores for different data types
const offlineQueue = localforage.createInstance({
  name: 'barbershop-offline',
  storeName: 'pending_operations',
  description: 'Queue for offline operations waiting to sync'
});

const cacheStore = localforage.createInstance({
  name: 'barbershop-cache',
  storeName: 'cached_data',
  description: 'Cached data for offline viewing'
});

// Types for pending operations
export interface PendingOperation {
  id: string;
  type: 'product_sale' | 'withdrawal' | 'product_add' | 'service_add';
  data: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
}

// Queue Operations
export const queueOperations = {
  // Add a new operation to the queue
  async add(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<string> {
    const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullOperation: PendingOperation = {
      ...operation,
      id,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    };
    
    await offlineQueue.setItem(id, fullOperation);
    console.log('📱 [OFFLINE] Operation queued:', id, operation.type);
    return id;
  },

  // Get all pending operations
  async getAll(): Promise<PendingOperation[]> {
    const operations: PendingOperation[] = [];
    await offlineQueue.iterate((value: PendingOperation) => {
      operations.push(value);
    });
    return operations.sort((a, b) => a.timestamp - b.timestamp);
  },

  // Update operation status
  async updateStatus(id: string, status: PendingOperation['status'], retryCount?: number): Promise<void> {
    const operation = await offlineQueue.getItem<PendingOperation>(id);
    if (operation) {
      operation.status = status;
      if (retryCount !== undefined) {
        operation.retryCount = retryCount;
      }
      await offlineQueue.setItem(id, operation);
      console.log('📱 [OFFLINE] Operation status updated:', id, status);
    }
  },

  // Remove operation from queue
  async remove(id: string): Promise<void> {
    await offlineQueue.removeItem(id);
    console.log('📱 [OFFLINE] Operation removed from queue:', id);
  },

  // Clear all pending operations (use with caution)
  async clear(): Promise<void> {
    await offlineQueue.clear();
    console.log('📱 [OFFLINE] Queue cleared');
  },

  // Get count of pending operations
  async count(): Promise<number> {
    return await offlineQueue.length();
  }
};

// Cache Operations for offline viewing
export const cacheOperations = {
  // Store data for offline viewing
  async set(key: string, data: any, ttl?: number): Promise<void> {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      ttl: ttl || (24 * 60 * 60 * 1000) // Default 24 hours
    };
    await cacheStore.setItem(key, cacheItem);
    console.log('📱 [CACHE] Data cached:', key);
  },

  // Get cached data
  async get(key: string): Promise<any | null> {
    const cacheItem = await cacheStore.getItem<any>(key);
    if (!cacheItem) return null;

    // Check if cache is expired
    if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {
      await cacheStore.removeItem(key);
      console.log('📱 [CACHE] Expired cache removed:', key);
      return null;
    }

    return cacheItem.data;
  },

  // Remove cached data
  async remove(key: string): Promise<void> {
    await cacheStore.removeItem(key);
    console.log('📱 [CACHE] Cache removed:', key);
  },

  // Clear all cache
  async clear(): Promise<void> {
    await cacheStore.clear();
    console.log('📱 [CACHE] All cache cleared');
  }
};

// Utility functions
export const localforageUtils = {
  // Check if running in browser
  isClient: () => typeof window !== 'undefined',

  // Get storage info
  async getStorageInfo() {
    if (!localforageUtils.isClient()) return null;
    
    const queueCount = await queueOperations.count();
    const queueSize = await offlineQueue.length();
    const cacheSize = await cacheStore.length();
    
    return {
      queueCount,
      queueSize,
      cacheSize,
      driver: offlineQueue.driver(),
      cacheDriver: cacheStore.driver()
    };
  },

  // Initialize stores (call on app start)
  async initialize() {
    if (!localforageUtils.isClient()) return;
    
    try {
      // Test if storage is available
      await offlineQueue.setItem('test', 'test');
      await offlineQueue.removeItem('test');
      
      await cacheStore.setItem('test', 'test');
      await cacheStore.removeItem('test');
      
      console.log('📱 [OFFLINE] LocalForage initialized successfully');
      return true;
    } catch (error) {
      console.error('📱 [OFFLINE] LocalForage initialization failed:', error);
      return false;
    }
  }
};

export default {
  queueOperations,
  cacheOperations,
  localforageUtils
};
