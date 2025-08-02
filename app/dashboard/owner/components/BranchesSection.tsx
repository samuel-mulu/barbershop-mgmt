"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";

import {
  Building2,
  Plus,
  ChevronDown,
  ChevronRight,
  Users,
  Scissors,
  Droplets,
  Settings,
  Trash2,
  Edit,
  Expand,
  Minimize,
  BarChart3,
  DollarSign,
  Calendar
} from "lucide-react";

const fetcher = (url: string) => {
  const token = localStorage.getItem("token");
  return fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  }).then((res) => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  });
};

interface Branch {
  _id: string;
  name: string;
  ownerId: string;
  services: Array<{
    name: string;
    barberPrice?: number;
    washerPrice?: number;
  }>;
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  role: string;
  branchId: string;
  phone: string;
}

interface BranchesSectionProps {
  ownerId: string;
  onViewStaff: (branch: Branch) => void;
}

export default function BranchesSection({ ownerId, onViewStaff }: BranchesSectionProps) {
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  

  const [branchName, setBranchName] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [barberPrice, setBarberPrice] = useState("");
  const [washerPrice, setWasherPrice] = useState("");
  const [creating, setCreating] = useState(false);
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [editingService, setEditingService] = useState<{branchId: string, serviceIndex: number, service: any} | null>(null);

  // Fetch all branches for this owner
  const { data: branches = [], isLoading: loadingBranches, mutate: mutateBranches, error: branchesError } = useSWR(
    ownerId ? `/api/branches?ownerId=${ownerId}` : null,
    fetcher
  );

  // Fetch all users across all branches
  const { data: allUsers = [], isLoading: loadingUsers, error: usersError } = useSWR(
    ownerId ? `/api/users?ownerId=${ownerId}` : null,
    fetcher
  );

  // Group users by branch with error handling
  const usersByBranch = Array.isArray(allUsers) ? allUsers.reduce((acc: any, user: User) => {
    if (!acc[user.branchId]) {
      acc[user.branchId] = [];
    }
    acc[user.branchId].push(user);
    return acc;
  }, {}) : {};

  // Get users by role for a specific branch
  const getUsersByRole = (branchId: string, role: string) => {
    const branchUsers = usersByBranch[branchId] || [];
    return branchUsers.filter((user: User) => user.role === role);
  };

  // Toggle branch expansion
  const toggleBranchExpansion = (branchId: string) => {
    const newExpanded = new Set(expandedBranches);
    if (newExpanded.has(branchId)) {
      newExpanded.delete(branchId);
    } else {
      newExpanded.add(branchId);
    }
    setExpandedBranches(newExpanded);
  };

  const expandAllBranches = () => {
    const allBranchIds = Array.isArray(branches) ? branches.map((branch: Branch) => branch._id) : [];
    setExpandedBranches(new Set(allBranchIds));
  };

  const collapseAllBranches = () => {
    setExpandedBranches(new Set());
  };

  const toggleServiceExpansion = (serviceKey: string) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceKey)) {
      newExpanded.delete(serviceKey);
    } else {
      newExpanded.add(serviceKey);
    }
    setExpandedServices(newExpanded);
  };

  const handleEditService = (branchId: string, serviceIndex: number, service: any) => {
    setEditingService({ branchId, serviceIndex, service });
  };

  const handleDeleteService = async (branchId: string, serviceIndex: number) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/branches/${branchId}/services?serviceIndex=${serviceIndex}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        mutateBranches();
      } else {
        const errorData = await response.json();
        alert(`Failed to delete service: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Error deleting service");
    }
  };

  const handleUpdateService = async () => {
    if (!editingService) return;
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No authentication token found. Please log in again.");
        return;
      }

      const requestBody = {
        serviceIndex: editingService.serviceIndex,
        service: editingService.service
      };
      
      console.log('Updating service with:', requestBody);
      
      const response = await fetch(`/api/branches/${editingService.branchId}/services`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        console.log('Service updated successfully');
        setEditingService(null);
        mutateBranches();
      } else {
        const errorData = await response.json();
        console.error('Update failed:', errorData);
        alert(`Failed to update service: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error updating service:", error);
      alert("Error updating service");
    }
  };

  const handleCreateBranch = async () => {
    if (!branchName.trim()) return;
    
    setCreating(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No authentication token found. Please log in again.");
        return;
      }

      console.log('Creating branch with name:', branchName);
      
      const response = await fetch("/api/branches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: branchName,
          services: []
        }),
      });

      if (response.ok) {
        console.log('Branch created successfully');
        setBranchName("");
        setShowCreateBranch(false);
        mutateBranches();
      } else {
        const errorData = await response.json();
        console.error('Create branch failed:', errorData);
        alert(`Failed to create branch: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error creating branch:", error);
      alert("Error creating branch");
    } finally {
      setCreating(false);
    }
  };

  const handleAddServiceToBranch = async () => {
    if (!selectedBranch || !serviceName.trim()) return;
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No authentication token found. Please log in again.");
        return;
      }

      const serviceData = {
        services: [{
          name: serviceName,
          barberPrice: barberPrice ? parseInt(barberPrice) : undefined,
          washerPrice: washerPrice ? parseInt(washerPrice) : undefined,
        }]
      };

      console.log('Adding service to branch:', selectedBranch._id, serviceData);
      
      const response = await fetch(`/api/branches/${selectedBranch._id}/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(serviceData),
      });

      if (response.ok) {
        console.log('Service added successfully');
        setServiceName("");
        setBarberPrice("");
        setWasherPrice("");
        setShowAddService(false);
        mutateBranches();
      } else {
        const errorData = await response.json();
        console.error('Add service failed:', errorData);
        alert(`Failed to add service: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error adding service:", error);
      alert("Error adding service");
    }
  };

  // Show error states
  if (branchesError || usersError) {
    return (
      <div className="error-state">
        <div className="error-content">
          <h3>Error Loading Data</h3>
          <p>
            {branchesError ? "Failed to load branches" : "Failed to load users"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loadingBranches || loadingUsers) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading branches...</p>
      </div>
    );
  }

  return (
    <div className="branches-container">
      {/* Header with Actions */}
      <div className="section-header">
        <div className="header-actions">
          <button
            onClick={() => setShowCreateBranch(true)}
            className="action-button primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Branch
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="summary-section">
        <h3 className="summary-title">
          <BarChart3 className="w-5 h-5 mr-2" />
          Branch Summary
        </h3>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-label">Total Branches</div>
            <div className="summary-value primary">{Array.isArray(branches) ? branches.length : 0}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Total Staff</div>
            <div className="summary-value warning">{Array.isArray(allUsers) ? allUsers.length : 0}</div>
          </div>
        </div>
      </div>

      {/* Branches List */}
      {Array.isArray(branches) && branches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-content">
            <Building2 className="w-16 h-16 mb-4 text-slate-400" />
            <h3>No Branches Yet</h3>
            <p>Create your first branch to get started with your barbershop network.</p>
            <button
              onClick={() => setShowCreateBranch(true)}
              className="action-button primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Branch
            </button>
          </div>
        </div>
      ) : (
        <div className="branches-list">
          {Array.isArray(branches) && branches.map((branch: Branch) => {
            const isExpanded = expandedBranches.has(branch._id);
            const adminCount = getUsersByRole(branch._id, 'admin').length;
            const barberCount = getUsersByRole(branch._id, 'barber').length;
            const washerCount = getUsersByRole(branch._id, 'washer').length;
            const totalStaff = adminCount + barberCount + washerCount;

            return (
              <div key={branch._id} className="branch-card">
                {/* Branch Header */}
                <div 
                  className="branch-header"
                  onClick={() => toggleBranchExpansion(branch._id)}
                >
                  <div className="branch-info">
                    <div className="branch-icon">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </div>
                    <div className="branch-details">
                      <h3 className="branch-name">{branch.name}</h3>
                      <p className="branch-id">ID: {branch._id.slice(-6)}</p>
                      </div>
                    </div>
                  <div className="branch-stats">
                    <div className="stat-item">
                      <Users className="w-4 h-4" />
                      <span>{totalStaff}</span>
                      </div>
                    <div className="stat-item">
                      <Settings className="w-4 h-4" />
                      <span>{branch.services.length}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="branch-content">
                    <div className="content-grid">
                      {/* Services Section */}
                      <div className="services-section">
                        <div className="section-header-small">
                          <h4 className="section-title-small">Services ({branch.services.length})</h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBranch(branch);
                              setShowAddService(true);
                            }}
                            className="add-button"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Service
                          </button>
                        </div>
                        {branch.services.length === 0 ? (
                          <div className="empty-services">
                            <p>No services added yet</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBranch(branch);
                                setShowAddService(true);
                              }}
                              className="text-link"
                            >
                              Add your first service
                            </button>
                          </div>
                        ) : (
                          <div className="services-list">
                            {branch.services.map((service, index) => {
                              const serviceKey = `${branch._id}_${index}`;
                              const isServiceExpanded = expandedServices.has(serviceKey);
                              
                              return (
                                <div key={index} className="service-card">
                                  {/* Service Header */}
                                  <div 
                                    className="service-header"
                                    onClick={() => toggleServiceExpansion(serviceKey)}
                                  >
                                    <div className="service-info">
                                      <div className="service-icon">
                                        {isServiceExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                      </div>
                                      <div className="service-name">{service.name}</div>
                                    </div>
                                    <div className="service-prices">
                                  {service.barberPrice && (
                                        <span className="price-tag barber">
                                          <Scissors className="w-3 h-3 mr-1" />
                                          {service.barberPrice}ብር
                                    </span>
                                  )}
                                  {service.washerPrice && (
                                        <span className="price-tag washer">
                                          <Droplets className="w-3 h-3 mr-1" />
                                          {service.washerPrice}ብር
                                    </span>
                                  )}
                                </div>
                              </div>

                                  {/* Expanded Service Details */}
                                  {isServiceExpanded && (
                                    <div className="service-content">
                                      <div className="service-details">
                                        <div className="detail-row">
                                          <div className="detail-item">
                                            <label>Service Name</label>
                                            <div className="detail-value">{service.name}</div>
                                          </div>
                                          <div className="detail-item">
                                            <label>Service ID</label>
                                            <div className="detail-value">#{index + 1}</div>
                                          </div>
                                        </div>
                                        
                                        <div className="detail-row">
                                          <div className="detail-item">
                                            <label>Barber Price</label>
                                            <div className="detail-value price">
                                              {service.barberPrice ? `${service.barberPrice}ብር` : 'Not set'}
                                            </div>
                                          </div>
                                          <div className="detail-item">
                                            <label>Washer Price</label>
                                            <div className="detail-value price">
                                              {service.washerPrice ? `${service.washerPrice}ብር` : 'Not set'}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="service-actions">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleEditService(branch._id, index, service);
                                            }}
                                            className="action-button small primary"
                                          >
                                            <Edit className="w-3 h-3 mr-1" />
                                            Edit
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteService(branch._id, index);
                                            }}
                                            className="action-button small danger"
                                          >
                                            <Trash2 className="w-3 h-3 mr-1" />
                                            Delete
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Staff Section */}
                      <div className="staff-section">
                        <h4 className="section-title-small">Staff ({totalStaff})</h4>
                        <div className="staff-list">
                          <div className="staff-item admin">
                            <Users className="w-4 h-4" />
                            <span>Admins</span>
                            <span className="staff-count">{adminCount}</span>
                          </div>
                          <div className="staff-item barber">
                            <Scissors className="w-4 h-4" />
                            <span>Barbers</span>
                            <span className="staff-count">{barberCount}</span>
                          </div>
                          <div className="staff-item washer">
                            <Droplets className="w-4 h-4" />
                            <span>Washers</span>
                            <span className="staff-count">{washerCount}</span>
                          </div>
                        </div>
                        
                        <div className="staff-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewStaff(branch);
                            }}
                            className="action-button full primary"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            View Staff Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

            {/* Create Branch Modal - Simple Version */}
      {showCreateBranch && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{margin: '0 0 10px 0', fontSize: '18px'}}>Create New Branch</h3>
            <input
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="Enter branch name"
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '15px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
            <button
              onClick={() => setShowCreateBranch(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateBranch}
                disabled={!branchName.trim()}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: !branchName.trim() ? '#ccc' : '#007bff',
                  color: 'white',
                  cursor: !branchName.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                Create
            </button>
            </div>
          </div>
        </div>
      )}
      


      {/* Add Service Modal - Simple Version */}
      {showAddService && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{margin: '0 0 10px 0', fontSize: '18px'}}>Add New Service</h3>
            <p style={{margin: '0 0 15px 0', fontSize: '14px', color: '#666'}}>
              Add a new service to {selectedBranch?.name}.
            </p>
            
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="Service name"
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            
            <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
              <input
                type="number"
                value={barberPrice}
                onChange={(e) => setBarberPrice(e.target.value)}
                placeholder="Barber price"
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
              <input
                type="number"
                value={washerPrice}
                onChange={(e) => setWasherPrice(e.target.value)}
                placeholder="Washer price"
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
            <button
              onClick={() => setShowAddService(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddServiceToBranch}
              disabled={!serviceName.trim()}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: !serviceName.trim() ? '#ccc' : '#007bff',
                  color: 'white',
                  cursor: !serviceName.trim() ? 'not-allowed' : 'pointer'
                }}
            >
              Add Service
            </button>
            </div>
          </div>
        </div>
      )}
      


      {/* Edit Service Modal - Simple Version */}
      {editingService && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{margin: '0 0 10px 0', fontSize: '18px'}}>Edit Service</h3>
            <p style={{margin: '0 0 15px 0', fontSize: '14px', color: '#666'}}>
              Update service details.
            </p>
            
            <input
              type="text"
              value={editingService?.service.name || ''}
              onChange={e => setEditingService(prev => prev ? {...prev, service: {...prev.service, name: e.target.value}} : null)}
              placeholder="Service name"
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            
            <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
              <input
                type="number"
                value={editingService?.service.barberPrice || ''}
                onChange={e => {
                  const value = e.target.value;
                  setEditingService(prev => prev ? {
                    ...prev, 
                    service: {
                      ...prev.service, 
                      barberPrice: value === '' ? undefined : parseInt(value)
                    }
                  } : null);
                }}
                placeholder="Barber price"
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
              <input
                type="number"
                value={editingService?.service.washerPrice || ''}
                onChange={e => {
                  const value = e.target.value;
                  setEditingService(prev => prev ? {
                    ...prev, 
                    service: {
                      ...prev.service, 
                      washerPrice: value === '' ? undefined : parseInt(value)
                    }
                  } : null);
                }}
                placeholder="Washer price"
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <button
                onClick={() => setEditingService(null)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateService}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Update Service
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .branches-container {
          space-y: 1.5rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 0.75rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .section-subtitle {
          color: #64748b;
          margin: 0.25rem 0 0 0;
          font-size: 0.875rem;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .action-button {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          text-decoration: none;
        }

        .action-button.primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .action-button.primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
        }

        .action-button.secondary {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          border: 1px solid rgba(102, 126, 234, 0.2);
        }

        .action-button.secondary:hover {
          background: rgba(102, 126, 234, 0.15);
        }

        .action-button.danger {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
        }

        .action-button.danger:hover {
          transform: translateY(-1px);
        }

        .action-button.small {
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
        }

        .action-button.full {
          width: 100%;
          justify-content: center;
        }

        .summary-section {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .summary-title {
          display: flex;
          align-items: center;
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 1rem 0;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .summary-card {
          background: white;
          padding: 1rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .summary-label {
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 0.5rem;
        }

        .summary-value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .summary-value.primary { color: #667eea; }
        .summary-value.success { color: #10b981; }
        .summary-value.warning { color: #f59e0b; }
        .summary-value.info { color: #3b82f6; }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
        }

        .empty-content {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 3rem 2rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .empty-content h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.5rem 0;
        }

        .empty-content p {
          color: #64748b;
          margin: 0 0 1.5rem 0;
        }

        .branches-list {
          space-y: 1rem;
        }

        .branch-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          overflow: hidden;
        }

        .branch-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .branch-header:hover {
          background: rgba(102, 126, 234, 0.05);
        }

        .branch-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .branch-icon {
          color: #667eea;
          transition: transform 0.2s ease;
        }

        .branch-details {
          display: flex;
          flex-direction: column;
        }

        .branch-name {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .branch-id {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0;
        }

        .branch-stats {
          display: flex;
          gap: 1.5rem;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
          font-weight: 500;
        }

        .branch-content {
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .services-section, .staff-section {
          space-y: 1rem;
        }

        .section-header-small {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .section-title-small {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .add-button {
          display: flex;
          align-items: center;
          padding: 0.375rem 0.75rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .add-button:hover {
          background: #5a67d8;
          transform: translateY(-1px);
        }

        .empty-services {
          text-align: center;
          padding: 2rem;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 8px;
          border: 1px dashed rgba(0, 0, 0, 0.1);
        }

        .empty-services p {
          color: #64748b;
          margin: 0 0 0.5rem 0;
        }

        .text-link {
          color: #667eea;
          text-decoration: none;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .text-link:hover {
          text-decoration: underline;
        }

        .services-list {
          space-y: 0.75rem;
        }

        .service-card {
          background: rgba(0, 0, 0, 0.02);
          border-radius: 8px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }

        .service-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .service-header:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .service-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .service-icon {
          color: #667eea;
          transition: transform 0.2s ease;
        }

        .service-name {
          font-weight: 500;
          color: #1e293b;
        }

        .service-prices {
          display: flex;
          gap: 0.5rem;
        }

        .price-tag {
          display: flex;
          align-items: center;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .price-tag.barber {
          background: rgba(59, 130, 246, 0.1);
          color: #1d4ed8;
        }

        .price-tag.washer {
          background: rgba(16, 185, 129, 0.1);
          color: #047857;
        }

        .service-content {
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          padding: 0.75rem;
          background: white;
        }

        .service-details {
          space-y: 0.75rem;
        }

        .detail-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
        }

        .detail-item label {
          font-size: 0.75rem;
          color: #64748b;
          margin-bottom: 0.25rem;
        }

        .detail-value {
          font-weight: 500;
          color: #1e293b;
        }

        .detail-value.price {
          color: #667eea;
        }

        .service-actions {
          display: flex;
          gap: 0.5rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        }

        .staff-list {
          space-y: 0.5rem;
        }

        .staff-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 8px;
          font-weight: 500;
        }

        .staff-item.admin {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        .staff-item.barber {
          background: rgba(59, 130, 246, 0.1);
          color: #1d4ed8;
        }

        .staff-item.washer {
          background: rgba(16, 185, 129, 0.1);
          color: #047857;
        }

        .staff-count {
          margin-left: auto;
          font-weight: 600;
        }

        .staff-actions {
          margin-top: 1rem;
        }

        .error-state {
          text-align: center;
          padding: 2rem;
        }

        .error-content {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          padding: 2rem;
        }

        .error-content h3 {
          color: #dc2626;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .error-content p {
          color: #991b1b;
          margin: 0 0 1rem 0;
        }

        .retry-button {
          background: #dc2626;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .retry-button:hover {
          background: #b91c1c;
        }

        .loading-state {
          text-align: center;
          padding: 3rem 1rem;
          color: #64748b;
        }

        .loading-spinner {
          width: 2rem;
          height: 2rem;
          border: 3px solid #e2e8f0;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        }

        .modal-body {
          space-y: 1rem;
          margin: 1rem 0;
        }

        .input-group {
          display: flex;
          flex-direction: column;
        }

        .input-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .modal-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          transition: border-color 0.2s ease;
        }

        .modal-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        @media (max-width: 768px) {
          .section-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .header-actions {
            justify-content: center;
          }

          .content-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .detail-row {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
} 