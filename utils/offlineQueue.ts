import { queueOperations, PendingOperation } from './localforageClient';

// High-level queue management for different operation types
// Handles specific business logic for each operation type

export interface SaleData {
  productSales?: Array<{
    productId: string;
    soldQuantity: number;
  }>;
  reason?: string;
  amount?: number;
  type: 'product_sale' | 'withdrawal';
}

export interface ProductData {
  name: string;
  quantity: number;
  quantityType: string;
  pricePerUnit: number;
}

export interface ServiceData {
  serviceOperations: Array<{
    name: string;
    price: number;
    workerName: string;
    workerRole: 'barber' | 'washer';
    workerId: string;
    status: string;
  }>;
}

// Sales Queue Operations
export const salesQueue = {
  // Add pending sale (product sale or withdrawal)
  async addPendingSale(saleData: SaleData): Promise<string> {
    const endpoint = saleData.type === 'product_sale' ? '/api/product-sales' : '/api/withdrawals';
    const data = saleData.type === 'product_sale' 
      ? { productSales: saleData.productSales }
      : { reason: saleData.reason, amount: saleData.amount };

    return await queueOperations.add({
      type: saleData.type,
      data,
      endpoint,
      method: 'POST'
    });
  },

  // Get all pending sales
  async getPendingSales(): Promise<PendingOperation[]> {
    const allOperations = await queueOperations.getAll();
    return allOperations.filter(op => 
      op.type === 'product_sale' || op.type === 'withdrawal'
    );
  },

  // Update sale status
  async updateSaleStatus(id: string, status: PendingOperation['status']): Promise<void> {
    await queueOperations.updateStatus(id, status);
  },

  // Remove sale by ID
  async removeSaleById(id: string): Promise<void> {
    await queueOperations.remove(id);
  }
};

// Products Queue Operations
export const productsQueue = {
  // Add pending product
  async addPendingProduct(productData: ProductData): Promise<string> {
    return await queueOperations.add({
      type: 'product_add',
      data: productData,
      endpoint: '/api/products',
      method: 'POST'
    });
  },

  // Get all pending products
  async getPendingProducts(): Promise<PendingOperation[]> {
    const allOperations = await queueOperations.getAll();
    return allOperations.filter(op => op.type === 'product_add');
  }
};

// Services Queue Operations
export const servicesQueue = {
  // Add pending service operations
  async addPendingService(serviceData: ServiceData): Promise<string> {
    return await queueOperations.add({
      type: 'service_add',
      data: serviceData,
      endpoint: '/api/admin/service-operations',
      method: 'POST'
    });
  },

  // Get all pending services
  async getPendingServices(): Promise<PendingOperation[]> {
    const allOperations = await queueOperations.getAll();
    return allOperations.filter(op => op.type === 'service_add');
  }
};

// Sync Operations
export const syncOperations = {
  // Get auth headers for requests
  getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    // Check for JWT token in localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  },

  // Sync a single operation to the server
  async syncOperation(operation: PendingOperation): Promise<boolean> {
    try {
      console.log('🔄 [SYNC] Syncing operation:', operation.id, operation.type);
      
      // Update status to syncing
      await queueOperations.updateStatus(operation.id, 'syncing');

      const response = await fetch(operation.endpoint, {
        method: operation.method,
        headers: syncOperations.getAuthHeaders(),
        credentials: 'include', // Include cookies for session auth
        body: JSON.stringify(operation.data)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Check if backend confirms success
        if (result.success !== false) {
          console.log('✅ [SYNC] Operation synced successfully:', operation.id);
          await queueOperations.remove(operation.id);
          return true;
        } else {
          throw new Error(result.error || 'Backend rejected operation');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ [SYNC] Failed to sync operation:', operation.id, error);
      
      // Increment retry count
      const newRetryCount = operation.retryCount + 1;
      
      // Mark as failed if too many retries (max 3)
      if (newRetryCount >= 3) {
        await queueOperations.updateStatus(operation.id, 'failed', newRetryCount);
        console.error('❌ [SYNC] Operation failed permanently:', operation.id);
      } else {
        await queueOperations.updateStatus(operation.id, 'pending', newRetryCount);
        console.log('🔄 [SYNC] Operation will retry:', operation.id, `(${newRetryCount}/3)`);
      }
      
      return false;
    }
  },

  // Sync all pending operations
  async syncAllOperations(): Promise<{ synced: number; failed: number; total: number }> {
    const pendingOperations = await queueOperations.getAll();
    const operationsToSync = pendingOperations.filter(op => 
      op.status === 'pending' && op.retryCount < 3
    );

    let synced = 0;
    let failed = 0;

    console.log(`🔄 [SYNC] Starting sync of ${operationsToSync.length} operations`);

    // Sync operations one by one to avoid overwhelming the server
    for (const operation of operationsToSync) {
      const success = await syncOperations.syncOperation(operation);
      if (success) {
        synced++;
      } else {
        failed++;
      }
      
      // Add small delay between operations
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const total = operationsToSync.length;
    console.log(`✅ [SYNC] Sync complete: ${synced}/${total} successful, ${failed} failed`);

    return { synced, failed, total };
  },

  // Get sync status summary
  async getSyncStatus(): Promise<{
    pendingCount: number;
    syncingCount: number;
    failedCount: number;
    totalCount: number;
  }> {
    const allOperations = await queueOperations.getAll();
    
    return {
      pendingCount: allOperations.filter(op => op.status === 'pending').length,
      syncingCount: allOperations.filter(op => op.status === 'syncing').length,
      failedCount: allOperations.filter(op => op.status === 'failed').length,
      totalCount: allOperations.length
    };
  }
};

// Main export with all queue operations
export default {
  salesQueue,
  productsQueue,
  servicesQueue,
  syncOperations,
  
  // Convenience methods
  async clearAllQueues(): Promise<void> {
    await queueOperations.clear();
    console.log('🗑️ [QUEUE] All queues cleared');
  },

  async getQueueSummary() {
    const sales = await salesQueue.getPendingSales();
    const products = await productsQueue.getPendingProducts();
    const services = await servicesQueue.getPendingServices();
    const syncStatus = await syncOperations.getSyncStatus();

    return {
      sales: sales.length,
      products: products.length,
      services: services.length,
      ...syncStatus
    };
  }
};
