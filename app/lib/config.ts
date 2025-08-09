// Configuration for Next.js full-stack application
export const config = {
  // API base URL - for Next.js full-stack, this points to the same app
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || '',
  
  // Frontend URL
  FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // JWT Secret
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  
  // MongoDB URI for direct database connection
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/barbershop-mgmt',
};

// API endpoints for Next.js API routes
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  
  // Branch endpoints
  BRANCHES: '/api/branches',
  BRANCH_SERVICES: (branchId: string) => `/api/branches/${branchId}/services`,
  
  // Service endpoints
  SERVICES: (branchId: string) => `/api/services/${branchId}`,
  
  // Worker endpoints
  WORKERS: (branchId: string) => `/api/workers?branchId=${branchId}`,
  
  // Appointment endpoints
  APPOINTMENTS: '/api/appointments',
  
  // User endpoints
  USERS: '/api/users',
};

// Helper function to get full API URL for client-side requests
export const getApiUrl = (endpoint: string) => {
  // For Next.js full-stack, use relative URLs when API_BASE_URL is empty
  if (!config.API_BASE_URL) {
    return endpoint;
  }
  return `${config.API_BASE_URL}${endpoint}`;
};

// Helper function to make API requests from client-side
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = getApiUrl(endpoint);
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      defaultOptions.headers = {
        ...defaultOptions.headers,
        'Authorization': `Bearer ${token}`,
      };
    }
  }

  const response = await fetch(url, defaultOptions);
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};
