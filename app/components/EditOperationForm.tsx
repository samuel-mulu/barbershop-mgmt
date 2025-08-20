"use client";

import { useState, useEffect } from "react";
import ImageUpload from "./ImageUpload";

interface ServiceOperation {
  _id?: string;
  name: string;
  price: number;
  workerName: string;
  workerRole: "barber" | "washer";
  workerId?: string;
  status?: string;
  by: "cash" | "mobile banking(telebirr)";
  paymentImageUrl?: string;
  createdAt?: string;
}

interface Service {
  name: string;
  barberPrice?: number;
  washerPrice?: number;
}

interface Worker {
  _id: string;
  name: string;
  role: "barber" | "washer";
}

interface EditOperationFormProps {
  operation: ServiceOperation;
  onUpdate: (data: Partial<ServiceOperation> & { originalOperation?: ServiceOperation }) => void;
  onCancel: () => void;
  updating: boolean;
}

export default function EditOperationForm({ 
  operation, 
  onUpdate, 
  onCancel, 
  updating 
}: EditOperationFormProps) {
  const [formData, setFormData] = useState({
    name: operation.name || '',
    price: operation.price || 0,
    workerName: operation.workerName || '',
    workerRole: operation.workerRole || 'barber' as const,
    workerId: operation.workerId || '',
    by: operation.by || 'cash' as const
  });

  // Payment image state - simple like admin dashboard
  const [paymentImageUrl, setPaymentImageUrl] = useState(operation.paymentImageUrl || '');

  // Fetch data states
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Worker[]>([]);
  const [washers, setWashers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  // Update form data when operation changes
  useEffect(() => {
    setFormData({
      name: operation.name || '',
      price: operation.price || 0,
      workerName: operation.workerName || '',
      workerRole: operation.workerRole || 'barber' as const,
      workerId: operation.workerId || '',
      by: operation.by || 'cash' as const
    });
    
    // Update image URL - simple like admin dashboard
    setPaymentImageUrl(operation.paymentImageUrl || '');
  }, [operation]);

  // Fetch services and workers data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const branchId = localStorage.getItem("branchId");

        if (!token || !branchId) {
          console.error("No token or branchId found");
          return;
        }

        // Fetch services
        const servicesResponse = await fetch(`/api/services/${branchId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const servicesData = await servicesResponse.json();

        // Fetch barbers
        const barbersResponse = await fetch(`/api/workers?branchId=${branchId}&role=barber`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const barbersData = await barbersResponse.json();

        // Fetch washers
        const washersResponse = await fetch(`/api/workers?branchId=${branchId}&role=washer`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const washersData = await washersResponse.json();

        setServices(servicesData);
        setBarbers(barbersData);
        setWashers(washersData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get current service details
  const getCurrentService = () => {
    return services.find(service => service.name === formData.name);
  };

  // Check if service can be done by barber (has barberPrice)
  const shouldShowBarberDropdown = () => {
    const service = getCurrentService();
    return service ? !!service.barberPrice : false;
  };

  // Check if service can be done by washer (has washerPrice)
  const shouldShowWasherDropdown = () => {
    const service = getCurrentService();
    return service ? !!service.washerPrice : false;
  };

  // Get available workers based on selected role
  const getAvailableWorkers = () => {
    return formData.workerRole === 'barber' ? barbers : washers;
  };

  // Update price when service or worker role changes
  useEffect(() => {
    const currentService = getCurrentService();
    if (currentService) {
      let newPrice = 0;
      
      if (formData.workerRole === 'barber' && currentService.barberPrice) {
        newPrice = currentService.barberPrice;
      } else if (formData.workerRole === 'washer' && currentService.washerPrice) {
        newPrice = currentService.washerPrice;
      }
      
      setFormData(prev => ({
        ...prev,
        price: newPrice
      }));
    }
  }, [formData.name, formData.workerRole, services]);

  // Update worker name when worker ID changes
  useEffect(() => {
    if (formData.workerId) {
      const workers = getAvailableWorkers();
      const selectedWorker = workers.find(worker => worker._id === formData.workerId);
      if (selectedWorker) {
        setFormData(prev => ({
          ...prev,
          workerName: selectedWorker.name
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        workerName: ''
      }));
    }
  }, [formData.workerId, formData.workerRole, barbers, washers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple image handling like admin dashboard
    const finalImageUrl = formData.by === 'mobile banking(telebirr)' ? paymentImageUrl || undefined : undefined;
    
    const updateData = {
      ...formData,
      paymentImageUrl: finalImageUrl,
      originalOperation: operation // Include original operation for matching
    };
    

    
    onUpdate(updateData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="w-full h-full max-h-screen overflow-y-auto px-4 py-6">
        <div className="w-full max-w-sm mx-auto">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="form-group">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-12 bg-gray-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full max-h-screen overflow-y-auto px-4 py-6">
      <div className="w-full max-w-sm mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Name - Editable Dropdown */}
          <div className="form-group">
            <label htmlFor="service-name" className="form-label">
              ✂️ Service Name
            </label>
            <select
              id="service-name"
              value={formData.name}
              onChange={(e) => {
                const newServiceName = e.target.value;
                handleInputChange('name', newServiceName);
                // Reset worker selections when service changes (same as admin dashboard)
                handleInputChange('workerId', '');
                handleInputChange('workerName', '');
              }}
              className="form-select"
              required
            >
              <option value="">Select Service...</option>
              {services.map((service) => (
                <option key={service.name} value={service.name}>
                  {service.name} 
                  {service.barberPrice && service.washerPrice 
                    ? ` (Barber: ${service.barberPrice}ብር, Washer: ${service.washerPrice}ብር)`
                    : service.barberPrice 
                      ? ` (Barber: ${service.barberPrice}ብር)`
                      : service.washerPrice 
                        ? ` (Washer: ${service.washerPrice}ብር)`
                        : ''
                  }
                </option>
              ))}
            </select>
          </div>

          {/* Price - Read Only (Constant from service) */}
          <div className="form-group">
            <label htmlFor="service-price" className="form-label">
              💰 Price (ብር) - Fixed
            </label>
            <input
              id="service-price"
              type="number"
              value={formData.price}
              className="form-select bg-gray-50 cursor-not-allowed"
              readOnly
            />
            <p className="text-xs text-gray-600 mt-2">
              Price is fixed based on service and worker role
            </p>
          </div>

          {/* Worker Role - Editable but constrained by service */}
          <div className="form-group">
            <label htmlFor="worker-role" className="form-label">
              🎯 Worker Role
            </label>
            <select
              id="worker-role"
              value={formData.workerRole}
              onChange={(e) => {
                const newRole = e.target.value as "barber" | "washer";
                handleInputChange('workerRole', newRole);
                // Reset worker selection when role changes (same as admin dashboard)
                handleInputChange('workerId', '');
                handleInputChange('workerName', '');
              }}
              className="form-select"
              required
            >
              {shouldShowBarberDropdown() && (
                <option value="barber">💇‍♂️ Barber</option>
              )}
              {shouldShowWasherDropdown() && (
                <option value="washer">🧼 Washer</option>
              )}
              {!shouldShowBarberDropdown() && !shouldShowWasherDropdown() && (
                <option value="">No workers available for this service</option>
              )}
            </select>
            {!shouldShowBarberDropdown() && !shouldShowWasherDropdown() && (
              <p className="text-xs text-red-600 mt-2">
                This service is not available for any worker role
              </p>
            )}
          </div>

          {/* Worker Name - Shows workers for selected role */}
          {formData.workerRole && (shouldShowBarberDropdown() || shouldShowWasherDropdown()) && (
            <div className="form-group">
              <label htmlFor="worker-name" className="form-label">
                👤 {formData.workerRole === 'barber' ? 'Barber' : 'Washer'} Name
                {getCurrentService() && (
                  formData.workerRole === 'barber' 
                    ? ` (${getCurrentService()?.barberPrice}ብር)`
                    : ` (${getCurrentService()?.washerPrice}ብር)`
                )} *
              </label>
              <select
                id="worker-name"
                value={formData.workerId}
                onChange={(e) => handleInputChange('workerId', e.target.value)}
                className="form-select"
                required
              >
                <option value="">Select {formData.workerRole === 'barber' ? 'Barber' : 'Washer'}...</option>
                {getAvailableWorkers().map((worker) => (
                  <option key={worker._id} value={worker._id}>
                    {worker.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Payment Method */}
          <div className="form-group">
            <label htmlFor="payment-method" className="form-label">
              💳 Payment Method
            </label>
            <select
              id="payment-method"
              value={formData.by}
              onChange={(e) => {
                const newPaymentMethod = e.target.value as "cash" | "mobile banking(telebirr)";
                handleInputChange('by', newPaymentMethod);
                
                // Clear image when switching to cash - simple like admin dashboard
                if (newPaymentMethod === 'cash') {
                  setPaymentImageUrl('');
                }
              }}
              className="form-select"
            >
              <option value="cash">💵 Cash</option>
              <option value="mobile banking(telebirr)">📱 Mobile Banking (Telebirr)</option>
            </select>
          </div>

          {/* Image Upload for Mobile Banking */}
          {formData.by === "mobile banking(telebirr)" && (
            <div className="form-group">
              <label className="form-label">Payment Proof (Required)</label>
              <p className="text-sm text-gray-600 mb-3">
                Please upload a screenshot or photo of your mobile banking payment confirmation
              </p>
              <ImageUpload
                onImageUpload={setPaymentImageUrl}
                onImageRemove={() => setPaymentImageUrl("")}
                currentImageUrl={paymentImageUrl}
                disabled={updating}
                cameraOnly={true} // Force camera-only mode for mobile banking
              />
              
              {/* Image status indicator */}
              {paymentImageUrl && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-700 font-medium">
                      ✅ Payment proof uploaded successfully
                    </span>
                  </div>
                </div>
              )}
              

            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={updating}
              className="w-full px-4 py-3 text-gray-700 bg-gray-50 border-2 border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ❌ Cancel
            </button>
            <button
              type="submit"
              disabled={
                updating || 
                !formData.workerId || 
                !formData.name || 
                formData.price <= 0 ||
                (formData.by === "mobile banking(telebirr)" && !paymentImageUrl)
              }
              className="w-full px-4 py-3 text-white bg-gradient-to-r from-blue-500 to-blue-600 border-2 border-blue-500 rounded-xl hover:from-blue-600 hover:to-blue-700 hover:border-blue-600 transition-all duration-200 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {updating ? '⏳ Updating...' : '✅ Update Operation'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
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
          padding: 12px 16px;
          border-radius: 16px;
          box-shadow: #cff0ff 0px 8px 8px -4px;
          border-inline: 2px solid transparent;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .form-select:focus {
          outline: none;
          border-inline: 2px solid #12B1D1;
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .form-select {
            padding: 14px 16px;
            font-size: 16px; /* Prevents zoom on iOS */
          }
        }
      `}</style>
    </div>
  );
}
