"use client";
import Link from "next/link";
import useSWR from "swr";
import { useState, useEffect } from "react";
import { getUserFromLocalStorage } from "@/utils/auth";
import EthiopianDate from "@/components/EthiopianDate";
import Modal from "@/components/ui/modal";
import {
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  BarChart3,
  LogOut,
  Package,
  ShoppingCart,
  Menu,
  X,
  WifiOff
} from "lucide-react";
import ProductManagement from "@/components/ProductManagement";
import SalesManagement from "@/components/SalesManagement";
import OfflineProvider, { useOfflineQueue } from "../../../providers/OfflineProvider";
import OfflineBanner, { OfflineIndicator } from "../../../components/OfflineBanner";

const fetcher = (url: string) => {
  const token = localStorage.getItem("token");
  console.log("🔍 Fetcher called for URL:", url);
  console.log("🔍 Token from localStorage:", token ? "Token exists" : "No token found");
  
  if (!token) {
    console.error("❌ No token found in localStorage");
    throw new Error("No authentication token found");
  }
  
  return fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  }).then(res => {
    console.log("🔍 Response status:", res.status, "for URL:", url);
    if (!res.ok) {
      console.error("❌ API request failed:", res.status, res.statusText);
      throw new Error(`API request failed: ${res.status}`);
    }
    return res.json();
  });
};

interface Service {
  name: string;
  barberPrice?: number;
  washerPrice?: number;
}

interface Barber {
  _id: string;
  name: string;
  role: string;
  branchId: string;
}

interface Washer {
  _id: string;
  name: string;
  role: string;
  branchId: string;
}

interface SelectedService {
  serviceId: string;
  serviceName: string;
  barberPrice?: number;
  washerPrice?: number;
  barberId: string;
  barberName: string;
  washerId?: string;
  washerName?: string;
}

interface ServiceOperation {
  _id?: string;
  name: string;
  price: number;
  status: string;
  createdAt: string;
  workerName: string;
  workerRole: string;
  workerId: string;
  otherWorker?: {
    id: string;
    role: string;
    price: number;
  } | null;
}

interface WorkerServiceOperation {
  name: string;
  barberPrice?: number;
  washerPrice?: number;
  workerId?: string;
  washerId?: string;
  status: string;
}

interface AdminServiceOperation {
  name: string;
  price: number;
  workerName: string;
  workerRole: "barber" | "washer";
  workerId: string;
  status: string;
}

