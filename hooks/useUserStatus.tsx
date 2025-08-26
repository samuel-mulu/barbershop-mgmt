"use client";
import { useEffect, useRef } from 'react';

export function useUserStatus() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkUserStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 403) {
        const data = await response.json();
        if (data.status === 'deactivated' || data.status === 'suspended') {
          // Clear tokens and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('branchId');
          
          const errorParam = data.status === 'deactivated' ? 'deactivated' : 'suspended';
          window.location.href = `/login?error=${errorParam}`;
        }
      } else if (response.status === 401) {
        // Token is invalid, logout
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('branchId');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  };

  useEffect(() => {
    // Check immediately
    checkUserStatus();

    // Set up periodic check every 30 seconds
    intervalRef.current = setInterval(checkUserStatus, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { checkUserStatus };
}
