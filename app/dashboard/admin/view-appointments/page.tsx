"use client";
import Link from "next/link";
import { Calendar, ArrowLeft, Plus, X, Tag, AlertTriangle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface Customer {
  id: string;
  description: string;
  addedAt: Date;
  status: 'waiting' | 'in-progress' | 'completed';
}

const STORAGE_KEY = 'customerQueue';

// Load customers immediately from localStorage
const loadCustomersFromStorage = (): Customer[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const savedCustomers = localStorage.getItem(STORAGE_KEY);
    if (savedCustomers) {
      const parsedCustomers = JSON.parse(savedCustomers).map((customer: any) => ({
        ...customer,
        addedAt: new Date(customer.addedAt)
      }));
      return parsedCustomers;
    }
  } catch (error) {
    console.error('Error loading customers from localStorage:', error);
  }
  return [];
};

// Save customers to localStorage with error handling
const saveCustomersToStorage = (customers: Customer[]): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    return null; // No error
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      return 'Storage is full! Please clear some customers to continue.';
    } else {
      return 'Failed to save customers to storage';
    }
  }
};

export default function ViewAppointmentsPage() {
  // Initialize with loaded customers immediately
  const [customers, setCustomers] = useState<Customer[]>(() => loadCustomersFromStorage());
  const [newCustomerDescription, setNewCustomerDescription] = useState('');
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Optimized save function with debouncing
  const saveCustomers = useCallback((newCustomers: Customer[]) => {
    const error = saveCustomersToStorage(newCustomers);
    setStorageWarning(error);
  }, []);

  // Save customers whenever they change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveCustomers(customers);
    }, 100); // Small delay to avoid excessive saves

    return () => clearTimeout(timeoutId);
  }, [customers, saveCustomers]);

  const addCustomer = useCallback(() => {
    if (!newCustomerDescription.trim()) return;

    setIsLoading(true);
    
    const customer: Customer = {
      id: Date.now().toString(),
      description: newCustomerDescription.trim(),
      addedAt: new Date(),
      status: 'waiting'
    };

    setCustomers(prev => [...prev, customer]);
    setNewCustomerDescription('');
    setIsLoading(false);
  }, [newCustomerDescription]);

  const removeCustomer = useCallback((id: string) => {
    setCustomers(prev => prev.filter(customer => customer.id !== id));
  }, []);

  const updateStatus = useCallback((id: string, status: Customer['status']) => {
    setCustomers(prev => prev.map(customer => 
      customer.id === id ? { ...customer, status } : customer
    ));
  }, []);

  const clearAllCustomers = useCallback(() => {
    setCustomers([]);
    localStorage.removeItem(STORAGE_KEY);
    setStorageWarning(null);
  }, []);

  const removeCompletedCustomers = useCallback(() => {
    setCustomers(prev => prev.filter(c => c.status !== 'completed'));
  }, []);

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }, []);

  const getStatusColor = useCallback((status: Customer['status']) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const getStatusText = useCallback((status: Customer['status']) => {
    switch (status) {
      case 'waiting': return '⏳ Waiting';
      case 'in-progress': return '✂️ In Progress';
      case 'completed': return '✅ Completed';
      default: return 'Unknown';
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4">
      <div className="container mx-auto max-w-2xl">
        {/* Storage Warning */}
        {storageWarning && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 text-sm font-medium">{storageWarning}</p>
              {storageWarning.includes('full') && (
                <button
                  onClick={clearAllCustomers}
                  className="text-red-600 text-xs underline hover:text-red-800 mt-1"
                >
                  Clear all customers
                </button>
              )}
            </div>
            <button
              onClick={() => setStorageWarning(null)}
              className="text-red-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <Link href="/dashboard/admin" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-3">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm sm:text-base">Back to Dashboard</span>
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-slate-800">Customer Queue</h1>
                <p className="text-xs sm:text-sm text-slate-600">Add customers by description</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{customers.length}</div>
              <div className="text-xs sm:text-sm text-slate-600">Total</div>
            </div>
          </div>
        </div>

        {/* Add Customer Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="space-y-3 p-3 sm:p-4 bg-slate-50 rounded-lg">
              <div>
              <textarea
                value={newCustomerDescription}
                onChange={(e) => setNewCustomerDescription(e.target.value)}
                placeholder="Red shirt guy, blue hat, wants fade cut, etc..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={addCustomer}
                disabled={!newCustomerDescription.trim() || isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isLoading ? 'Adding...' : 'Add'}
              </button>
              <button
                onClick={() => setNewCustomerDescription('')}
                disabled={isLoading}
                className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Customer List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
          {customers.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 text-sm sm:text-base">No customers in queue</p>
              <p className="text-slate-500 text-xs sm:text-sm">Add your first customer to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {customers.map((customer, index) => (
                <div key={customer.id} className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-600">#{index + 1}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(customer.status)}`}>
                        {getStatusText(customer.status)}
                      </span>
                        </div>
                          <button
                            onClick={() => removeCustomer(customer.id)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Remove customer"
                          >
                      <X className="w-3 h-3" />
                          </button>
                        </div>
                  
                  <p className="text-sm text-slate-800 font-medium mb-2">
                    {customer.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">
                      {formatTime(customer.addedAt)}
                    </span>
                    <select
                      value={customer.status}
                      onChange={(e) => updateStatus(customer.id, e.target.value as Customer['status'])}
                      className="px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="waiting">Waiting</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>

        {/* Quick Actions */}
        {customers.length > 0 && (
          <div className="mt-4 sm:mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex gap-2">
                          <button
                onClick={clearAllCustomers}
                className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                          >
                Clear All
                          </button>
                          <button
                onClick={removeCompletedCustomers}
                className="px-4 py-2 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors font-medium"
                          >
                Remove Completed
                          </button>
            </div>
                </div>
              )}
      </div>
    </div>
  );
} 