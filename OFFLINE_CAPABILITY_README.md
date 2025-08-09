# Offline Capability System for Barbershop Management

A comprehensive offline-first solution that allows the barbershop management system to work seamlessly when internet connection is unavailable. All operations are queued locally and automatically synced when connection is restored.

## 🚀 Features

- **Automatic Connection Monitoring**: Hidden 2-second heartbeat checks
- **Offline Queue Management**: LocalForage-based storage for pending operations
- **Background Sync**: Auto-sync when connection is restored
- **Visual Feedback**: Offline banners and status indicators
- **Graceful Degradation**: App works normally offline, syncs when online
- **Drop-in Integration**: Minimal changes to existing codebase

## 📁 File Structure

```
├── app/api/ping/route.ts                    # Backend health check endpoint
├── utils/
│   ├── localforageClient.ts                # LocalForage wrapper for storage
│   └── offlineQueue.ts                     # Queue management operations
├── hooks/
│   └── useConnectionStatus.tsx             # Connection monitoring hook
├── providers/
│   └── OfflineProvider.tsx                 # Main offline state provider
├── components/
│   └── OfflineBanner.tsx                   # User feedback components
└── README.md                               # This file
```

## 🛠️ Installation & Setup

### 1. Install Dependencies

```bash
npm install localforage
# or
yarn add localforage
```

### 2. Add Type Definitions (if using TypeScript)

```bash
npm install --save-dev @types/localforage
```

### 3. Integration Steps

#### A. Wrap Your Admin Dashboard

```tsx
// app/dashboard/admin/page.tsx
import OfflineProvider from "@/providers/OfflineProvider";
import OfflineBanner, { OfflineIndicator } from "@/components/OfflineBanner";

export default function AdminDashboard() {
  return (
    <OfflineProvider 
      autoSync={true}
      syncOnMount={true}
      enableLogging={true}
    >
      <div className="min-h-screen">
        <OfflineBanner 
          position="top"
          showWhenOnline={false}
          showSyncStatus={true}
        />
        
        {/* Your existing dashboard content */}
        <div className="your-content">
          {/* Add offline indicator to header */}
          <OfflineIndicator className="text-sm" />
        </div>
      </div>
    </OfflineProvider>
  );
}
```

#### B. Update Your Components with Offline Support

```tsx
// app/components/SalesManagement.tsx
import { useOfflineQueue } from "../providers/OfflineProvider";

export default function SalesManagement() {
  const { isOffline, queueSale } = useOfflineQueue();

  const handleSubmit = async (formData) => {
    if (isOffline) {
      // Queue operation for later sync
      await queueSale(formData);
      return;
    }
    
    // Normal online submission
    // ... your existing code
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form content */}
      
      <button 
        type="submit"
        className={isOffline ? 'offline-style' : 'online-style'}
      >
        {isOffline ? 'Save Offline' : 'Submit'}
      </button>
      
      {isOffline && (
        <div className="offline-notice">
          You are offline. Data will sync when connection is restored.
        </div>
      )}
    </form>
  );
}
```

## 🔧 Configuration Options

### OfflineProvider Props

```tsx
interface OfflineProviderProps {
  autoSync?: boolean;        // Auto sync when coming online (default: true)
  syncOnMount?: boolean;     // Sync pending operations on mount (default: true)
  enableLogging?: boolean;   // Enable console logging (default: true)
}
```

### Connection Status Options

```tsx
interface UseConnectionStatusOptions {
  checkInterval?: number;    // Check interval in ms (default: 2000)
  timeout?: number;         // Request timeout in ms (default: 1500)
  enableHeartbeat?: boolean; // Enable heartbeat (default: true)
  pingEndpoint?: string;    // Ping endpoint (default: '/api/ping')
}
```

### OfflineBanner Options

```tsx
interface OfflineBannerProps {
  position?: 'top' | 'bottom';     // Banner position (default: 'top')
  showWhenOnline?: boolean;        // Show when online (default: false)
  showSyncStatus?: boolean;        // Show sync details (default: true)
  dismissible?: boolean;           // Allow dismissing (default: false)
}
```

## 📊 API Reference

### Queue Operations

```tsx
// Sales queue
await salesQueue.addPendingSale(saleData);
await salesQueue.getPendingSales();
await salesQueue.updateSaleStatus(id, status);
await salesQueue.removeSaleById(id);

// Products queue
await productsQueue.addPendingProduct(productData);
await productsQueue.getPendingProducts();

// Services queue
await servicesQueue.addPendingService(serviceData);
await servicesQueue.getPendingServices();

// Sync operations
await syncOperations.syncAllOperations();
const status = await syncOperations.getSyncStatus();
```

### Hooks

```tsx
// Connection status
const {
  isOnline,
  isOffline,
  isChecking,
  forceCheck
} = useConnectionStatus();

// Offline queue
const {
  isOffline,
  pendingCount,
  queueSale,
  queueProduct,
  queueService
} = useOfflineQueue();

// Full offline context
const {
  isOnline,
  pendingCount,
  isSyncing,
  forceSync,
  hasUnsyncedData
} = useOffline();
```

## 🧪 Testing

### Local Development Testing

