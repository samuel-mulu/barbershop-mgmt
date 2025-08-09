'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

// Connection status hook with heartbeat monitoring
// Checks connection every 2 seconds when document is visible
// Uses AbortController for clean cancellation

export interface ConnectionStatus {
  isOnline: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  error: string | null;
}

export interface UseConnectionStatusOptions {
  checkInterval?: number; // milliseconds, default 2000 (2 seconds)
  timeout?: number; // milliseconds, default 1500
  enableHeartbeat?: boolean; // default true
  pingEndpoint?: string; // default '/api/ping'
}

export function useConnectionStatus(options: UseConnectionStatusOptions = {}) {
  const {
    checkInterval = 2000, // 2 seconds
    timeout = 1500, // 1.5 seconds
    enableHeartbeat = true,
    pingEndpoint = '/api/ping'
  } = options;

  // State
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: navigator?.onLine ?? true, // Fallback to navigator.onLine
    isChecking: false,
    lastChecked: null,
    error: null
  });

  // Refs for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isComponentMountedRef = useRef(true);

  // Check connection status
  const checkConnection = useCallback(async (): Promise<boolean> => {
    // Don't check if component is unmounted or heartbeat is disabled
    if (!isComponentMountedRef.current || !enableHeartbeat) {
      return status.isOnline;
    }

    // Don't check if document is not visible (tab not active)
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return status.isOnline;
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setStatus(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      console.log('🔍 [CONNECTION] Checking connection...');
      
      const response = await fetch(pingEndpoint, {
        method: 'GET',
        signal: abortControllerRef.current.signal,
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      // Check if request was aborted
      if (abortControllerRef.current.signal.aborted) {
        return status.isOnline;
      }

      const isOnline = response.ok;
      const lastChecked = new Date();

      if (isComponentMountedRef.current) {
        setStatus(prev => ({
          ...prev,
          isOnline,
          isChecking: false,
          lastChecked,
          error: null
        }));
      }

      console.log(`🔍 [CONNECTION] Status: ${isOnline ? '✅ Online' : '❌ Offline'}`);
      return isOnline;

    } catch (error: any) {
      // Don't update state if request was aborted or component unmounted
      if (error.name === 'AbortError' || !isComponentMountedRef.current) {
        return status.isOnline;
      }

      console.log('❌ [CONNECTION] Check failed:', error.message);
      
      if (isComponentMountedRef.current) {
        setStatus(prev => ({
          ...prev,
          isOnline: false,
          isChecking: false,
          lastChecked: new Date(),
          error: error.message || 'Connection check failed'
        }));
      }

      return false;
    }
  }, [enableHeartbeat, pingEndpoint, status.isOnline]);

  // Manual connection check
  const forceCheck = useCallback(async () => {
    return await checkConnection();
  }, [checkConnection]);

  // Set up interval for heartbeat checks
  useEffect(() => {
    if (!enableHeartbeat) return;

    // Initial check
    checkConnection();

    // Set up interval
    intervalRef.current = setInterval(() => {
      checkConnection();
    }, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [checkConnection, checkInterval, enableHeartbeat]);

  // Listen to browser online/offline events as fallback
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 [CONNECTION] Browser online event');
      if (isComponentMountedRef.current) {
        setStatus(prev => ({ ...prev, isOnline: true, error: null }));
        // Force check to confirm
        setTimeout(checkConnection, 100);
      }
    };

    const handleOffline = () => {
      console.log('🌐 [CONNECTION] Browser offline event');
      if (isComponentMountedRef.current) {
        setStatus(prev => ({ 
          ...prev, 
          isOnline: false, 
          error: 'Browser detected offline',
          lastChecked: new Date()
        }));
      }
    };

    // Listen to visibility change to pause/resume checks
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ [CONNECTION] Tab became visible, checking connection...');
        setTimeout(checkConnection, 100);
      } else {
        console.log('👁️ [CONNECTION] Tab hidden, pausing checks...');
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [checkConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isComponentMountedRef.current = false;
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...status,
    forceCheck,
    
    // Helper methods
    isOffline: !status.isOnline,
    timeSinceLastCheck: status.lastChecked 
      ? Date.now() - status.lastChecked.getTime() 
      : null,
    
    // Status indicators
    isHealthy: status.isOnline && !status.error,
    isStale: status.lastChecked 
      ? (Date.now() - status.lastChecked.getTime()) > (checkInterval * 2)
      : true
  };
}

// React component wrapper for easier usage
export interface ConnectionStatusProviderProps {
  children: React.ReactNode;
  options?: UseConnectionStatusOptions;
}

export function ConnectionStatusProvider({ 
  children, 
  options 
}: ConnectionStatusProviderProps) {
  const connectionStatus = useConnectionStatus(options);
  
  return (
    <ConnectionStatusContext.Provider value={connectionStatus}>
      {children}
    </ConnectionStatusContext.Provider>
  );
}

// Context for sharing connection status
import { createContext, useContext } from 'react';

const ConnectionStatusContext = createContext<ReturnType<typeof useConnectionStatus> | null>(null);

export function useConnectionContext() {
  const context = useContext(ConnectionStatusContext);
  if (!context) {
    throw new Error('useConnectionContext must be used within ConnectionStatusProvider');
  }
  return context;
}

export default useConnectionStatus;
