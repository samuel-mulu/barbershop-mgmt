'use client';
import React, { useState } from 'react';
import { useOffline } from '../providers/OfflineProvider';
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  X,
  Database
} from 'lucide-react';

// Offline status banner component
// Shows connection status and sync information

export interface OfflineBannerProps {
  position?: 'top' | 'bottom';
  showWhenOnline?: boolean; // Show banner even when online, default false
  showSyncStatus?: boolean; // Show sync status details, default true
  dismissible?: boolean; // Allow dismissing banner, default false
  className?: string;
}

export function OfflineBanner({
  position = 'top',
  showWhenOnline = false,
  showSyncStatus = true,
  dismissible = false,
  className = ''
}: OfflineBannerProps) {
  const {
    isOnline,
    isOffline,
    isChecking,
    isSyncing,
    pendingCount,
    failedCount,
    lastSyncTime,
    syncError,
    hasUnsyncedData,
    forceSync
  } = useOffline();

  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if dismissed
  if (isDismissed) return null;

  // Don't show when online unless explicitly requested
  if (isOnline && !showWhenOnline && !hasUnsyncedData) return null;

  // Get banner status and styling
  const getBannerStatus = () => {
    if (isOffline) {
      return {
        type: 'offline',
        message: 'You are offline',
        description: hasUnsyncedData 
          ? `${pendingCount} operations will sync when connection is restored`
          : 'Changes will be saved locally',
        icon: WifiOff,
        bgColor: 'bg-gradient-to-r from-orange-500 to-red-500',
        textColor: 'text-white'
      };
    }

    if (isSyncing) {
      return {
        type: 'syncing',
        message: 'Syncing data...',
        description: `Uploading ${pendingCount} operations to server`,
        icon: Loader2,
        bgColor: 'bg-gradient-to-r from-blue-500 to-purple-500',
        textColor: 'text-white'
      };
    }

    if (syncError) {
      return {
        type: 'error',
        message: 'Sync failed',
        description: syncError,
        icon: AlertTriangle,
        bgColor: 'bg-gradient-to-r from-red-500 to-pink-500',
        textColor: 'text-white'
      };
    }

    if (hasUnsyncedData) {
      return {
        type: 'pending',
        message: 'Data pending sync',
        description: `${pendingCount} operations waiting to upload`,
        icon: Database,
        bgColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
        textColor: 'text-white'
      };
    }

    if (showWhenOnline) {
      return {
        type: 'online',
        message: 'You are online',
        description: lastSyncTime 
          ? `Last sync: ${lastSyncTime.toLocaleTimeString()}`
          : 'All data is synced',
        icon: CheckCircle,
        bgColor: 'bg-gradient-to-r from-green-500 to-emerald-500',
        textColor: 'text-white'
      };
    }

    return null;
  };

  const status = getBannerStatus();
  if (!status) return null;

  const Icon = status.icon;

  // Handle sync retry
  const handleRetrySync = async () => {
    if (isOnline && !isSyncing) {
      try {
        await forceSync();
      } catch (error) {
        console.error('Manual sync failed:', error);
      }
    }
  };

  return (
    <div 
      className={`
        fixed left-0 right-0 z-50 
        ${position === 'top' ? 'top-0' : 'bottom-0'}
        ${className}
      `}
    >
      <div className={`${status.bgColor} ${status.textColor} px-4 py-3 shadow-lg`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Status Content */}
          <div className="flex items-center space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              {isSyncing || isChecking ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Icon className="w-5 h-5" />
              )}
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm">
                  {status.message}
                </span>
                
                {/* Connection indicator */}
                <div className="flex items-center space-x-1">
                  <Wifi className={`w-3 h-3 ${isOnline ? 'opacity-100' : 'opacity-30'}`} />
                  <span className="text-xs opacity-75">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
              
              {/* Description */}
              <p className="text-xs opacity-90 mt-1">
                {status.description}
              </p>

              {/* Sync status details */}
              {showSyncStatus && hasUnsyncedData && (
                <div className="flex items-center space-x-4 mt-2 text-xs opacity-90">
                  {pendingCount > 0 && (
                    <span className="flex items-center space-x-1">
                      <Database className="w-3 h-3" />
                      <span>{pendingCount} pending</span>
                    </span>
                  )}
                  
                  {failedCount > 0 && (
                    <span className="flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{failedCount} failed</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Retry sync button */}
            {(hasUnsyncedData || syncError) && isOnline && !isSyncing && (
              <button
                onClick={handleRetrySync}
                className="flex items-center space-x-1 px-3 py-1 bg-white bg-opacity-20 rounded-lg text-xs font-medium hover:bg-opacity-30 transition-all duration-200"
                title="Retry sync"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync</span>
              </button>
            )}

            {/* Dismiss button */}
            {dismissible && (
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-200"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact version for minimal UI impact
export function OfflineIndicator({ className = '' }: { className?: string }) {
  const { isOnline, isOffline, isSyncing, pendingCount } = useOffline();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`flex items-center space-x-1 text-xs ${className}`}>
      {isSyncing ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
          <span className="text-blue-600">Syncing...</span>
        </>
      ) : isOffline ? (
        <>
          <WifiOff className="w-3 h-3 text-orange-500" />
          <span className="text-orange-600">Offline</span>
          {pendingCount > 0 && (
            <span className="text-orange-600">({pendingCount})</span>
          )}
        </>
      ) : pendingCount > 0 ? (
        <>
          <Database className="w-3 h-3 text-amber-500" />
          <span className="text-amber-600">{pendingCount} pending</span>
        </>
      ) : null}
    </div>
  );
}

// Mini status dot for very compact displays
export function OfflineStatusDot({ size = 'sm' }: { size?: 'xs' | 'sm' | 'md' }) {
  const { isOnline, isSyncing, hasUnsyncedData } = useOffline();

  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4'
  };

  const getStatusColor = () => {
    if (isSyncing) return 'bg-blue-500 animate-pulse';
    if (!isOnline) return 'bg-red-500';
    if (hasUnsyncedData) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <div 
      className={`${sizeClasses[size]} ${getStatusColor()} rounded-full flex-shrink-0`}
      title={
        isSyncing ? 'Syncing...' :
        !isOnline ? 'Offline' :
        hasUnsyncedData ? 'Data pending sync' :
        'Online'
      }
    />
  );
}

export default OfflineBanner;