1. **Test Offline Functionality**:
   ```bash
   # Start your development server
   npm run dev
   
   # Open browser dev tools
   # Go to Network tab
   # Check "Offline" to simulate offline mode
   
   # Try creating sales, products, etc.
   # Check console for offline queue logs
   
   # Uncheck "Offline" to restore connection
   # Watch automatic sync in console
   ```

2. **Test Connection Monitoring**:
   ```bash
   # Monitor connection status in console
   # Should see heartbeat checks every 2 seconds
   # Look for "🔍 [CONNECTION]" logs
   ```

3. **Test Queue Management**:
   ```javascript
   // Open browser console and test queue operations
   import('./utils/offlineQueue').then(module => {
     const { queueOperations } = module;
     
     // Check queue status
     queueOperations.getAll().then(console.log);
     
     // Check storage info
     import('./utils/localforageClient').then(client => {
       client.localforageUtils.getStorageInfo().then(console.log);
     });
   });
   ```

### Production Testing on Render

1. **Deploy with Offline Support**:
   ```bash
   # Build and deploy normally
   npm run build
   
   # Offline features work automatically in production
   ```

2. **Test Real Network Issues**:
   - Use mobile device with intermittent connection
   - Use browser dev tools to throttle network
   - Test on slow/unstable connections

### Integration Testing Steps

1. **Test Offline Sales Recording**:
   - [ ] Go offline (network tab or real disconnect)
   - [ ] Record a product sale
   - [ ] Record a withdrawal
   - [ ] Check that operations are queued
   - [ ] Go online
   - [ ] Verify automatic sync
   - [ ] Check that data appears in backend/history

2. **Test Offline Product Management**:
   - [ ] Go offline
   - [ ] Add new products
   - [ ] Check local queue
   - [ ] Go online
   - [ ] Verify products sync to server

3. **Test Connection Recovery**:
   - [ ] Start online
   - [ ] Go offline
   - [ ] Perform several operations
   - [ ] Go online
   - [ ] Verify all operations sync
   - [ ] Check for duplicate entries

4. **Test Error Handling**:
   - [ ] Queue operations while offline
   - [ ] Go online but simulate server errors
   - [ ] Check retry logic (max 3 retries)
   - [ ] Verify failed operations are marked correctly

## 🐛 Troubleshooting

### Common Issues

1. **Queue Not Working**:
   ```javascript
   // Check if LocalForage is initialized
   import('./utils/localforageClient').then(client => {
     client.localforageUtils.initialize().then(success => {
       console.log('LocalForage initialized:', success);
     });
   });
   ```

2. **Sync Not Triggering**:
   - Check network connectivity
   - Verify ping endpoint is accessible
   - Check console for sync errors
   - Ensure auth tokens are valid

3. **Storage Issues**:
   ```javascript
   // Clear storage if needed
   import('./utils/localforageClient').then(client => {
     client.queueOperations.clear();
     client.cacheOperations.clear();
   });
   ```

4. **Connection Status Not Updating**:
   - Check if document visibility API is supported
   - Verify ping endpoint returns correct response
   - Check for CORS issues

### Debug Information

```javascript
// Get complete offline status
import('./providers/OfflineProvider').then(module => {
  // Use the useOffline hook in a component to get status
});

// Get storage information
import('./utils/localforageClient').then(client => {
  client.localforageUtils.getStorageInfo().then(info => {
    console.log('Storage Info:', info);
  });
});

// Get queue summary
import('./utils/offlineQueue').then(module => {
  module.default.getQueueSummary().then(summary => {
    console.log('Queue Summary:', summary);
  });
});
```

## 🔒 Security Considerations

1. **Authentication**: 
   - JWT tokens are included in sync requests
   - Cookies are sent with `credentials: 'include'`
   - Failed auth causes queue items to retry

2. **Data Validation**:
   - All queued data is validated on sync
   - Server-side validation prevents invalid data
   - Failed validation marks operations as failed

3. **Storage Security**:
   - Data stored in browser's IndexedDB
   - No sensitive data is cached
   - Queue is cleared after successful sync

## 📈 Performance Considerations

1. **Heartbeat Frequency**: 
   - 2-second intervals when tab is active
   - Paused when tab is hidden
   - Abortable requests prevent overlap

2. **Storage Efficiency**:
   - Only operation data is stored
   - Cache has TTL (24 hours default)
   - Failed operations are retried max 3 times

3. **Sync Strategy**:
   - Operations synced one by one
   - 100ms delay between operations
   - Prevents server overload

## 🎯 Best Practices

1. **Component Integration**:
   - Wrap only necessary pages with OfflineProvider
   - Use context hooks for offline state
   - Provide clear offline feedback

2. **Error Handling**:
   - Always handle offline scenarios
   - Provide fallback to offline queue
   - Show appropriate user messages

3. **Testing**:
   - Test offline scenarios regularly
   - Verify sync behavior
   - Monitor queue performance

4. **Monitoring**:
   - Enable logging in development
   - Monitor sync success rates
   - Track queue growth

---

## 🚀 Ready to Use!

Your offline capability system is now ready. The system will:

1. ✅ Monitor connection every 2 seconds
2. ✅ Queue operations when offline
3. ✅ Show visual feedback to users
4. ✅ Auto-sync when connection returns
5. ✅ Handle errors gracefully
6. ✅ Work seamlessly in production

**Note**: This is a drop-in solution that requires minimal changes to your existing codebase. The offline functionality works transparently - your app continues to work normally, with the added benefit of offline capability.
