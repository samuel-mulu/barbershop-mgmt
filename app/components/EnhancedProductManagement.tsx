"use client";
import { useState, useEffect } from "react";
import { Package, Plus, Calendar, ChevronDown, ChevronUp, DollarSign, Hash, Tag, TrendingUp, Eye, EyeOff, WifiOff, Edit, Trash2, Search } from "lucide-react";
import { useOfflineQueue } from "../../providers/OfflineProvider";
import EthiopianDate from "./EthiopianDate";


interface Product {
  _id: string;
  name: string;
  quantity: number;
  quantityType: string;
  pricePerUnit: number;
  totalPrice: number;
  createdAt: string;
}

interface ProductManagementProps {
  onSuccess?: () => void;
  onDataChange?: (products: Product[]) => void;
}



export default function EnhancedProductManagement({ onSuccess, onDataChange }: ProductManagementProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    quantity: 0,
    quantityType: "single" as "pack" | "single" | "box" | "bottle" | "piece",
    pricePerUnit: 0
  });

  // Edit mode states for reusing main form
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingProductId, setEditingProductId] = useState<string>('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [updating, setUpdating] = useState(false);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    product: Product | null;
  }>({
    isOpen: false,
    product: null
  });
  const [deleting, setDeleting] = useState(false);

  // Offline functionality
  const { isOffline, pendingCount, queueProduct } = useOfflineQueue();

  // Polling for real-time updates
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
        if (onDataChange) {
          onDataChange(data.products);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    if (showHistory) {
      fetchProducts();
      
      // Start polling every 5 seconds when history is shown
      const interval = setInterval(() => {
        fetchProducts();
      }, 5000);
      
      setPollingInterval(interval);
      
      // Cleanup polling when component unmounts or history is hidden
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else {
      // Stop polling when history is hidden
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  }, [showHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate form data
    if (!formData.name.trim()) {
      alert('Please enter a product name');
      setLoading(false);
      return;
    }

    if (formData.quantity <= 0) {
      alert('Please enter a valid quantity (greater than 0)');
      setLoading(false);
      return;
    }

    if (formData.pricePerUnit <= 0) {
      alert('Please enter a valid price per unit (greater than 0)');
      setLoading(false);
      return;
    }

    if (isEditMode) {
      // Handle edit operation
      const updateData = {
        ...formData,
        totalPrice: formData.quantity * formData.pricePerUnit
      };
      handleUpdateProduct(updateData);
      return;
    }

    try {
      const productData = {
        ...formData,
        totalPrice: formData.quantity * formData.pricePerUnit
      };

      console.log('📦 Creating product with data:', productData);

      // If offline, queue the operation
      if (isOffline) {
        console.log('📱 [OFFLINE] Queueing product operation:', productData);
        await queueProduct(productData);
        
        // Reset form
        setFormData({
          name: "",
          quantity: 0,
          quantityType: "single",
          pricePerUnit: 0
        });
        
        if (onSuccess) {
          onSuccess();
        }
        
        console.log('✅ [OFFLINE] Product queued successfully');
        return;
      }

      // Online - proceed with normal submission
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        setFormData({
          name: "",
          quantity: 0,
          quantityType: "single",
          pricePerUnit: 0
        });
        if (showHistory) {
          fetchProducts();
        }
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      
      // If online submission fails, try to queue offline
      if (!isOffline) {
        try {
          const productData = {
            ...formData,
            totalPrice: formData.quantity * formData.pricePerUnit
          };
          
          await queueProduct(productData);
          console.log('📱 [FALLBACK] Product queued after online failure');
          
          // Reset form
          setFormData({
            name: "",
            quantity: 0,
            quantityType: "single",
            pricePerUnit: 0
          });
          
          if (onSuccess) {
            onSuccess();
          }
        } catch (queueError) {
          console.error('Failed to queue product:', queueError);
          alert('Failed to add product');
        }
      } else {
        alert('Failed to add product');
      }
    } finally {
      setLoading(false);
    }
  };



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateTotalPrice = () => {
    return formData.quantity * formData.pricePerUnit;
  };



  // Edit product function
  const handleEditProduct = (product: Product) => {
    console.log("🔍 handleEditProduct called with:", product);
    
    // Set edit mode and populate form
    setIsEditMode(true);
    setEditingProductId(product._id);
    setEditingProduct(product);
    
    // Populate the main form with product data
    setFormData({
      name: product.name || '',
      quantity: product.quantity || 0,
      quantityType: product.quantityType as "pack" | "single" | "box" | "bottle" | "piece",
      pricePerUnit: product.pricePerUnit || 0
    });
    
    console.log("🔍 Edit mode activated for product:", product);
  };

  // Cancel edit function
  const cancelEdit = () => {
    setIsEditMode(false);
    setEditingProductId('');
    setEditingProduct(null);
    setFormData({
      name: "",
      quantity: 0,
      quantityType: "single",
      pricePerUnit: 0
    });
    console.log("🔍 Edit mode cancelled");
  };

  // Update product function
  const handleUpdateProduct = async (updateData: any) => {
    if (!editingProduct) {
      console.error("❌ No product to update");
      return;
    }
    
    console.log("🔍 handleUpdateProduct called with:", updateData);
    console.log("🔍 Product to update:", editingProduct);
    
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`/api/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      // Refresh data
      if (showHistory) {
        fetchProducts();
      }
      
      // Exit edit mode and reset form
      cancelEdit();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product');
    } finally {
      setUpdating(false);
    }
  };


  // Delete Functions
  const handleDeleteProduct = (product: Product) => {
    setDeleteModal({
      isOpen: true,
      product
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      product: null
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.product) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/products/${deleteModal.product._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      // Refresh data
      if (showHistory) {
        fetchProducts();
      }
      
      closeDeleteModal();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const quantityTypeOptions = [
    { value: "single", label: "Single", icon: "📦" },
    { value: "pack", label: "Pack", icon: "📦" },
    { value: "box", label: "Box", icon: "📦" },
    { value: "bottle", label: "Bottle", icon: "🍶" },
    { value: "piece", label: "Piece", icon: "🔢" }
  ];

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="enhanced-product-management">


      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.product && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl border-0 w-full max-w-lg animate-slideIn" style={{ backgroundColor: '#ffffff' }}>
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 bg-white rounded-t-2xl" style={{ backgroundColor: '#ffffff' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
                  <p className="text-sm text-gray-600 mt-1">Are you sure you want to delete this product?</p>
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
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Product Form */}
      <div className="product-form-container">
        <div className="form-header">
          <div className="form-header-content">
            <div className="form-icon">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="form-title">
                {isEditMode ? 'Edit Product' : 'Add New Product'}
              </h3>
              <p className="form-subtitle">
                {isEditMode ? 'Update the product details below' : 'Create and manage your inventory'}
              </p>
            </div>
          </div>
          {isOffline && (
            <div className="offline-badge">
              <WifiOff className="w-4 h-4" />
              <span>Offline Mode</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="modern-form">
          <div className="form-grid">
            {/* Product Name */}
            <div className="form-field full-width">
              <label className="field-label">
                <Tag className="w-4 h-4" />
                Product Name
              </label>
                             <input
                 type="text"
                 value={formData.name}
                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                 className="field-input"
                 placeholder="e.g., Shampoo, Hair Gel, Scissors"
                 required
               />
            </div>

            {/* Quantity */}
            <div className="form-field">
              <label className="field-label">
                <Hash className="w-4 h-4" />
                Quantity
              </label>
                                                          <input
                 type="number"
                 value={formData.quantity || ''}
                 onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                 className="field-input"
                  placeholder="e.g., 50, 100, 25"
                 min="0"
                 required
               />
            </div>

            {/* Quantity Type */}
            <div className="form-field">
              <label className="field-label">
                <Package className="w-4 h-4" />
                Type
              </label>
              <select
                value={formData.quantityType}
                onChange={(e) => setFormData({ ...formData, quantityType: e.target.value as any })}
                className="field-select"
                required
              >
                {quantityTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Per Unit */}
            <div className="form-field">
              <label className="field-label">
                <DollarSign className="w-4 h-4" />
                Price Per Unit
              </label>
                                                          <input
                 type="number"
                 step="0.01"
                 value={formData.pricePerUnit || ''}
                 onChange={(e) => setFormData({ ...formData, pricePerUnit: parseFloat(e.target.value) || 0 })}
                 className="field-input"
                  placeholder="e.g., 15.99, 25.50, 10.00"
                 min="0"
                 required
               />
            </div>
          </div>



          {/* Submit Button */}
          <div className="flex gap-3 mt-6">
            {isEditMode && (
              <button
                type="button"
                onClick={cancelEdit}
                disabled={updating}
                className="w-full px-4 py-3 text-gray-700 bg-gray-50 border-2 border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ❌ Cancel Edit
              </button>
            )}
            <button
              type="submit"
              disabled={loading || updating}
              className={`submit-button ${isOffline ? 'offline' : ''}`}
            >
              {loading || updating ? (
                <div className="button-content">
                  <div className="loading-spinner"></div>
                  {isOffline ? 'Saving Offline...' : (isEditMode ? 'Updating...' : 'Adding Product...')}
                </div>
              ) : (
                <div className="button-content">
                  {isOffline ? (
                    <>
                      <WifiOff className="w-5 h-5" />
                      Save Offline
                    </>
                  ) : (
                    <>
                      {isEditMode ? (
                        <>
                          <Edit className="w-5 h-5" />
                          Update Product
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          Add Product
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </button>
          </div>
          
          {/* Offline Status Message */}
          {isOffline && (
            <div className="offline-message">
              <div className="offline-message-content">
                <WifiOff className="w-4 h-4 text-amber-600" />
                <p>You are offline. Products will be saved locally and synced when connection is restored.</p>
              </div>
              {pendingCount > 0 && (
                <p className="pending-count">
                  {pendingCount} operations waiting to sync
                </p>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards-grid">
        <div className="summary-card-small">
          <div className="summary-icon-small bg-blue-300">
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="summary-label-small">Total Products</h3>
            <p className="summary-value-small text-blue-600">{products.length}</p>
          </div>
        </div>
      </div>

      {/* Product History */}
      <div className="history-container">
        <div className="history-header">
          <div className="history-header-content">
            <Calendar className="w-5 h-5" />
            <h3 className="history-title">Product History</h3>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="history-toggle"
          >
            {showHistory ? (
              <>
                <EyeOff className="w-4 h-4" />
                Hide History
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                View History
              </>
            )}
          </button>
        </div>
        
        {showHistory && (
          <div className="history-content">
            {/* Search Bar */}
            <div className="search-container">
              <div className="search-input-wrapper">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search products by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="clear-search"
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
              {searchTerm && (
                <div className="search-results-info">
                  Showing {filteredProducts.length} of {products.length} products
                </div>
              )}
            </div>

            {products.length === 0 ? (
              <div className="empty-state">
                <Package className="w-16 h-16 text-slate-300" />
                <h4>No Products Yet</h4>
                <p>Start adding products to see them here</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-state">
                <Search className="w-16 h-16 text-slate-300" />
                <h4>No Products Found</h4>
                <p>No products match your search "{searchTerm}"</p>
              </div>
            ) : (
              <div className="products-table-container">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product Name</th>
                      <th>Quantity</th>
                      <th>Type</th>
                      <th>Unit Price</th>
                      <th>Total Price</th>
                      <th>Date Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((product, index) => (
                        <tr key={product._id} className="product-row">
                          <td className="row-number">{index + 1}</td>
                                                     <td className="product-name-cell">
                             <div className="product-name-info">
                               <span className="product-name">{product.name}</span>
                               <span className="product-time">
                                 <EthiopianDate 
                                   dateString={product.createdAt} 
                                   showTime={true} 
                                   showWeekday={false}
                                 />
                               </span>
                             </div>
                           </td>
                          <td className="quantity-cell">{product.quantity}</td>
                          <td className="type-cell">
                            <span className="type-badge">{product.quantityType}</span>
                          </td>
                          <td className="price-cell">{formatCurrency(product.pricePerUnit)}</td>
                          <td className="total-cell">
                            <span className="total-price">{formatCurrency(product.totalPrice)}</span>
                          </td>
                          <td className="date-cell">
                            <EthiopianDate 
                              dateString={product.createdAt} 
                              showTime={false} 
                              showWeekday={false}
                            />
                          </td>
                          <td className="actions-cell">
                            <div className="product-actions">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="edit-button"
                                title="Edit Product"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product)}
                                className="delete-button"
                                title="Delete Product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .enhanced-product-management {
          max-width: 100%;
          margin: 0 auto;
          space-y: 2rem;
        }

        /* Product Form Styles */
        .product-form-container {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 
            0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04),
            0 0 0 1px rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(226, 232, 240, 0.8);
          margin-bottom: 2rem;
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .form-header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .form-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
        }

        .form-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .form-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0.25rem 0 0 0;
        }

        .offline-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
          box-shadow: 0 4px 8px rgba(245, 158, 11, 0.3);
        }

        .modern-form {
          space-y: 1.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .form-field.full-width {
          grid-column: 1 / -1;
        }

        .field-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.75rem;
        }

        .field-input, .field-select {
          width: 100%;
          padding: 1rem 1.25rem;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          font-size: 1rem;
          background: #ffffff;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .field-input:focus, .field-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 
            0 0 0 3px rgba(59, 130, 246, 0.1),
            0 1px 3px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }

        .field-input::placeholder {
          color: #9ca3af;
        }

        .total-preview {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 20px;
          padding: 1.5rem;
          margin: 1.5rem 0;
          box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);
        }

        .total-preview-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: white;
        }

        .total-label {
          font-size: 0.875rem;
          font-weight: 500;
          margin: 0;
          opacity: 0.9;
        }

        .total-amount {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .submit-button {
          width: 100%;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 20px;
          padding: 1.25rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 
            0 10px 20px rgba(59, 130, 246, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          margin-top: 1rem;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 
            0 15px 25px rgba(59, 130, 246, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .submit-button.offline {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          box-shadow: 
            0 10px 20px rgba(245, 158, 11, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .submit-button.offline:hover:not(:disabled) {
          box-shadow: 
            0 15px 25px rgba(245, 158, 11, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .button-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .offline-message {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #f59e0b;
          border-radius: 16px;
          padding: 1rem;
          margin-top: 1rem;
        }

        .offline-message-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #92400e;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .offline-message-content p {
          margin: 0;
          font-size: 0.875rem;
        }

        .pending-count {
          font-size: 0.75rem;
          color: #a16207;
          margin: 0;
          font-weight: 600;
        }

        /* Summary Cards Styles */
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

        /* History Styles */
        .history-container {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 
            0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04),
            0 0 0 1px rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(226, 232, 240, 0.8);
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          border-bottom: 1px solid #e2e8f0;
        }

        .history-header-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #374151;
        }

        .history-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }

        .history-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
        }

        .history-toggle:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 12px rgba(59, 130, 246, 0.4);
        }

        .history-content {
          padding: 2rem;
        }

        /* Search Styles */
        .search-container {
          margin-bottom: 2rem;
        }

        .search-input-wrapper {
          position: relative;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          width: 20px;
          height: 20px;
          z-index: 1;
        }

        .search-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          font-size: 1rem;
          background: #ffffff;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 
            0 0 0 3px rgba(59, 130, 246, 0.1),
            0 1px 3px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }

        .search-input::placeholder {
          color: #9ca3af;
        }

        .clear-search {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          transition: all 0.2s ease;
          z-index: 1;
        }

        .clear-search:hover {
          background: #dc2626;
          transform: translateY(-50%) scale(1.1);
        }

        .search-results-info {
          margin-top: 0.75rem;
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: #64748b;
        }

        .empty-state h4 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
        }

        .empty-state p {
          margin: 0;
          font-size: 0.875rem;
        }

        /* Products Table Styles */
        .products-table-container {
          overflow-x: auto;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          background: white;
        }

        .products-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .products-table th {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e2e8f0;
          font-size: 0.875rem;
        }

        .products-table td {
          padding: 1rem;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .products-table tr:hover {
          background: #f8fafc;
        }

        .row-number {
          font-weight: 600;
          color: #64748b;
          text-align: center;
          width: 50px;
        }

        .product-name-cell {
          min-width: 200px;
        }

        .product-name-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .product-name {
          font-weight: 600;
          color: #1e293b;
        }

        .product-time {
          font-size: 0.75rem;
          color: #64748b;
        }

        .quantity-cell {
          text-align: center;
          font-weight: 600;
          color: #374151;
        }

        .type-cell {
          text-align: center;
        }

        .type-badge {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .price-cell {
          text-align: right;
          font-weight: 600;
          color: #374151;
        }

        .total-cell {
          text-align: right;
        }

        .total-price {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.875rem;
          box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
        }

        .date-cell {
          color: #64748b;
          font-size: 0.875rem;
        }

        .actions-cell {
          text-align: center;
          width: 120px;
        }

        .product-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          justify-content: center;
        }

        .edit-button {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          padding: 0.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
        }

        .edit-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
        }

        .delete-button {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          padding: 0.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
        }

        .delete-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .product-form-container,
          .history-container {
            border-radius: 16px;
            padding: 1.5rem;
          }

          .form-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .history-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .products-table-container {
            font-size: 0.75rem;
          }

          .products-table th,
          .products-table td {
            padding: 0.75rem 0.5rem;
          }

          .product-name-cell {
            min-width: 150px;
          }

          .actions-cell {
            width: 100px;
          }
        }

        @media (max-width: 480px) {
          .product-form-container,
          .history-container {
            padding: 1rem;
          }

          .history-content {
            padding: 1rem;
          }

          .search-container {
            margin-bottom: 1.5rem;
          }

          .search-input-wrapper {
            max-width: 100%;
          }

          .timeline-content {
            padding: 1rem;
          }

          .product-card {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}

