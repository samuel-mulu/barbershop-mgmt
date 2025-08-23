"use client";
import Link from "next/link";
import useSWR from "swr";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import "./styles.css";
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
  WifiOff,
  Edit,
  Trash2,
  Hash,
  User,
  Building,
  CreditCard,
  Scissors,
  AlertTriangle
} from "lucide-react";
import EnhancedProductManagement from "@/components/EnhancedProductManagement";
import EnhancedSalesManagement from "@/components/EnhancedSalesManagement";
import ImageUpload from "@/components/ImageUpload";
import Pagination from "@/components/Pagination";
import OfflineProvider, { useOfflineQueue, OfflineStatusDisplay } from "../../../providers/OfflineProvider";
import OfflineBanner from "../../../components/OfflineBanner";


const fetcher = (url: string) => {
  const token = localStorage.getItem("token");
  
  if (!token) {
    // Redirect to login instead of throwing error
    window.location.href = "/login";
    throw new Error("No authentication token found");
  }
  
  return fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  }).then(res => {
    if (!res.ok) {
      if (res.status === 401) {
        // Token expired or invalid, redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("branchId");
        window.location.href = "/login";
      }
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
  status?: string;
  createdAt?: string;
  workerName: string;
  workerRole: "barber" | "washer";
  workerId?: string;
  by: "cash" | "mobile banking(telebirr)";
  paymentImageUrl?: string;
  otherWorker?: {
    id: string;
    role: string;
    price: number;
  } | null;
  // Additional properties for combined operations
  totalPrice?: number;
  workers?: Array<{
    workerName: string;
    workerRole: "barber" | "washer";
    workerId?: string;
    price: number;
  }>;
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
  by: "cash" | "mobile banking(telebirr)";
  paymentImageUrl?: string;
}

// EditOperationForm component is now imported from @/components/EditOperationForm

// Internal component that has access to offline context
const AdminDashboardContent = React.memo(() => {
  const [user, setUser] = useState<{ _id: string; name: string; role: string; branchId: string } | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  
  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (!token || !userData) {
      window.location.href = "/login";
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== "admin") {
        window.location.href = `/dashboard/${parsedUser.role}`;
        return;
      }
      setUser(parsedUser);
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("branchId");
      window.location.href = "/login";
    } finally {
      setAuthChecking(false);
    }
  }, []);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [branchName, setBranchName] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedBarberId, setSelectedBarberId] = useState<string>("");
  const [selectedWasherId, setSelectedWasherId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile banking(telebirr)">("cash");
  const [paymentImageUrl, setPaymentImageUrl] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(true);
  

  
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

  // Edit mode states for reusing main form
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingOperationId, setEditingOperationId] = useState<string>('');
  const [editingOperation, setEditingOperation] = useState<ServiceOperation | null>(null);

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    operation: ServiceOperation | null;
  }>({
    isOpen: false,
    operation: null
  });

  // Loading states
  const [updating, setUpdating] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  
  // Payment filter state
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  
  // Pagination states for Service Operations History
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Image preview state for history table
  const [previewImage, setPreviewImage] = useState<{ isOpen: boolean; imageUrl: string; title: string }>({
    isOpen: false,
    imageUrl: "",
    title: ""
  });

  // Get offline queue functionality - MUST be called before any conditional returns
  const { isOffline, queueService } = useOfflineQueue();

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Get branchId from user data
  useEffect(() => {
    if (user) {
      setBranchId(user.branchId);
    }
  }, [user]);

  // Fetch services, barbers, washers, and service operations
  const { data: services = [] } = useSWR<Service[]>(
    user?.branchId ? `/api/services/${user.branchId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      errorRetryCount: 2,
    }
  );

  const { data: barbers = [] } = useSWR<Barber[]>(
    user?.branchId ? `/api/workers?branchId=${user.branchId}&role=barber` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      errorRetryCount: 2,
    }
  );

  const { data: washers = [] } = useSWR<Washer[]>(
    user?.branchId ? `/api/workers?branchId=${user.branchId}&role=washer` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      errorRetryCount: 2,
    }
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
  const { data: serviceOperationsHistory = [], isLoading: loadingHistory, error: historyError, mutate: mutateHistory } = useSWR(
    showHistory ? `/api/admin/service-operations` : null,
    fetcher,
    {
      refreshInterval: 30000, // Poll every 30 seconds (reduced from 5s)
      revalidateOnFocus: false, // Disable focus revalidation
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Prevent duplicate requests
      focusThrottleInterval: 5000,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  // Debug: Log the received data structure
  useEffect(() => {
    if (serviceOperationsHistory && serviceOperationsHistory.length > 0) {
      console.log("🔍 Received service operations history:", serviceOperationsHistory);
      console.log("🔍 Total operations count:", serviceOperationsHistory.length);
      
      // Log all operations with workers array
      const operationsWithWorkers = serviceOperationsHistory.filter((op: ServiceOperation) => op.workers && op.workers.length > 0);
      console.log("🔍 Operations with workers array:", operationsWithWorkers.length);
      
      // Log each operation with workers array in detail
      operationsWithWorkers.forEach((op: ServiceOperation, index: number) => {
        console.log(`🔍 Operation ${index + 1} with workers:`, {
          name: op.name,
          totalPrice: op.totalPrice,
          workersCount: op.workers?.length,
          workers: op.workers?.map((w: any) => ({
            workerName: w.workerName,
            workerRole: w.workerRole,
            price: w.price
          }))
        });
      });
      
      // Log all operations without workers array (old structure)
      const operationsWithoutWorkers = serviceOperationsHistory.filter((op: ServiceOperation) => !op.workers || op.workers.length === 0);
      console.log("🔍 Operations without workers array (old structure):", operationsWithoutWorkers.length);
    }
  }, [serviceOperationsHistory]);

  // Ensure serviceOperations is always an array and filter to only pending operations
  const safeServiceOperationsHistory = Array.isArray(serviceOperationsHistory) ? serviceOperationsHistory.filter(op => op.status === "pending") : [];
  
  // Handle both old single operations and new combined operations
  const getCombinedOperations = useMemo(() => {
    const combinedOperations: ServiceOperation[] = [];
    
    safeServiceOperationsHistory.forEach((operation: ServiceOperation) => {
      // If operation already has workers array (new structure), use it directly
      if (operation.workers && operation.workers.length > 0) {
        // For new structure operations, ensure totalPrice is set
        const operationWithTotalPrice = {
          ...operation,
          totalPrice: operation.totalPrice || operation.workers.reduce((sum, worker) => sum + worker.price, 0)
        };
        console.log("🔍 Processing operation with workers array:", {
          name: operation.name,
          workersCount: operation.workers.length,
          totalPrice: operationWithTotalPrice.totalPrice,
          firstWorker: operation.workers[0]
        });
        combinedOperations.push(operationWithTotalPrice);
      } else {
        // For old single operations, create a combined structure
        const existingCombined = combinedOperations.find(op => 
          op._id === operation._id || 
          (op.name === operation.name && op.createdAt === operation.createdAt)
        );
        
        if (existingCombined) {
          // Add to existing combined operation
          existingCombined.workers = existingCombined.workers || [];
          existingCombined.workers.push({
            workerName: operation.workerName,
            workerRole: operation.workerRole,
            workerId: operation.workerId,
            price: operation.price
          });
          existingCombined.totalPrice = (existingCombined.totalPrice || 0) + operation.price;
        } else {
          // Create new combined operation
          combinedOperations.push({
            ...operation,
            workers: [{
              workerName: operation.workerName,
              workerRole: operation.workerRole,
              workerId: operation.workerId,
              price: operation.price
            }],
            totalPrice: operation.price
          });
        }
      }
    });
    
    console.log("🔍 Final combined operations count:", combinedOperations.length);
    return combinedOperations;
  }, [safeServiceOperationsHistory]);
  
  // Filter operations by payment method
  const getFilteredOperations = useMemo((): ServiceOperation[] => {
    const combinedOperations = getCombinedOperations;
    return combinedOperations.filter((operation: ServiceOperation) => {
      if (paymentFilter === "all") return true;
      return operation.by === paymentFilter;
    });
  }, [getCombinedOperations, paymentFilter]);

  // Get paginated data
  const getPaginatedOperations = useMemo(() => {
    const filteredData = getFilteredOperations;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [getFilteredOperations, currentPage, itemsPerPage]);

  // Calculate pagination info
  const getPaginationInfo = useMemo(() => {
    const filteredData = getFilteredOperations;
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return {
      totalItems,
      totalPages,
      startItem,
      endItem,
      currentPage
    };
  }, [getFilteredOperations, currentPage, itemsPerPage]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1); // Reset to first page when changing limit
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [paymentFilter]);

  // Clean up SWR cache on unmount
  useEffect(() => {
    return () => {
      // Clear SWR cache for this component
      mutateHistory(undefined, false);
    };
  }, [mutateHistory]);
  
  // Filter workers by role
  // const barbersHistory = barbersList.filter((worker: Barber) => worker.role === "barber");
  // const washersHistory = washersList.filter((worker: Washer) => worker.role === "washer");

  // Add service function
  const handleAddService = () => {
    if (isEditMode) {
      // Handle edit operation
      const selectedService = services.find(s => s.name === selectedServiceId);
      if (!selectedService) {
        return;
      }

      // Determine worker and role
      let workerId = '';
      let workerName = '';
      let workerRole: 'barber' | 'washer' = 'barber';
      let price = 0;

      if (selectedBarberId) {
        const barber = barbersList.find(b => b._id === selectedBarberId);
        if (barber) {
          workerId = barber._id;
          workerName = barber.name;
          workerRole = 'barber';
          price = selectedService.barberPrice || 0;
        }
      } else if (selectedWasherId) {
        const washer = washersList.find(w => w._id === selectedWasherId);
        if (washer) {
          workerId = washer._id;
          workerName = washer.name;
          workerRole = 'washer';
          price = selectedService.washerPrice || 0;
        }
      }

      if (!workerId || !workerName) {
        return;
      }

      // Enhanced logic to support both single and multiple workers
      const workers = [];
      let totalPrice = 0;

      // Add barber if selected
      if (selectedBarberId) {
        const barber = barbersList.find(b => b._id === selectedBarberId);
        if (barber && selectedService.barberPrice) {
          workers.push({
            workerName: barber.name,
            workerRole: 'barber',
            workerId: barber._id,
            price: selectedService.barberPrice
          });
          totalPrice += selectedService.barberPrice;
        }
      }

      // Add washer if selected
      if (selectedWasherId) {
        const washer = washersList.find(w => w._id === selectedWasherId);
        if (washer && selectedService.washerPrice) {
          workers.push({
            workerName: washer.name,
            workerRole: 'washer',
            workerId: washer._id,
            price: selectedService.washerPrice
          });
          totalPrice += selectedService.washerPrice;
        }
      }

      // Fallback to single worker if no workers were added
      if (workers.length === 0) {
        workers.push({
          workerName: workerName,
          workerRole: workerRole,
          workerId: workerId,
          price: price
        });
        totalPrice = price;
      }

      const updatedData = {
        name: selectedServiceId,
        totalPrice: totalPrice,
        workers: workers,
        by: paymentMethod,
        paymentImageUrl: paymentImageUrl || undefined,
        originalOperation: editingOperation, // Include original operation for matching
        convertToNewStructure: true // Flag to convert to new structure
      };

      console.log("🔧 [ADMIN] Edit operation - sending enhanced data:", {
        workersCount: workers.length,
        totalPrice,
        workers: workers.map(w => `${w.workerName} (${w.workerRole})`)
      });
      handleUpdateOperation(updatedData);
    } else {
      // Handle add operation (existing logic)
      const selectedService = services.find(s => s.name === selectedServiceId);
      if (!selectedService) {
        return;
      }

      // Check if service is already selected
      const isAlreadySelected = selectedServices.some(
        service => service.serviceName === selectedServiceId
      );

      if (isAlreadySelected) {
        setModal({
          isOpen: true,
          title: "Warning",
          message: "This service is already selected!",
          type: "info"
        });
        return;
      }

      // Create service object
      const newService: SelectedService = {
        serviceId: selectedServiceId,
        serviceName: selectedServiceId,
        barberPrice: selectedService.barberPrice,
        washerPrice: selectedService.washerPrice,
        barberId: selectedBarberId || '',
        barberName: selectedBarberId ? barbersList.find(b => b._id === selectedBarberId)?.name || '' : '',
        washerId: selectedWasherId || '',
        washerName: selectedWasherId ? washersList.find(w => w._id === selectedWasherId)?.name || '' : ''
      };

      setSelectedServices(prev => [...prev, newService]);

      // Reset form
      setSelectedServiceId('');
      setSelectedBarberId('');
      setSelectedWasherId('');
      // Don't clear paymentImageUrl here - it should persist until form is submitted
    }
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

    // In edit mode, allow selecting both barber and washer
    if (isEditMode) {
      // Must have at least one worker selected
      if (!selectedBarberId && !selectedWasherId) return true;
      
      // Check if image is required for mobile banking
      if (paymentMethod === "mobile banking(telebirr)" && !paymentImageUrl) return true;
      
      return false;
    }

    // In add mode, require exactly one worker (old logic)
    if (service.barberPrice && !selectedBarberId) return true;
    if (service.washerPrice && !selectedWasherId) return true;
    if (!selectedBarberId && !selectedWasherId) return true;

    // Check if image is required for mobile banking
    if (paymentMethod === "mobile banking(telebirr)" && !paymentImageUrl) return true;

    // Check if service is already selected (only for add mode)
    const isAlreadySelected = selectedServices.some(
      service => service.serviceName === selectedServiceId
    );
    if (isAlreadySelected) return true;

    return false;
  };

  // Save service operations to User collection
  const handleFinish = async () => {
    // Handle edit mode
    if (isEditMode && editingOperation) {
      // Get the current service data to determine price
      const service = getSelectedService();
      if (!service) {
        return;
      }

      // Determine worker details and price based on selected worker
      let workerName = '';
      let workerRole: 'barber' | 'washer' = 'barber';
      let workerId = '';
      let price = 0;

      if (selectedBarberId) {
        const barber = barbersList.find(b => b._id === selectedBarberId);
        workerName = barber?.name || '';
        workerRole = 'barber';
        workerId = selectedBarberId;
        price = service.barberPrice || 0;
      } else if (selectedWasherId) {
        const washer = washersList.find(w => w._id === selectedWasherId);
        workerName = washer?.name || '';
        workerRole = 'washer';
        workerId = selectedWasherId;
        price = service.washerPrice || 0;
      }

      const updateData = {
        name: selectedServiceId,
        price: price,
        workerName: workerName,
        workerRole: workerRole,
        workerId: workerId,
        by: paymentMethod,
        paymentImageUrl: paymentImageUrl || undefined
      };
      

      
      // Pass both the update data and the original operation for matching
      await handleUpdateOperation({
        ...updateData,
        originalOperation: editingOperation
      });
      return;
    }

    // Handle add mode
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
        await queueService(serviceData);
        
        // Reset form
        setSelectedServices([]);
        mutateOperations();
        
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
          const operation = {
            name: service.serviceName,
            price: service.barberPrice,
            workerName: service.barberName,
            workerRole: "barber" as const,
            workerId: service.barberId,
            status: "pending",
            by: paymentMethod,
            paymentImageUrl: paymentImageUrl || undefined
          };
          adminServiceOperations.push(operation);
        }
      });
      
      selectedServices.forEach(service => {
        if (service.washerId && service.washerPrice && service.washerName) {
          const operation = {
            name: service.serviceName,
            price: service.washerPrice,
            workerName: service.washerName,
            workerRole: "washer" as const,
            workerId: service.washerId,
            status: "pending",
            by: paymentMethod,
            paymentImageUrl: paymentImageUrl || undefined
          };
          adminServiceOperations.push(operation);
        }
      });

      const token = localStorage.getItem("token");

      // Single unified API call
      const response = await fetch("/api/users/service-operations", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          serviceOperations: workerServiceOperations,
          adminServiceOperations: adminServiceOperations,
          paymentMethod: paymentMethod,
          paymentImageUrl: paymentImageUrl || undefined
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log("✅ Unified API response:", responseData);
        
        setSelectedServices([]);
        setPaymentImageUrl(''); // Clear payment image after successful save
        mutateOperations();
        mutateHistory(); // Also refresh the history data
        setModal({
          isOpen: true,
          title: "Success",
          message: "Services saved successfully with consistent IDs!",
          type: "success"
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save services");
      }
    } catch (error: unknown) {
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

  // Download payment proof image
  const downloadPaymentProof = async (imageUrl: string, serviceName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-proof-${serviceName}-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      // Fallback to opening in new tab
      window.open(imageUrl, '_blank');
    }
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
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  // Edit operation function
  const handleEditOperation = (operation: ServiceOperation) => {
    // Set edit mode and populate form
    setIsEditMode(true);
    // Ensure we have a proper string ID - use a combination of properties if _id is missing
    let operationId = '';
    if (operation._id) {
      operationId = operation._id.toString();
    } else {
      // Create a unique ID based on operation properties
      operationId = `${operation.name}_${operation.workerName}_${operation.price}_${operation.createdAt}`;
    }
    setEditingOperationId(operationId);
    setEditingOperation(operation);
    
    // Populate the main form with operation data
    setSelectedServiceId(operation.name || '');
    setPaymentMethod(operation.by || 'cash');
    
    // Set payment image URL if it exists
    if (operation.paymentImageUrl) {
      setPaymentImageUrl(operation.paymentImageUrl);
    } else {
      setPaymentImageUrl('');
    }
    
    // Set worker based on role
    if (operation.workerRole === 'barber') {
      setSelectedBarberId(operation.workerId || '');
      setSelectedWasherId('');
    } else if (operation.workerRole === 'washer') {
      setSelectedWasherId(operation.workerId || '');
      setSelectedBarberId('');
    }
    
    // Clear selected services since we're editing a single operation
    setSelectedServices([]);
  };

  // Cancel edit function
  const cancelEdit = () => {
    setIsEditMode(false);
    setEditingOperationId('');
    setEditingOperation(null);
    setSelectedServiceId('');
    setSelectedBarberId('');
    setSelectedWasherId('');
    setPaymentMethod('cash');
    setPaymentImageUrl('');
    setSelectedServices([]);
  };

  // Delete operation function
  const handleDeleteOperation = (operation: ServiceOperation) => {
    // Create a proper operation object with all required fields
    const operationToDelete = {
      ...operation,
      _id: operation._id || `temp_${Date.now()}`,
      name: operation.name || '',
      price: operation.price || 0,
      workerName: operation.workerName || '',
      workerRole: operation.workerRole || 'barber',
      by: operation.by || 'cash'
    };
    
    setDeleteModal({
      isOpen: true,
      operation: operationToDelete
    });
  };

  // Update operation function
  const handleUpdateOperation = async (updatedData: any) => {
    if (!editingOperation) {
      return;
    }
    
    if (!editingOperationId) {
      return;
    }
    
    setUpdating(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      // Check if we need to convert to new structure
      const shouldConvertToNewStructure = updatedData.convertToNewStructure;
      
      console.log("🔧 [ADMIN] Received update data:", updatedData);
      console.log("🔧 [ADMIN] Should convert to new structure:", shouldConvertToNewStructure);
      
      // Prepare the update data
      let updatePayload = updatedData;
      
      if (shouldConvertToNewStructure) {
        // Convert to new structure format
        updatePayload = {
          name: updatedData.name,
          totalPrice: updatedData.totalPrice,
          workers: updatedData.workers,
          by: updatedData.by,
          paymentImageUrl: updatedData.paymentImageUrl,
          originalOperation: updatedData.originalOperation,
          convertToNewStructure: true
        };
        
        console.log("🔧 [ADMIN] Converted payload to new structure:", updatePayload);
      }
      
      console.log("🔧 [ADMIN] Final update payload:", updatePayload);
      
      const response = await fetch(`/api/admin/service-operations/${editingOperationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updatePayload)
      });

      const responseData = await response.json();
      
      console.log("🔧 Update response:", responseData);

      if (response.ok) {
        setModal({
          isOpen: true,
          title: "Success",
          message: "Service operation updated successfully!",
          type: "success"
        });
        
        // Exit edit mode and reset form
        cancelEdit();
        
        // Refresh the data using SWR mutate instead of page reload
        mutateHistory();
      } else {
        throw new Error(responseData.error || "Failed to update operation");
      }
    } catch (error) {
      setModal({
        isOpen: true,
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to update operation. Please try again.",
        type: "error"
      });
    } finally {
      setUpdating(false);
    }
  };

  // Delete operation function
  const handleConfirmDelete = async () => {
    if (!deleteModal.operation) {
      return;
    }
    
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Since the operations don't have proper _id fields, we need to use a different approach
      const operationId = deleteModal.operation._id || `operation_${Date.now()}`;
      
      const response = await fetch(`/api/admin/service-operations/${operationId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          originalOperation: deleteModal.operation // Pass original operation for reference
        })
      });

      const responseData = await response.json();

      if (response.ok) {
        setModal({
          isOpen: true,
          title: "Success",
          message: "Service operation deleted successfully!",
          type: "success"
        });
        setDeleteModal({ isOpen: false, operation: null });
        
        // Refresh the data using SWR mutate instead of page reload
        mutateHistory();
      } else {
        throw new Error(responseData.error || "Failed to delete operation");
      }
    } catch (error) {
      setModal({
        isOpen: true,
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to delete operation. Please try again.",
        type: "error"
      });
    } finally {
      setDeleting(false);
    }
  };



  // Close delete modal
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, operation: null });
  };

  // Show loading if user data is not loaded yet or auth is being checked
  if (authChecking || !user || !branchId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="container">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-600">
              {authChecking ? "Checking authentication..." : "Loading admin dashboard..."}
            </p>
          </div>
        </div>
      </div>
    );
  }



  return (
    <>
      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.operation && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl border-0 w-full max-w-lg animate-slideIn" style={{ backgroundColor: '#ffffff' }}>
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 bg-white rounded-t-2xl" style={{ backgroundColor: '#ffffff' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
                  <p className="text-sm text-gray-600 mt-1">Are you sure you want to delete this service operation?</p>
                </div>
                <button
                  onClick={closeDeleteModal}
                  className="w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors bg-white rounded-full border border-gray-200 flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: '#ffffff' }}
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="px-8 py-6 bg-white rounded-b-2xl" style={{ backgroundColor: '#ffffff' }}>
              {/* Operation Details */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-700">Service:</span>
                    <span className="text-gray-900">{deleteModal.operation.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-700">Worker:</span>
                    <span className="text-gray-900">{deleteModal.operation.workerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-700">Price:</span>
                    <span className="text-gray-900">{deleteModal.operation.price}ብር</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-700">Payment:</span>
                    <span className="text-gray-900">{deleteModal.operation.by}</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={closeDeleteModal}
                  className="submit-button"
                  style={{ background: '#e2e8f0', color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="submit-button"
                  style={{ background: '#ef4444', color: 'white' }}
                >
                  {deleting ? (
                    <div className="button-content">
                      <div className="loading-spinner"></div>
                      Deleting...
                    </div>
                  ) : (
                    'Delete Operation'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Application Content */}
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
              aria-label="Toggle sidebar menu"
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
              <OfflineStatusDisplay />
            </div>
          </div>

        {/* Add Product Section */}
        {activeSection === 'addProduct' && (
          <div className="container mb-6" data-section="addProduct">
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

            <EnhancedProductManagement 
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

            </div>

            <EnhancedSalesManagement 
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="section-title"></h2>
              <div className="flex items-center gap-4">
                {/* Payment Method Filter */}
                <div className="flex items-center gap-2">
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Payments</option>
                    <option value="cash">💵 Cash Only</option>
                    <option value="mobile banking(telebirr)">📱 Mobile Banking Only</option>
                  </select>
                  {paymentFilter !== "all" && (
                    <button
                      onClick={() => setPaymentFilter("all")}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                      title="Clear filter"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Polling Status Indicator */}
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>

                <button
                  onClick={() => mutateHistory()}
                  className="action-button"
                  disabled={loadingHistory}
                >
                  {loadingHistory ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <TrendingUp className="w-4 h-4 mr-2" />
                  )}
                  Refresh Now
                </button>
              </div>
            </div>
            
            {/* Summary Cards */}
            <div className="summary-cards-grid">
              <div className="summary-card-small">
                <div className="summary-icon-small bg-blue-300">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="summary-label-small">Pending Operations</h3>
                  <p className="summary-value-small text-blue-600">
                    {getFilteredOperations.length}
                  </p>
                </div>
              </div>
              <div className="summary-card-small">
                <div className="summary-icon-small bg-green-300">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="summary-label-small">ዘይተረከበ ብር</h3>
                  <p className="summary-value-small text-green-600">
                    {getFilteredOperations.reduce((total: number, op: ServiceOperation) => total + (op.totalPrice || op.price || 0), 0)} ብር
                  </p>
                </div>
              </div>
            </div>

            {loadingHistory && !serviceOperationsHistory.length ? (
              <div className="loading-state">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-slate-600 mt-2">Loading history...</p>
              </div>
            ) : historyError ? (
              <div className="error-state">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-500">Error loading history</p>
                <p className="text-red-400 text-sm mt-2">
                  {historyError.message || 'Unknown error occurred'}
                </p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="retry-button"
                >
                  Retry
                </button>
              </div>
            ) : getFilteredOperations.length === 0 ? (
              <div className="empty-state">
                <Clock className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500">
                  {paymentFilter === "all" 
                    ? "No pending service operations found" 
                    : `No ${paymentFilter === "cash" ? "cash" : "mobile banking"} operations found`
                  }
                </p>
                <p className="text-slate-400 text-sm mt-2">
                  {paymentFilter === "all" 
                    ? "All operations may have been completed or there are no operations yet."
                    : `Try selecting a different payment method or check if there are any ${paymentFilter === "cash" ? "cash" : "mobile banking"} operations.`
                  }
                </p>
              </div>
            ) : (
              <div className="table-container">
                {/* Background refresh indicator */}
                {loadingHistory && serviceOperationsHistory.length > 0 && (
                  <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-center gap-2 text-blue-700 text-sm">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                      <span>Refreshing data...</span>
                    </div>
                  </div>
                )}
                
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Service</th>
                      <th>Price</th>
                      <th>Worker</th>
                      <th>Role</th>
                      <th>Payment</th>
                      <th>Proof</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                                        {getPaginatedOperations.map((operation: ServiceOperation, index: number) => {
                      const paginationInfo = getPaginationInfo;
                      const rowNumber = paginationInfo.startItem + index;
                                              return (
                        <tr key={`${operation._id}_${index}`}>
                          <td className="text-center font-medium text-gray-600">{rowNumber}</td>
                          <td className="font-medium">{operation.name || 'N/A'}</td>
                        <td>
                          <span className="price-text">
                            {operation.totalPrice || operation.price || 0}ብር
                          </span>
                        </td>
                                                 <td className="font-medium">
                           {operation.workers && operation.workers.length > 0 ? (
                             operation.workers.map((worker: any, workerIndex: number) => (
                               <div key={workerIndex}>
                                 {worker.workerName || 'N/A'}
                               </div>
                             ))
                           ) : (
                             operation.workerName || 'N/A'
                           )}
                         </td>
                        <td>
                                                     {operation.workers && operation.workers.length > 0 ? (
                             operation.workers.map((worker: any, workerIndex: number) => (
                               <div key={workerIndex}>
                                 <span className={`role-badge ${worker.workerRole === 'barber' ? 'barber' : 'washer'}`}>
                                   {worker.workerRole === 'barber' ? 'ቀምቃሚ' : worker.workerRole === 'washer' ? 'ሓጻቢት' : worker.workerRole || 'N/A'}
                                 </span>
                               </div>
                             ))
                           ) : (
                             <span className={`role-badge ${operation.workerRole === 'barber' ? 'barber' : 'washer'}`}>
                               {operation.workerRole === 'barber' ? 'ቀምቃሚ' : operation.workerRole === 'washer' ? 'ሓጻቢት' : operation.workerRole || 'N/A'}
                             </span>
                           )}
                        </td>
                        <td>
                          <span className={`payment-badge ${operation.by === 'cash' ? 'cash' : operation.by === 'mobile banking(telebirr)' ? 'mobile' : 'cash'}`}>
                            {operation.by === 'cash' ? '💵 Cash' : operation.by === 'mobile banking(telebirr)' ? '📱 Mobile Banking' : '💵 Cash'}
                          </span>
                        </td>
                        <td>
                          {operation.paymentImageUrl ? (
                            <div className="space-y-2">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setPreviewImage({
                                      isOpen: !previewImage.isOpen || previewImage.imageUrl !== operation.paymentImageUrl,
                                      imageUrl: operation.paymentImageUrl!,
                                      title: `Payment Proof - ${operation.name}`
                                    });
                                  }}
                                  className="view-button"
                                  title={previewImage.isOpen && previewImage.imageUrl === operation.paymentImageUrl ? "Hide payment proof" : "View payment proof"}
                                >
                                  <span>{previewImage.isOpen && previewImage.imageUrl === operation.paymentImageUrl ? "🙈" : "👁️"}</span>
                                  <span>{previewImage.isOpen && previewImage.imageUrl === operation.paymentImageUrl ? "Hide" : "View"}</span>
                                </button>
                                <button
                                  onClick={() => downloadPaymentProof(operation.paymentImageUrl!, operation.name)}
                                  className="download-button"
                                  title="Download payment proof"
                                >
                                  <span>📥</span>
                                  <span>Download</span>
                                </button>
                              </div>
                              {/* Payment proof preview will be shown in modal below */}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="text-xs text-slate-500">
                          {operation.createdAt ? (
                            <EthiopianDate dateString={operation.createdAt} showTime={true} showWeekday={false} />
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                handleEditOperation(operation);
                              }}
                              className="action-icon-button edit"
                              title="Edit"
                            >
                              ✏️
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {/* Pagination Component */}
                {getFilteredOperations.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={getPaginationInfo.totalPages}
                    totalItems={getPaginationInfo.totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    showItemsPerPage={true}
                  />
                )}
              </div>
            )}
          </div>
        )}

        <div className={`grid grid-cols-1 ${isEditMode ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-6`}>
          {/* Main Content */}
          <div className={isEditMode ? 'lg:col-span-1' : 'lg:col-span-2'}>
            <div className="container">
              <h2 className="section-title">
                {isEditMode ? 'Edit Service Operation' : 'Manage Services'}
              </h2>
              
              {isEditMode && (
                <p className="text-sm text-gray-600 mb-4">
                  Update the service operation details below
                </p>
              )}
              
              {/* Service Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Service Dropdown */}
                <div className="form-group">
                  <label className="form-label">Service</label>
                  <select
                    aria-label="Select service"
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
                      aria-label="Select barber"
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
                      aria-label="Select washer"
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

              {/* Payment Method Selection */}
              <div className="form-group mt-6">
                <label className="form-label">Payment Method</label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={(e) => {
                        setPaymentMethod(e.target.value as "cash" | "mobile banking(telebirr)");
                        setPaymentImageUrl(""); // Clear image when switching to cash
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">💵 Cash</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mobile banking(telebirr)"
                      checked={paymentMethod === "mobile banking(telebirr)"}
                      onChange={(e) => setPaymentMethod(e.target.value as "cash" | "mobile banking(telebirr)")}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">📱 Mobile Banking (Telebirr)</span>
                  </label>
                </div>
              </div>

              {/* Image Upload for Mobile Banking */}
              {paymentMethod === "mobile banking(telebirr)" && (
                <div className="form-group mt-6">
                  <label className="form-label">Payment Proof (Required)</label>
                  <p className="text-sm text-gray-600 mb-3">
                    Please upload a screenshot or photo of your mobile banking payment confirmation. You can take a new photo or select an existing image from your device.
                  </p>
                  <ImageUpload
                    onImageUpload={setPaymentImageUrl}
                    onImageRemove={() => setPaymentImageUrl("")}
                    currentImageUrl={paymentImageUrl}
                    disabled={updating}
                    cameraOnly={false} // Allow both camera and device upload
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                {isEditMode && (
                  <button
                    onClick={cancelEdit}
                    disabled={updating}
                    className="w-full px-4 py-3 text-gray-700 bg-gray-50 border-2 border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ❌ Cancel Edit
                  </button>
                )}
                <button
                  onClick={handleAddService}
                  disabled={isAddButtonDisabled() || updating}
                  className="add-button"
                >
                  {updating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      {isEditMode ? 'Update Service (Can select multiple workers)' : 'Add Service'}
                    </>
                  )}
                </button>
              </div>


            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {!isEditMode && (
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
                        <div className="text-xs text-slate-600">
                          Payment: {paymentMethod === "cash" ? "💵 Cash" : "📱 Mobile Banking (Telebirr)"}
                        </div>
                        {paymentImageUrl && (
                          <div className="text-xs text-green-600 font-medium">
                            ✅ Payment proof uploaded
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
            )}
          </div>
        </div>
        </div>
        </div>

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

      {/* Payment proof preview modal */}
      {previewImage.isOpen && (
        <>
          <div className="payment-proof-backdrop" onClick={() => setPreviewImage({ isOpen: false, imageUrl: "", title: "" })}></div>
          <div className="payment-proof-preview">
            <div className="preview-header">
              <span className="preview-title">{previewImage.title}</span>
              <button
                type="button"
                onClick={() => setPreviewImage({ isOpen: false, imageUrl: "", title: "" })}
                className="close-preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img 
              src={previewImage.imageUrl} 
              alt="Payment proof" 
              className="preview-image"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </>
      )}
    </>
  );
});
// Error Boundary Component
class AdminDashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Admin Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">The admin dashboard encountered an error.</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Main component wrapper
export default function AdminDashboard() {
  return (
    <AdminDashboardErrorBoundary>
      <OfflineProvider 
        autoSync={true}
        syncOnMount={true}
        enableLogging={true}
      >
        <AdminDashboardContent />
      </OfflineProvider>
    </AdminDashboardErrorBoundary>
  );
} 