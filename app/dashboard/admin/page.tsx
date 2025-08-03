"use client";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { useState, useEffect } from "react";
import { getUserFromLocalStorage } from "@/utils/auth";
import EthiopianDate from "@/components/EthiopianDate";
import { 
  Users, 
  Scissors, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  BarChart3,
  LogOut
} from "lucide-react";

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

export default function AdminDashboard() {
  const [user, setUser] = useState<{ name: string; branchId?: string } | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [branchName, setBranchName] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedBarberId, setSelectedBarberId] = useState("");
  const [selectedWasherId, setSelectedWasherId] = useState("");
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Get user data and branchId on component mount
  useEffect(() => {
    const userData = getUserFromLocalStorage();
    if (userData) {
      setUser(userData);
      setBranchId(userData.branchId);
    }
  }, []);

  // Fetch workers for the admin's branch
  const { data: workers = [], isLoading: loadingWorkers } = useSWR(
    branchId ? `/api/workers?branchId=${branchId}` : null,
    fetcher
  );

  // Fetch services for the admin's branch
  const { data: services = [], isLoading: loadingServices } = useSWR(
    branchId ? `/api/services/${branchId}` : null,
    fetcher
  );

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
  const { data: serviceOperations = [], isLoading: loadingHistory, error: historyError } = useSWR(
    showHistory ? `/api/admin/service-operations` : null,
    fetcher
  );

  // Ensure serviceOperations is always an array and filter to only pending operations
  const safeServiceOperations = Array.isArray(serviceOperations) ? serviceOperations.filter(op => op.status === "pending") : [];
  
  // Filter workers by role
  const barbers = workers.filter((worker: Record<string, unknown>) => worker.role === "barber");
  const washers = workers.filter((worker: Record<string, unknown>) => worker.role === "washer");

  // Add selected service to the list
  const handleAddService = () => {
    if (!selectedServiceId) return;

    const service = services.find((s: Record<string, unknown>) => s.name === selectedServiceId);
    if (!service) return;

    // Check if service has barber price and barber is selected
    if (service.barberPrice && !selectedBarberId) return;

    // Check if service has washer price and washer is selected
    if (service.washerPrice && !selectedWasherId) return;

    // Check if at least one worker is selected
    if (!selectedBarberId && !selectedWasherId) return;

    const barber = selectedBarberId ? barbers.find((b: Record<string, unknown>) => b._id === selectedBarberId) : null;
    const washer = selectedWasherId ? washers.find((w: Record<string, unknown>) => w._id === selectedWasherId) : null;

    // Validate that we have workers for the required services
    if (service.barberPrice && !barber) return;
    if (service.washerPrice && !washer) return;

    const newSelectedService: SelectedService = {
      serviceId: service.name,
      serviceName: service.name,
      barberPrice: service.barberPrice,
      washerPrice: service.washerPrice,
      barberId: barber?._id || "",
      barberName: barber?.name || "",
      washerId: washer?._id || "",
      washerName: washer?.name || "",
    };

    setSelectedServices([...selectedServices, newSelectedService]);
    
    // Reset selections
    setSelectedServiceId("");
    setSelectedBarberId("");
    setSelectedWasherId("");
  };

  // Remove service from selected list
  const handleRemoveService = (index: number) => {
    setSelectedServices(selectedServices.filter((_, i) => i !== index));
  };

  // Helper functions for service selection
  const getSelectedService = () => {
    return services.find((s: any) => s.name === selectedServiceId);  
  };

  const shouldShowBarberDropdown = () => {
    const service = getSelectedService();
    return service && service.barberPrice;
  };

  const shouldShowWasherDropdown = () => {
    const service = getSelectedService();
    return service && service.washerPrice;
  };

  const isAddButtonDisabled = () => {
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
      // Convert selected services to service operations for workers
      const workerServiceOperations = selectedServices.map(service => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const operationData: any = {
          name: service.serviceName
        };
        
        if (service.barberId && service.barberPrice) {
          operationData.barberPrice = service.barberPrice;
          operationData.workerId = service.barberId;
        }
        
        if (service.washerId && service.washerPrice) {
          operationData.washerPrice = service.washerPrice;
          operationData.washerId = service.washerId;
        }
        
        operationData.status = "pending";
        return operationData;
      });

      // Convert selected services to admin service operations
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const adminServiceOperations: any[] = [];
      
      selectedServices.forEach(service => {
        if (service.barberId && service.barberPrice) {
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
        if (service.washerId && service.washerPrice) {
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
        alert("Service operations saved successfully!");
        if (showHistory) {
          mutate(`/api/admin/service-operations`);
        }
      } else {
        const workerResponseData = await workerResponse.json();
        const adminResponseData = await adminResponse.json();
        const errorMessage = workerResponseData.error || adminResponseData.error || "Failed to save service operations";
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error saving service operations:", error);
      alert("Error saving service operations");
    } finally {
      setSaving(false);
    }
  };

  // Toggle history view
  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("branchId");
    window.location.href = "/login";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="container mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-slate-600 text-sm">Welcome back, {user.name}</p>
              <p className="text-slate-500 text-xs">Branch: {branchName || branchId}</p>
            </div>
            <div className="header-buttons-grid">
              <button
                onClick={toggleHistory}
                className="header-button"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {showHistory ? "Hide History" : "View History"}
              </button>
              <Link href="/dashboard/admin/view-appointments">
                <button className="header-button">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Appointments
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className="header-button bg-red-500 hover:bg-red-600 text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* History Section */}
        {showHistory && (
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
                  <p className="summary-value-small text-blue-600">{safeServiceOperations.length}</p>
                </div>
              </div>
              <div className="summary-card-small">
                <div className="summary-icon-small bg-green-300">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="summary-label-small">ዘይተረከበ ብር</h3>
                  <p className="summary-value-small text-green-600">
                    {safeServiceOperations.reduce((total, op) => total + (op.price || 0), 0)} ብር
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
            ) : safeServiceOperations.length === 0 ? (
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
                    {safeServiceOperations.map((operation: any, index: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                      <tr key={operation._id || `operation_${index}_${Date.now()}`}>
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
                    {services.map((service: any, index: number) => (  
                      <option key={service.name || index} value={service.name}>
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
                      {barbers.map((barber: any) => (  
                        <option key={barber._id || barber.name} value={barber._id}>
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
                      {washers.map((washer: any) => (  
                        <option key={washer._id || washer.name} value={washer._id}>
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
                      className="finish-button"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Finish
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
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
    </div>
  );
} 