// Internal component that has access to offline context
function AdminDashboardContent() {
  const [user, setUser] = useState<{ _id: string; name: string; role: string; branchId: string } | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [branchName, setBranchName] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedBarberId, setSelectedBarberId] = useState<string>("");
  const [selectedWasherId, setSelectedWasherId] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [showHistory] = useState<boolean>(false);
  
  // Toggle states for Add Product and Record Sale
  const [activeSection, setActiveSection] = useState<'none' | 'addProduct' | 'recordSale' | 'history'>('none');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  
  // Summary data states
  const [productsSummary, setProductsSummary] = useState<{ count: number; totalValue: number }>({ count: 0, totalValue: 0 });
  const [salesSummary, setSalesSummary] = useState<{ productSales: number; withdrawals: number; totalRevenue: number }>({ productSales: 0, withdrawals: 0, totalRevenue: 0 });
  
  // Modal state
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info"
  });

  // Get user data and branchId on component mount
  useEffect(() => {
    const userData = getUserFromLocalStorage();
    if (userData) {
      setUser(userData);
      setBranchId(userData.branchId);
    }
  }, []);

  // Fetch services, barbers, washers, and service operations
  const { data: services = [] } = useSWR<Service[]>(
    user?.branchId ? `/api/services/${user.branchId}` : null,
    fetcher
  );

  const { data: barbers = [] } = useSWR<Barber[]>(
    user?.branchId ? `/api/workers?branchId=${user.branchId}&role=barber` : null,
    fetcher
  );

  const { data: washers = [] } = useSWR<Washer[]>(
    user?.branchId ? `/api/workers?branchId=${user.branchId}&role=washer` : null,
    fetcher
  );

  const { mutate: mutateOperations } = useSWR<ServiceOperation[]>(
    user?._id ? `/api/users/service-operations?userId=${user._id}` : null,
    fetcher
  );

  // Ensure serviceOperations is always an array
  // const safeServiceOperations = Array.isArray(serviceOperations) ? serviceOperations : [];
  
  // Filter workers by role
  const barbersList = barbers.filter((worker: Barber) => worker.role === "barber");
  const washersList = washers.filter((worker: Washer) => worker.role === "washer");

  // Update branch name when branch data is fetched
  useEffect(() => {
    if (user?.branchId && user.branchId) {
      setBranchId(user.branchId);
    }
  }, [user?.branchId]);

  // Fetch branch information
  const { data: branchData } = useSWR(
    branchId ? `/api/branches/${branchId}` : null,
    fetcher
  );

  // Update branch name when branch data is fetched
  useEffect(() => {
    if (branchData && branchData.name) {
      setBranchName(branchData.name);
    }
  }, [branchData]);

  // Fetch admin service operations history for the current admin
  const { data: serviceOperationsHistory = [], isLoading: loadingHistory, error: historyError } = useSWR(
    showHistory ? `/api/admin/service-operations` : null,
    fetcher
  );

  // Ensure serviceOperations is always an array and filter to only pending operations
  const safeServiceOperationsHistory = Array.isArray(serviceOperationsHistory) ? serviceOperationsHistory.filter(op => op.status === "pending") : [];
  
  // Filter workers by role
  // const barbersHistory = barbersList.filter((worker: Barber) => worker.role === "barber");
  // const washersHistory = washersList.filter((worker: Washer) => worker.role === "washer");

  const handleAddService = () => {
    if (!selectedServiceId || (!selectedBarberId && !selectedWasherId)) return;

    const service = getSelectedService();
    if (!service) return;

    const newService: SelectedService = {
      serviceId: selectedServiceId,
      serviceName: selectedServiceId,
      barberId: selectedBarberId || "",
      barberName: selectedBarberId ? barbersList.find(b => b._id === selectedBarberId)?.name || "" : "",
      washerId: selectedWasherId,
      washerName: selectedWasherId ? washersList.find(w => w._id === selectedWasherId)?.name || "" : "",
    };

    if (service.barberPrice && selectedBarberId) {
      newService.barberPrice = service.barberPrice;
    }

    if (service.washerPrice && selectedWasherId) {
      newService.washerPrice = service.washerPrice;
    }

    setSelectedServices([...selectedServices, newService]);
    setSelectedServiceId("");
    setSelectedBarberId("");
    setSelectedWasherId("");
  };

  // const handleRemoveService = (index: number) => {
  //   setSelectedServices(selectedServices.filter((_, i) => i !== index));
  // };

  // Helper functions for service selection
  const getSelectedService = (): Service | undefined => {
    return services.find((s: Service) => s.name === selectedServiceId);
  };

  const shouldShowBarberDropdown = (): boolean => {
    const service = getSelectedService();
    return service ? !!service.barberPrice : false;
  };

  const shouldShowWasherDropdown = (): boolean => {
    const service = getSelectedService();
    return service ? !!service.washerPrice : false;
  };

  const isAddButtonDisabled = (): boolean => {
    if (!selectedServiceId) return true;
    
    const service = getSelectedService();
    if (!service) return true;

    if (service.barberPrice && !selectedBarberId) return true;
    if (service.washerPrice && !selectedWasherId) return true;
    if (!selectedBarberId && !selectedWasherId) return true;

    return false;
  };

  // Save service operations to User collection
  const handleFinish = async () => {
    if (selectedServices.length === 0) return;
    
    setSaving(true);
    try {
      // Prepare service data for offline queue
      const serviceData = {
        serviceOperations: selectedServices.map(service => {
          const operations = [];
          
          if (service.barberId && service.barberPrice && service.barberName) {
            operations.push({
              name: service.serviceName,
              price: service.barberPrice,
              workerName: service.barberName,
              workerRole: "barber" as const,
              workerId: service.barberId,
              status: "pending"
            });
          }
          
          if (service.washerId && service.washerPrice && service.washerName) {
            operations.push({
              name: service.serviceName,
              price: service.washerPrice,
              workerName: service.washerName,
              workerRole: "washer" as const,
              workerId: service.washerId,
              status: "pending"
            });
          }
          
          return operations;
        }).flat()
      };

      // If offline, queue the operation
      if (isOffline) {
        console.log('📱 [OFFLINE] Queueing service operations:', serviceData);
        await queueService(serviceData);
        
        // Reset form
        setSelectedServices([]);
        mutateOperations();
        
        console.log('✅ [OFFLINE] Service operations queued successfully');
        setModal({
          isOpen: true,
          title: "Saved Offline",
          message: "Service operations saved locally. They will sync when connection is restored.",
          type: "success"
        });
        return;
      }

      // Online - proceed with normal submission
      // Convert selected services to service operations for workers
      const workerServiceOperations: WorkerServiceOperation[] = selectedServices.map(service => {
        const operationData: WorkerServiceOperation = {
          name: service.serviceName,
          status: "pending"
        };
        
        if (service.barberId && service.barberPrice) {
          operationData.barberPrice = service.barberPrice;
          operationData.workerId = service.barberId;
        }
        
        if (service.washerId && service.washerPrice) {
          operationData.washerPrice = service.washerPrice;
          operationData.washerId = service.washerId;
        }
        
        return operationData;
      });

      // Convert selected services to admin service operations
      const adminServiceOperations: AdminServiceOperation[] = [];
      
      selectedServices.forEach(service => {
        if (service.barberId && service.barberPrice && service.barberName) {
          adminServiceOperations.push({
            name: service.serviceName,
            price: service.barberPrice,
            workerName: service.barberName,
            workerRole: "barber",
            workerId: service.barberId,
            status: "pending"
          });
        }
      });
      
      selectedServices.forEach(service => {
        if (service.washerId && service.washerPrice && service.washerName) {
          adminServiceOperations.push({
            name: service.serviceName,
            price: service.washerPrice,
            workerName: service.washerName,
            workerRole: "washer",
            workerId: service.washerId,
            status: "pending"
          });
        }
      });

      const token = localStorage.getItem("token");

      const workerResponse = await fetch("/api/users/service-operations", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ serviceOperations: workerServiceOperations }),
      });

      const adminResponse = await fetch("/api/admin/service-operations", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ serviceOperations: adminServiceOperations }),
      });

      if (workerResponse.ok && adminResponse.ok) {
        setSelectedServices([]);
        mutateOperations();
        console.log("Setting success modal");
        setModal({
          isOpen: true,
          title: "Success",
          message: "Services saved successfully!",
          type: "success"
        });
      } else {
        throw new Error("Failed to save services");
      }
    } catch (error: unknown) {
      console.error("Error saving services:", error instanceof Error ? error.message : "Unknown error");
      setModal({
        isOpen: true,
        title: "Error",
        message: "Error saving services. Please try again.",
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleHistory = () => {
    setActiveSection(activeSection === 'history' ? 'none' : 'history');
  };

  const toggleAddProduct = () => {
    setActiveSection(activeSection === 'addProduct' ? 'none' : 'addProduct');
  };

  const toggleRecordSale = () => {
    setActiveSection(activeSection === 'recordSale' ? 'none' : 'recordSale');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("branchId");
    window.location.href = "/login";
  };

  const closeModal = () => {
    console.log("Closing modal");
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  // Show loading if user data is not loaded yet
  if (!user || !branchId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="container">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Get offline queue functionality
  const { isOffline, queueService } = useOfflineQueue();

  // Debug logging
  console.log('🔧 [DEBUG] Admin Dashboard - User:', user);
  console.log('🔧 [DEBUG] Admin Dashboard - BranchId:', branchId);
  console.log('🔧 [DEBUG] Offline Status:', isOffline);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <OfflineBanner 
        position="top"
        showWhenOnline={false}
        showSyncStatus={true}
        dismissible={false}
      />
      <div className="flex">
        {/* Sidebar */}
        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <div className="user-info">
              <p className="user-name">Welcome back, {user.name}</p>
              <p className="branch-name">Branch: {branchName || branchId}</p>
            </div>
            <button
              onClick={toggleSidebar}
              className="close-sidebar-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="sidebar-content">
            <button
              onClick={toggleAddProduct}
              className={`sidebar-button ${activeSection === 'addProduct' ? 'active' : ''}`}
            >
              <Package className="w-4 h-4 mb-1" />
              <span>{activeSection === 'addProduct' ? "Hide" : "Add"}</span>
            </button>
            
            <button
              onClick={toggleRecordSale}
              className={`sidebar-button ${activeSection === 'recordSale' ? 'active' : ''}`}
            >
              <ShoppingCart className="w-4 h-4 mb-1" />
              <span>{activeSection === 'recordSale' ? "Hide" : "Sale"}</span>
            </button>
            
            <button
              onClick={toggleHistory}
              className={`sidebar-button ${activeSection === 'history' ? 'active' : ''}`}
            >
              <BarChart3 className="w-4 h-4 mb-1" />
              <span>{activeSection === 'history' ? "Hide" : "History"}</span>
            </button>
            
            <Link href="/dashboard/admin/view-appointments">
              <button className="sidebar-button">
                <Calendar className="w-4 h-4 mb-1" />
                <span>Appointments</span>
              </button>
            </Link>
            
            <button
              onClick={handleLogout}
              className="sidebar-button logout"
            >
              <LogOut className="w-4 h-4 mb-1" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
          {/* Top Bar */}
          <div className="top-bar">
            <button
              onClick={toggleSidebar}
              className="menu-button"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="top-bar-info">
              <p className="welcome-text">Welcome back, {user.name}</p>
              <p className="branch-text">Branch: {branchName || branchId}</p>
            </div>
            <div className="flex items-center space-x-3">
              <OfflineIndicator className="text-sm" />
            </div>
          </div>

        {/* Add Product Section */}
        {activeSection === 'addProduct' && (
          <div className="container mb-6">
            <h2 className="section-title">Add Product</h2>
            
            {/* Summary Cards */}
            <div className="summary-cards-grid">
              <div className="summary-card-small">
                <div className="summary-icon-small bg-green-300">
                  <Package className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="summary-label-small">Total Products</h3>
                  <p className="summary-value-small text-green-600">{productsSummary.count}</p>
                </div>
              </div>
              <div className="summary-card-small">
                <div className="summary-icon-small bg-blue-300">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="summary-label-small">Total Value</h3>
                  <p className="summary-value-small text-blue-600">${productsSummary.totalValue.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <ProductManagement 
              onSuccess={() => {
                setModal({
                  isOpen: true,
                  title: "Success",
                  message: "Product added successfully!",
                  type: "success"
                });
              }}
              onDataChange={(products) => {
                const count = products.length;
                const totalValue = products.reduce((sum, product) => sum + product.totalPrice, 0);
                setProductsSummary({ count, totalValue });
              }}
            />
          </div>
        )}

        {/* Record Sale Section */}
        {activeSection === 'recordSale' && (
          <div className="container mb-6">
            <h2 className="section-title">Record Sale</h2>
            
            {/* Summary Cards */}
            <div className="summary-cards-grid">
              <div className="summary-card-small">
                <div className="summary-icon-small bg-green-300">
                  <ShoppingCart className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="summary-label-small">Product Sales</h3>
                  <p className="summary-value-small text-green-600">{salesSummary.productSales}</p>
                </div>
              </div>
              <div className="summary-card-small">
                <div className="summary-icon-small bg-orange-300">
                  <DollarSign className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h3 className="summary-label-small">Withdrawals</h3>
                  <p className="summary-value-small text-orange-600">{salesSummary.withdrawals}</p>
                </div>
              </div>
              <div className="summary-card-small">
                <div className="summary-icon-small bg-blue-300">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="summary-label-small">Total Revenue</h3>
                  <p className="summary-value-small text-blue-600">${salesSummary.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <SalesManagement 
              onSuccess={() => {
                setModal({
                  isOpen: true,
                  title: "Success",
                  message: "Sale recorded successfully!",
                  type: "success"
                });
              }}
              onDataChange={(productSales, withdrawals) => {
                const productSalesCount = productSales.length;
                const withdrawalsCount = withdrawals.length;
                const totalRevenue = productSales.reduce((sum, sale) => sum + sale.totalSoldMoney, 0);
                setSalesSummary({ productSales: productSalesCount, withdrawals: withdrawalsCount, totalRevenue });
              }}
            />
          </div>
        )}

        {/* History Section */}
        {activeSection === 'history' && (
          <div className="container mb-6">
            <h2 className="section-title">Service Operations History</h2>
            
            {/* Summary Cards */}
            <div className="summary-cards-grid">
              <div className="summary-card-small">
                <div className="summary-icon-small bg-blue-300">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="summary-label-small">ዘተሰረሐ ስራሕ</h3>
                  <p className="summary-value-small text-blue-600">{safeServiceOperationsHistory.length}</p>
                </div>
              </div>
              <div className="summary-card-small">
                <div className="summary-icon-small bg-green-300">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="summary-label-small">ዘይተረከበ ብር</h3>
                  <p className="summary-value-small text-green-600">
                    {safeServiceOperationsHistory.reduce((total, op) => total + (op.price || 0), 0)} ብር
                  </p>
                </div>
              </div>
            </div>

            {loadingHistory ? (
              <div className="loading-state">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-slate-600 mt-2">Loading history...</p>
              </div>
            ) : historyError ? (
              <div className="error-state">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-500">Error loading history</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="retry-button"
                >
                  Retry
                </button>
              </div>
            ) : safeServiceOperationsHistory.length === 0 ? (
              <div className="empty-state">
                <Clock className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500">No service operations found</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Price</th>
                      <th>Worker</th>
                      <th>Role</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeServiceOperationsHistory.map((operation: ServiceOperation, index: number) => (
                      <tr key={operation._id || `operation_${index}_${operation.workerName}_${operation.createdAt}`}>
                        <td className="font-medium">{operation.name || 'N/A'}</td>
                        <td>
                          <span className="price-text">
                            {operation.price || 0}ብር
                          </span>
                        </td>
                        <td className="font-medium">{operation.workerName || 'N/A'}</td>
                        <td>
                          <span className={`role-badge ${operation.workerRole === 'barber' ? 'barber' : 'washer'}`}>
                            {operation.workerRole === 'barber' ? 'ቀምቃሚ' : operation.workerRole === 'washer' ? 'ሓጻቢት' : operation.workerRole || 'N/A'}
                          </span>
                        </td>
                        <td className="text-xs text-slate-500">
                          {operation.createdAt ? (
                            <EthiopianDate dateString={operation.createdAt} showTime={true} showWeekday={false} />
                          ) : (
                            'N/A'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="container">
              <h2 className="section-title">Manage Services</h2>
              
              {/* Service Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Service Dropdown */}
                <div className="form-group">
                  <label className="form-label">Service</label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => {
                      setSelectedServiceId(e.target.value);
                      setSelectedBarberId("");
                      setSelectedWasherId("");
                    }}
                    className="form-select"
                  >
                    <option value="">Select Service</option>
                    {services.map((service: Service, index: number) => (  
                      <option key={`${service.name}_${index}`} value={service.name}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Barber Dropdown */}
                {shouldShowBarberDropdown() && (
                  <div className="form-group">
                    <label className="form-label">
                      Barber {getSelectedService()?.barberPrice ? `(${getSelectedService()?.barberPrice}ብር)` : ''} *
                    </label>
                    <select
                      value={selectedBarberId}
                      onChange={(e) => setSelectedBarberId(e.target.value)}
                      className="form-select"
                    >
                      <option value="">Select Barber</option>
                      {barbersList.map((barber: Barber) => (  
                        <option key={barber._id} value={barber._id}>
                          {barber.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Washer Dropdown */}
                {shouldShowWasherDropdown() && (
                  <div className="form-group">
                    <label className="form-label">
                      Washer {getSelectedService()?.washerPrice ? `(${getSelectedService()?.washerPrice}ብር)` : ''} *
                    </label>
                    <select
                      value={selectedWasherId}
                      onChange={(e) => setSelectedWasherId(e.target.value)}
                      className="form-select"
                    >
                      <option value="">Select Washer</option>
                      {washersList.map((washer: Washer) => (  
                        <option key={washer._id} value={washer._id}>
                          {washer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Add Service Button */}
              <button
                onClick={handleAddService}
                disabled={isAddButtonDisabled()}
                className="add-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </button>


            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="container sticky top-4">
              <h3 className="section-title">Summary</h3>
              
              {selectedServices.length === 0 ? (
                <div className="empty-state">
                  <Users className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-500">No services selected</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedServices.map((service, index) => (
                    <div key={index} className="service-card">
                      <div className="font-medium text-sm">{service.serviceName}</div>
                      <div className="text-xs text-slate-600">
                        {(() => {
                          let totalPrice = 0;
                          const priceBreakdown = [];
                          
                          if (service.barberPrice) {
                            totalPrice += service.barberPrice;
                            priceBreakdown.push(`Barber: $${service.barberPrice}`);
                          }
                          
                          if (service.washerPrice) {
                            totalPrice += service.washerPrice;
                            priceBreakdown.push(`Washer: $${service.washerPrice}`);
                          }
                          
                          return totalPrice > 0 ? 
                            `$${totalPrice} (${priceBreakdown.join(', ')})` : 
                            'No price set';
                        })()}
                      </div>
                      <div className="text-xs text-slate-600">
                        Barber: {service.barberName}
                      </div>
                      {service.washerName && (
                        <div className="text-xs text-slate-600">
                          Washer: {service.washerName}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex justify-between text-sm font-medium mb-3">
                      <span>Total:</span>
                      <span className="price-tag">
                        ${selectedServices.reduce((sum, service) => {
                          let servicePrice = 0;
                          if (service.barberPrice) {
                            servicePrice += service.barberPrice;
                          }
                          if (service.washerPrice) {
                            servicePrice += service.washerPrice;
                          }
                          return sum + servicePrice;
                        }, 0)}
                      </span>
                    </div>
                    
                    <button
                      onClick={handleFinish}
                      disabled={saving || selectedServices.length === 0}
                      className={`finish-button ${isOffline ? 'offline' : ''}`}
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {isOffline ? 'Saving Offline...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          {isOffline ? (
                            <>
                              <WifiOff className="w-4 h-4 mr-2" />
                              Save Offline
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Finish
                            </>
                          )}
                        </>
                      )}
                    </button>
                    
                    {/* Offline status message */}
                    {isOffline && selectedServices.length > 0 && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <WifiOff className="w-4 h-4 text-amber-600" />
                          <p className="text-sm text-amber-700 font-medium">
                            You are offline. Services will be saved locally and synced when connection is restored.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>

      <style jsx>{`
        .container {
          background: #F8F9FD;
          background: linear-gradient(0deg, rgb(255, 255, 255) 0%, rgb(244, 247, 251) 100%);
          border-radius: 40px;
          padding: 25px 35px;
          border: 5px solid rgb(255, 255, 255);
          box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 30px 30px -20px;
          margin-bottom: 20px;
        }

        .heading {
          text-align: center;
          font-weight: 900;
          font-size: 30px;
          color: rgb(16, 137, 211);
        }

        .section-title {
          font-weight: 700;
          font-size: 20px;
          color: rgb(16, 137, 211);
          margin-bottom: 20px;
        }

        .subsection-title {
          font-weight: 600;
          font-size: 16px;
          color: rgb(16, 137, 211);
          margin-bottom: 15px;
        }

        .action-button {
          background: linear-gradient(45deg, rgb(16, 137, 211) 0%, rgb(18, 177, 209) 100%);
          color: white;
          padding: 12px 20px;
          border-radius: 20px;
          border: none;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          display: flex;
          align-items: center;
          box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 10px 10px -5px;
        }

        .action-button:hover {
          transform: scale(1.05);
          box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 15px 15px -10px;
        }

        .icon-button {
          background: linear-gradient(45deg, rgb(16, 137, 211) 0%, rgb(18, 177, 209) 100%);
          color: white;
          padding: 12px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 10px 10px -5px;
        }

        .icon-button:hover {
          transform: scale(1.1);
          box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 15px 15px -10px;
        }

        .header-buttons-grid {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .header-button {
          background: linear-gradient(45deg, rgb(16, 137, 211) 0%, rgb(18, 177, 209) 100%);
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 8px;
          font-weight: 500;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 5px 10px -5px;
          min-width: 120px;
          flex: 0 0 auto;
        }

        .header-button:hover {
          transform: translateY(-1px);
          box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 8px 15px -5px;
        }

        .header-button.active {
          background: linear-gradient(45deg, rgb(34, 197, 94) 0%, rgb(16, 185, 129) 100%);
          transform: translateY(-1px);
          box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 8px 15px -5px;
        }

        /* Sidebar Styles */
        .sidebar {
          position: fixed;
          top: 0;
          left: -80px;
          width: 80px;
          height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          transition: left 0.3s ease;
          z-index: 1000;
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
        }

        .sidebar.open {
          left: 0;
        }

        .sidebar-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 15px 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .user-info {
          text-align: center;
          margin-bottom: 10px;
        }

        .user-name {
          font-size: 10px;
          font-weight: 600;
          margin: 0 0 2px 0;
          line-height: 1.2;
        }

        .branch-name {
          font-size: 8px;
          opacity: 0.8;
          margin: 0;
          line-height: 1.2;
        }

        .close-sidebar-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          font-size: 10px;
        }

        .close-sidebar-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .sidebar-content {
          padding: 10px 5px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sidebar-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 8px 4px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          font-size: 8px;
          min-height: 50px;
        }

        .sidebar-button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .sidebar-button.active {
          background: rgba(255, 255, 255, 0.25);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .sidebar-button.logout {
          margin-top: auto;
          background: rgba(239, 68, 68, 0.8);
        }

        .sidebar-button.logout:hover {
          background: rgba(239, 68, 68, 1);
        }

        /* Main Content */
        .main-content {
          flex: 1;
          margin-left: 0;
          transition: margin-left 0.3s ease;
          min-height: 100vh;
          padding: 20px;
        }

        .main-content.sidebar-open {
          margin-left: 80px;
        }

        /* Top Bar */
        .top-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding: 16px 24px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .menu-button {
          background: linear-gradient(45deg, rgb(16, 137, 211) 0%, rgb(18, 177, 209) 100%);
          color: white;
          border: none;
          padding: 12px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .menu-button:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(16, 137, 211, 0.3);
        }

        .top-bar-info {
          flex: 1;
        }

        .welcome-text {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .branch-text {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .summary-card {
          background: white;
          border-radius: 20px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: #cff0ff 0px 10px 10px -5px;
          border: 2px solid transparent;
          transition: all 0.2s ease;
        }

        .summary-card:hover {
          border-color: #12B1D1;
          transform: translateY(-2px);
        }

        .summary-icon {
          width: 50px;
          height: 50px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .summary-label {
          font-size: 12px;
          color: rgb(170, 170, 170);
          margin-bottom: 4px;
        }

        .summary-value {
          font-size: 24px;
          font-weight: 700;
        }

        .summary-cards-grid {
          display: flex;
          gap: 12px;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .summary-card-small {
          background: white;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: #cff0ff 0px 5px 10px -5px;
          border: 1px solid transparent;
          transition: all 0.2s ease;
          min-width: 140px;
          flex: 0 0 auto;
        }

        .summary-card-small:hover {
          border-color: #12B1D1;
          transform: translateY(-1px);
        }

        .summary-icon-small {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .summary-label-small {
          font-size: 12px;
          color: rgb(170, 170, 170);
          margin-bottom: 2px;
          font-weight: 700;
        }

        .summary-value-small {
          font-size: 18px;
          font-weight: 700;
        }

        .price-text {
          font-weight: 600;
          font-size: 14px;
          color: #1e293b;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: rgb(16, 137, 211);
          margin-bottom: 8px;
        }

        .form-select {
          width: 100%;
          background: white;
          border: none;
          padding: 15px 20px;
          border-radius: 20px;
          box-shadow: #cff0ff 0px 10px 10px -5px;
          border-inline: 2px solid transparent;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .form-select:focus {
          outline: none;
          border-inline: 2px solid #12B1D1;
        }

        .add-button {
          width: 100%;
          background: linear-gradient(45deg, rgb(16, 137, 211) 0%, rgb(18, 177, 209) 100%);
          color: white;
          padding: 15px;
          border-radius: 20px;
          border: none;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 10px 10px -5px;
        }

        .add-button:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 15px 15px -10px;
        }

        .add-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .table-container {
          background: white;
          border-radius: 20px;
          overflow-x: auto;
          box-shadow: #cff0ff 0px 10px 10px -5px;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th {
          background: #f0f9ff;
          padding: 15px;
          text-align: left;
          font-weight: 600;
          font-size: 14px;
          color: rgb(16, 137, 211);
          border-bottom: 2px solid #e5e7eb;
        }

        .data-table td {
          padding: 15px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 14px;
        }

        .data-table tr:hover {
          background: #f8fafc;
        }

        .price-tag {
          background: linear-gradient(45deg, rgb(16, 137, 211) 0%, rgb(18, 177, 209) 100%);
          color: white;
          padding: 4px 8px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 12px;
        }

        .role-badge {
          padding: 4px 8px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
        }

        .role-badge.barber {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .role-badge.washer {
          background: #dcfce7;
          color: #15803d;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge.pending {
          background: #fef3c7;
          color: #d97706;
        }

        .status-badge.finished {
          background: #dcfce7;
          color: #15803d;
        }

        .remove-button {
          background: #fee2e2;
          color: #dc2626;
          border: none;
          padding: 6px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .remove-button:hover {
          background: #fecaca;
          transform: scale(1.1);
        }

        .service-card {
          background: white;
          border-radius: 15px;
          padding: 15px;
          box-shadow: #cff0ff 0px 5px 10px -5px;
          border: 2px solid transparent;
          transition: all 0.2s ease;
        }

        .service-card:hover {
          border-color: #12B1D1;
          transform: translateY(-2px);
        }

        .finish-button {
          width: 100%;
          background: linear-gradient(45deg, rgb(34, 197, 94) 0%, rgb(16, 185, 129) 100%);
          color: white;
          padding: 15px;
          border-radius: 20px;
          border: none;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 10px 10px -5px;
        }

        .finish-button:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 15px 15px -10px;
        }

        .finish-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .finish-button.offline {
          background: linear-gradient(45deg, rgb(245, 158, 11) 0%, rgb(217, 119, 6) 100%);
        }

        .finish-button.offline:hover:not(:disabled) {
          background: linear-gradient(45deg, rgb(217, 119, 6) 0%, rgb(180, 83, 9) 100%);
        }

        .loading-state, .error-state, .empty-state {
          text-align: center;
          padding: 40px 20px;
        }

        .retry-button {
          background: linear-gradient(45deg, rgb(16, 137, 211) 0%, rgb(18, 177, 209) 100%);
          color: white;
          padding: 10px 20px;
          border-radius: 15px;
          border: none;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          margin-top: 10px;
        }

        .retry-button:hover {
          transform: scale(1.05);
        }
      `}</style>
      
      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        autoClose={modal.type === "success"}
        autoCloseDelay={3000}
      />
    </div>
  );
}

// Main component wrapper
export default function AdminDashboard() {
  return (
    <OfflineProvider 
      autoSync={true}
      syncOnMount={true}
      enableLogging={true}
    >
      <AdminDashboardContent />
    </OfflineProvider>
  );
} 