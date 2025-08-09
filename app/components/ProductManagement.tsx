"use client";
import { useState, useEffect } from "react";
import { Package, Eye, EyeOff, WifiOff } from "lucide-react";
import { useOfflineQueue } from "../../providers/OfflineProvider";

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

export default function ProductManagement({ onSuccess, onDataChange }: ProductManagementProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    quantity: 0,
    quantityType: "single" as "pack" | "single" | "box" | "bottle" | "piece",
    pricePerUnit: 0
  });

  // Offline functionality
  const { isOffline, pendingCount, queueProduct } = useOfflineQueue();

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
    }
  }, [showHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        ...formData,
        totalPrice: formData.quantity * formData.pricePerUnit
      };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  return (
    <div className="space-y-4">
      {/* Product Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Add New Product</h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
                placeholder="Enter product name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.quantityType}
                onChange={(e) => setFormData({ ...formData, quantityType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
                required
              >
                <option value="single">Single</option>
                <option value="pack">Pack</option>
                <option value="box">Box</option>
                <option value="bottle">Bottle</option>
                <option value="piece">Piece</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price/Unit
              </label>
              <input
                type="number"
                value={formData.pricePerUnit}
                onChange={(e) => setFormData({ ...formData, pricePerUnit: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          {formData.quantity > 0 && formData.pricePerUnit > 0 && (
            <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
              <div className="text-sm text-gray-600">Total Price:</div>
              <div className="text-lg sm:text-xl font-semibold text-green-600">
                {formatCurrency(calculateTotalPrice())}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full px-4 py-3 text-sm font-medium text-white rounded-lg focus:outline-none disabled:opacity-50 transition-colors ${
              isOffline 
                ? 'bg-amber-600 hover:bg-amber-700 focus:bg-amber-700'
                : 'bg-green-600 hover:bg-green-700 focus:bg-green-700'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isOffline ? 'Saving Offline...' : 'Adding...'}
              </div>
            ) : (
              <div className="flex items-center justify-center">
                {isOffline ? (
                  <>
                    <WifiOff className="w-4 h-4 mr-2" />
                    Save Offline
                  </>
                ) : (
                  'Add Product'
                )}
              </div>
            )}
          </button>
          
          {/* Offline status message */}
          {isOffline && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <WifiOff className="w-4 h-4 text-amber-600" />
                <p className="text-sm text-amber-700 font-medium">
                  You are offline. Products will be saved locally and synced when connection is restored.
                </p>
              </div>
              {pendingCount > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  {pendingCount} operations waiting to sync
                </p>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Products History */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h4 className="font-medium text-gray-900">Products History</h4>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:border-green-500 transition-colors"
          >
            {showHistory ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {showHistory ? 'Hide History' : 'View History'}
          </button>
        </div>
        
        {showHistory && (
          <div className="divide-y divide-gray-200">
            {products.length === 0 ? (
              <div className="px-4 sm:px-6 py-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No products added yet</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {products.map((product) => (
                  <div key={product._id} className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                          <div className="text-sm text-gray-600">
                            {product.quantity} {product.quantityType}s
                          </div>
                          <div className="hidden sm:block text-gray-400">•</div>
                          <div className="text-xs text-gray-500">
                            {formatDate(product.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(product.totalPrice)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(product.pricePerUnit)} per {product.quantityType}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
