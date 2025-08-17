"use client";
import { useState, useEffect } from "react";
import { ShoppingCart, DollarSign, Plus, Minus, Calendar, ChevronDown, ChevronUp, TrendingUp, Eye, EyeOff, WifiOff, CreditCard, Receipt, Package, Edit, Trash2, AlertTriangle, Hash, User } from "lucide-react";
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

interface ProductSale {
  _id: string;
  productName: string;
  soldQuantity: number;
  pricePerUnit: number;
  totalSoldMoney: number;
  createdAt: string;
}

interface Withdrawal {
  _id: string;
  reason: string;
  amount: number;
  createdAt: string;
}

interface SalesManagementProps {
  onSuccess?: () => void;
  onDataChange?: (productSales: ProductSale[], withdrawals: Withdrawal[]) => void;
}

interface GroupedSales {
  [date: string]: {
    productSales: ProductSale[];
    withdrawals: Withdrawal[];
  };
}

interface CategoryExpansion {
  [key: string]: {
    productSales: boolean;
    withdrawals: boolean;
  };
}

export default function EnhancedSalesManagement({ onSuccess, onDataChange }: SalesManagementProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [productSales, setProductSales] = useState<ProductSale[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [categoryExpansion, setCategoryExpansion] = useState<CategoryExpansion>({});
  const [saleType, setSaleType] = useState<'product_sale' | 'withdrawal'>('product_sale');

  // Edit Mode State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editingRecordType, setEditingRecordType] = useState<'product_sale' | 'withdrawal' | null>(null);
  const [originalSaleData, setOriginalSaleData] = useState<{
    soldQuantity: number;
    productId: string;
    productName: string;
  } | null>(null);

  // Delete Confirmation Dialog State
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    record: ProductSale | Withdrawal | null;
    recordType: 'product_sale' | 'withdrawal' | null;
  }>({
    isOpen: false,
    record: null,
    recordType: null
  });
  const [deleting, setDeleting] = useState(false);

  // Product Sale Form - Single product selection
  const [productSaleData, setProductSaleData] = useState({
    productId: '',
    productName: '',
    soldQuantity: 0,
    pricePerUnit: 0,
    availableQuantity: 0
  });

  // Withdrawal Form
  const [withdrawalData, setWithdrawalData] = useState({
    reason: '',
    amount: 0
  });

  // Offline functionality
  const { isOffline, pendingCount, queueSale } = useOfflineQueue();

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🛒 Fetched products:', data.products);
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchSalesData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [productSalesResponse, withdrawalsResponse] = await Promise.all([
        fetch('/api/product-sales', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/withdrawals', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      if (productSalesResponse.ok && withdrawalsResponse.ok) {
        const productSalesData = await productSalesResponse.json();
        const withdrawalsData = await withdrawalsResponse.json();
        
        setProductSales(productSalesData.productSales || []);
        setWithdrawals(withdrawalsData.withdrawals || []);
        
        if (onDataChange) {
          onDataChange(productSalesData.productSales || [], withdrawalsData.withdrawals || []);
        }
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (showHistory) {
      fetchSalesData();
    }
  }, [showHistory]);

  // Handle rollback when component unmounts or user navigates away
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (isEditMode && editingRecordType === 'product_sale' && originalSaleData?.productId) {
        try {
          const token = localStorage.getItem('token');
          await fetch(`/api/products/update-quantity`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              productUpdates: [{
                productId: originalSaleData.productId,
                quantitySold: originalSaleData.soldQuantity // Rollback
              }]
            })
          });
        } catch (error) {
          console.error('Error rolling back on page unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isEditMode, editingRecordType, originalSaleData]);

  const handleProductSelect = (productId: string) => {
    const selectedProduct = products.find(p => p._id === productId);
    console.log('🛒 Selected product:', selectedProduct);
    if (selectedProduct) {
      const saleData = {
        productId: selectedProduct._id,
        productName: selectedProduct.name,
        soldQuantity: 0,
        pricePerUnit: selectedProduct.pricePerUnit,
        availableQuantity: selectedProduct.quantity
      };
      console.log('🛒 Setting sale data:', saleData);
      setProductSaleData(saleData);
    } else {
      console.error('❌ Product not found for ID:', productId);
      console.log('🛒 Available products:', products);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
             // Validate product sale data
       if (saleType === 'product_sale') {
         if (!productSaleData.productId || productSaleData.soldQuantity <= 0) {
           alert('Please select a product and enter a valid quantity');
           setLoading(false);
           return;
         }
         
         if (productSaleData.pricePerUnit <= 0) {
           alert('Cannot sell product with $0 price. Please update the product price first.');
           setLoading(false);
           return;
         }
         
         // For edit mode, calculate available quantity considering the original sale
         let availableQuantity = productSaleData.availableQuantity;
         if (isEditMode && originalSaleData) {
           // Add back the original sold quantity since we're editing
           availableQuantity += originalSaleData.soldQuantity;
         }
         
         if (productSaleData.soldQuantity > availableQuantity) {
           alert(`Insufficient quantity. Available: ${availableQuantity}, Requested: ${productSaleData.soldQuantity}`);
           setLoading(false);
           return;
         }
       } else {
         // Validate withdrawal data
         if (!withdrawalData.reason.trim() || withdrawalData.amount <= 0) {
           alert('Please enter a valid reason and amount for withdrawal');
           setLoading(false);
           return;
         }
       }

      const saleData = saleType === 'product_sale' 
        ? { 
            type: saleType, 
            productSales: [{
              productId: productSaleData.productId,
              productName: productSaleData.productName,
              soldQuantity: productSaleData.soldQuantity,
              pricePerUnit: productSaleData.pricePerUnit
            }]
          }
        : { type: saleType, reason: withdrawalData.reason, amount: withdrawalData.amount };

      // If offline, queue the operation
      if (isOffline) {
        console.log('📱 [OFFLINE] Queueing sale operation:', saleData);
        await queueSale(saleData);
        
        // Reset form
        if (saleType === 'product_sale') {
          setProductSaleData({
            productId: '',
            productName: '',
            soldQuantity: 0,
            pricePerUnit: 0,
            availableQuantity: 0
          });
        } else {
          setWithdrawalData({ reason: '', amount: 0 });
        }
        
        if (onSuccess) {
          onSuccess();
        }
        
        console.log('✅ [OFFLINE] Sale queued successfully');
        return;
      }

      // Online submission
      const token = localStorage.getItem('token');
      
      if (saleType === 'product_sale') {
          if (isEditMode && editingRecordId) {
            // Calculate quantity difference for product update
            const quantityDifference = productSaleData.soldQuantity - (originalSaleData?.soldQuantity || 0);
            
            // Update existing product sale
            const saleResponse = await fetch(`/api/product-sales/${editingRecordId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                productName: productSaleData.productName,
                soldQuantity: productSaleData.soldQuantity,
                pricePerUnit: productSaleData.pricePerUnit,
                totalSoldMoney: productSaleData.soldQuantity * productSaleData.pricePerUnit,
                quantityDifference: quantityDifference,
                productId: productSaleData.productId
              })
            });

            if (!saleResponse.ok) {
              throw new Error('Failed to update product sale');
            }
        } else {
          // Create new product sale
         const saleResponse = await fetch('/api/product-sales', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${token}`
           },
           body: JSON.stringify({
             productSales: [{
               productId: productSaleData.productId,
               productName: productSaleData.productName,
               soldQuantity: productSaleData.soldQuantity,
               pricePerUnit: productSaleData.pricePerUnit
             }]
           })
         });

        if (!saleResponse.ok) {
          throw new Error('Failed to record product sale');
        }

          // Then, update product quantity (only for new sales)
        const quantityResponse = await fetch('/api/products/update-quantity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            productUpdates: [{
              productId: productSaleData.productId,
              quantitySold: productSaleData.soldQuantity
            }]
          })
        });

        if (!quantityResponse.ok) {
          const quantityError = await quantityResponse.json();
          throw new Error(quantityError.error || 'Failed to update product quantity');
        }

        // Refresh products to show updated quantities
        fetchProducts();
        }
      } else {
        // Handle withdrawal
        if (isEditMode && editingRecordId) {
          // Update existing withdrawal
          const response = await fetch(`/api/withdrawals/${editingRecordId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              reason: withdrawalData.reason,
              amount: withdrawalData.amount
            })
          });

          if (!response.ok) {
            throw new Error('Failed to update withdrawal');
          }
        } else {
          // Create new withdrawal
        const response = await fetch('/api/withdrawals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            reason: withdrawalData.reason,
            amount: withdrawalData.amount
          })
        });

        if (!response.ok) {
          throw new Error('Failed to record withdrawal');
          }
        }
      }

      // Reset form and exit edit mode if editing
      if (isEditMode) {
        setIsEditMode(false);
        setEditingRecordId(null);
        setEditingRecordType(null);
        setOriginalSaleData(null);
      }

      // Reset form
      if (saleType === 'product_sale') {
        setProductSaleData({
          productId: '',
          productName: '',
          soldQuantity: 0,
          pricePerUnit: 0,
          availableQuantity: 0
        });
      } else {
        setWithdrawalData({ reason: '', amount: 0 });
      }
      
      // Refresh data after successful operation
      await fetchSalesData();
      await fetchProducts();
      
      if (showHistory) {
        fetchSalesData();
      }
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error recording sale:', error);
      
      // Fallback to offline queue
      if (!isOffline) {
        try {
          const saleData = saleType === 'product_sale' 
            ? { 
                type: saleType, 
                productSales: [{
                  productId: productSaleData.productId,
                  productName: productSaleData.productName,
                  soldQuantity: productSaleData.soldQuantity,
                  pricePerUnit: productSaleData.pricePerUnit
                }]
              }
            : { type: saleType, reason: withdrawalData.reason, amount: withdrawalData.amount };
          
          await queueSale(saleData);
          console.log('📱 [FALLBACK] Sale queued after online failure');
          
          // Reset form
          if (saleType === 'product_sale') {
            setProductSaleData({
              productId: '',
              productName: '',
              soldQuantity: 0,
              pricePerUnit: 0,
              availableQuantity: 0
            });
          } else {
            setWithdrawalData({ reason: '', amount: 0 });
          }
          
          if (onSuccess) {
            onSuccess();
          }
        } catch (queueError) {
          console.error('Failed to queue sale:', queueError);
          alert('Failed to record sale');
        }
      } else {
        alert(error instanceof Error ? error.message : 'Failed to record sale');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSoldQuantity = (quantity: number) => {
    setProductSaleData({
      ...productSaleData,
      soldQuantity: quantity
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
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

  const calculateTotal = () => {
    return productSaleData.soldQuantity * productSaleData.pricePerUnit;
  };

  // Edit Functions
    const handleEditRecord = async (record: ProductSale | Withdrawal, recordType: 'product_sale' | 'withdrawal') => {
    setIsEditMode(true);
    setEditingRecordId(record._id);
    setEditingRecordType(recordType);

    if (recordType === 'product_sale') {
      const saleRecord = record as ProductSale;
      
      // Find the product by name to get the productId
      const product = products.find(p => p.name === saleRecord.productName);
      
      // Store original sale data for quantity management
      setOriginalSaleData({ 
        soldQuantity: saleRecord.soldQuantity, 
        productId: product?._id || '',
        productName: saleRecord.productName
      });
      
      setProductSaleData({
        productId: product?._id || '',
        productName: saleRecord.productName,
        soldQuantity: saleRecord.soldQuantity,
        pricePerUnit: saleRecord.pricePerUnit,
        availableQuantity: (product?.quantity || 0) + saleRecord.soldQuantity // Add back sold quantity
      });
      setSaleType('product_sale');
      
      // Restore the sold quantity to the product when editing starts
      if (product?._id) {
        try {
          const token = localStorage.getItem('token');
          await fetch(`/api/products/update-quantity`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              productUpdates: [{
                productId: product._id,
                quantitySold: -saleRecord.soldQuantity // Negative to add back
              }]
            })
          });
          
          // Refresh products to show updated quantities
          await fetchProducts();
        } catch (error) {
          console.error('Error restoring product quantity for edit:', error);
        }
      }
    } else {
      const withdrawalRecord = record as Withdrawal;
      setWithdrawalData({
        reason: withdrawalRecord.reason,
        amount: withdrawalRecord.amount
      });
      setSaleType('withdrawal');
    }
  };

  const cancelEdit = async () => {
    // If we're editing a product sale, we need to rollback the quantity
    if (isEditMode && editingRecordType === 'product_sale' && originalSaleData?.productId) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`/api/products/update-quantity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            productUpdates: [{
              productId: originalSaleData.productId,
              quantitySold: originalSaleData.soldQuantity // Subtract again (rollback)
            }]
          })
        });
        
        // Refresh products to show updated quantities
        await fetchProducts();
      } catch (error) {
        console.error('Error rolling back product quantity:', error);
      }
    }
    
    setIsEditMode(false);
    setEditingRecordId(null);
    setEditingRecordType(null);
    
    // Reset form data
    setProductSaleData({
      productId: '',
      productName: '',
      soldQuantity: 0,
      pricePerUnit: 0,
      availableQuantity: 0
    });
    setWithdrawalData({
      reason: '',
      amount: 0
    });
    setOriginalSaleData(null);
  };

  // Delete Functions
  const handleDeleteRecord = (record: ProductSale | Withdrawal, recordType: 'product_sale' | 'withdrawal') => {
    setDeleteDialog({
      isOpen: true,
      record,
      recordType
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      isOpen: false,
      record: null,
      recordType: null
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.record || !deleteDialog.recordType) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      
      if (deleteDialog.recordType === 'product_sale') {
        // Delete product sale
        console.log('Deleting product sale with ID:', deleteDialog.record._id);
        const response = await fetch(`/api/product-sales/${deleteDialog.record._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Delete response error:', errorData);
          throw new Error(errorData.error || `Failed to delete product sale (${response.status})`);
        }
      } else {
        // Delete withdrawal
        const response = await fetch(`/api/withdrawals/${deleteDialog.record._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete withdrawal (${response.status})`);
        }
      }

      // Refresh data
      await fetchSalesData();
      await fetchProducts();
      
      closeDeleteDialog();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete record';
      alert(`Delete failed: ${errorMessage}`);
    } finally {
      setDeleting(false);
    }
  };

  // Group sales by date
  const groupedSales: GroupedSales = [...productSales, ...withdrawals]
    .reduce((groups, item) => {
      const date = formatDate(item.createdAt);
      if (!groups[date]) {
        groups[date] = { productSales: [], withdrawals: [] };
      }
      
      if ('productName' in item) {
        groups[date].productSales.push(item as ProductSale);
      } else {
        groups[date].withdrawals.push(item as Withdrawal);
      }
      
      return groups;
    }, {} as GroupedSales);

  const toggleDateExpansion = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const toggleCategoryExpansion = (date: string, category: 'productSales' | 'withdrawals') => {
    setCategoryExpansion(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [category]: !prev[date]?.[category]
      }
    }));
  };

  return (
    <div className="enhanced-sales-management">


      {/* Modern Sales Form */}
      <div className="sales-form-container">
        <div className="form-header">
          <div className="form-header-content">
            <div className="form-icon">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="form-title">{isEditMode ? 'Edit Sale Record' : 'Record Sale'}</h3>
              <p className="form-subtitle">{isEditMode ? 'Update sale or withdrawal information' : 'Track your sales and transactions'}</p>
            </div>
          </div>
          {isOffline && (
            <div className="offline-badge">
              <WifiOff className="w-4 h-4" />
              <span>Offline Mode</span>
            </div>
          )}
        </div>

        {/* Sale Type Toggle */}
        <div className="sale-type-toggle">
          <button
            type="button"
            onClick={() => setSaleType('product_sale')}
            className={`toggle-button ${saleType === 'product_sale' ? 'active' : ''}`}
          >
            <CreditCard className="w-4 h-4" />
            Product Sale
          </button>
          <button
            type="button"
            onClick={() => setSaleType('withdrawal')}
            className={`toggle-button ${saleType === 'withdrawal' ? 'active' : ''}`}
          >
            <Receipt className="w-4 h-4" />
            Withdrawal
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modern-form">
          {saleType === 'product_sale' ? (
            <div className="product-sales-section">
              <h4 className="section-title">
                {isEditMode ? 'Edit Product Sale' : 'Product Sale'}
              </h4>
              
              <div className="product-sale-item">
                <div className="form-grid">
                  <div className="form-field full-width">
                    <label className="field-label">
                      <Package className="w-4 h-4" />
                      Select Product
                    </label>
                    <select
                      value={productSaleData.productId}
                      onChange={(e) => handleProductSelect(e.target.value)}
                      className="field-select"
                      required
                      disabled={isEditMode}
                    >
                      <option value="">Choose a product...</option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name} - {formatCurrency(product.pricePerUnit)} 
                          (Available: {product.quantity} {product.quantityType})
                        </option>
                      ))}
                      {/* Show the product being edited if it's not in the current products list */}
                      {isEditMode && !products.find(p => p._id === productSaleData.productId) && productSaleData.productName && (
                        <option value={productSaleData.productId} disabled>
                          {productSaleData.productName} - {formatCurrency(productSaleData.pricePerUnit)} (Editing)
                        </option>
                      )}
                    </select>
                  </div>

                  {(productSaleData.productId || (isEditMode && productSaleData.productName)) && (
                    <>
                      <div className="form-field">
                        <label className="field-label">Quantity to Sell</label>
                        <input
                          type="number"
                          value={productSaleData.soldQuantity}
                          onChange={(e) => updateSoldQuantity(parseInt(e.target.value) || 0)}
                          className="field-input"
                          placeholder="0"
                          min="0"
                          max={isEditMode && originalSaleData 
                            ? productSaleData.availableQuantity + originalSaleData.soldQuantity 
                            : productSaleData.availableQuantity}
                          required
                        />
                        <p className="field-hint">
                          Available: {isEditMode && originalSaleData 
                            ? productSaleData.availableQuantity + originalSaleData.soldQuantity 
                            : productSaleData.availableQuantity}
                        </p>
                      </div>
                      
                      <div className="form-field">
                        <label className="field-label">Price Per Unit</label>
                        <input
                          type="number"
                          step="0.01"
                          value={productSaleData.pricePerUnit}
                          className="field-input"
                          readOnly
                        />
                        <p className="field-hint">
                          Auto-filled from product data
                        </p>
                        {productSaleData.pricePerUnit === 0 && (
                          <p className="field-error">
                            ⚠️ Warning: This product has a price of $0. Please check the product settings.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {productSaleData.soldQuantity > 0 && productSaleData.pricePerUnit > 0 && (
                  <div className="total-preview">
                    <div className="total-preview-content">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="total-label">Sale Total</p>
                        <p className="total-amount">{formatCurrency(calculateTotal())}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="withdrawal-section">
              <h4 className="section-title">
                {isEditMode ? 'Edit Withdrawal' : 'Withdrawal'}
              </h4>
              <div className="form-grid">
                <div className="form-field full-width">
                  <label className="field-label">
                    <Receipt className="w-4 h-4" />
                    Withdrawal Reason
                  </label>
                  <textarea
                    value={withdrawalData.reason}
                    onChange={(e) => setWithdrawalData({ ...withdrawalData, reason: e.target.value })}
                    className="field-textarea"
                    placeholder="Enter reason for withdrawal"
                    rows={3}
                    required
                  />
                </div>
                
                <div className="form-field">
                  <label className="field-label">
                    <DollarSign className="w-4 h-4" />
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={withdrawalData.amount}
                    onChange={(e) => setWithdrawalData({ ...withdrawalData, amount: parseFloat(e.target.value) || 0 })}
                    className="field-input"
                    placeholder="0.00"
                    min="0"
                    required
                  />
                </div>
              </div>

              {withdrawalData.amount > 0 && (
                <div className="total-preview withdrawal-preview">
                  <div className="total-preview-content">
                    <Receipt className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="total-label">Withdrawal Amount</p>
                      <p className="total-amount">{formatCurrency(withdrawalData.amount)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`submit-button ${isOffline ? 'offline' : ''} ${saleType === 'withdrawal' ? 'withdrawal' : ''}`}
          >
            {loading ? (
              <div className="button-content">
                <div className="loading-spinner"></div>
                {isOffline ? 'Saving Offline...' : (isEditMode ? 'Updating...' : 'Recording Sale...')}
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
                        Update {saleType === 'product_sale' ? 'Sale' : 'Withdrawal'}
                  </>
                ) : (
                  <>
                    {saleType === 'product_sale' ? <ShoppingCart className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
                    Record {saleType === 'product_sale' ? 'Sale' : 'Withdrawal'}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </button>

          {/* Cancel Button for Edit Mode */}
          {isEditMode && (
            <button
              type="button"
              onClick={cancelEdit}
              disabled={loading}
              className="cancel-button"
            >
              Cancel Edit
            </button>
          )}
          
          {/* Offline Status Message */}
          {isOffline && (
            <div className="offline-message">
              <div className="offline-message-content">
                <WifiOff className="w-4 h-4 text-amber-600" />
                <p>You are offline. Sales will be saved locally and synced when connection is restored.</p>
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

      {/* Sales History */}
      <div className="history-container">
        <div className="history-header">
          <div className="history-header-content">
            <Calendar className="w-5 h-5" />
            <h3 className="history-title">Sales History</h3>
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
            {Object.keys(groupedSales).length === 0 ? (
              <div className="empty-state">
                <ShoppingCart className="w-16 h-16 text-slate-300" />
                <h4>No Sales Yet</h4>
                <p>Start recording sales to see them here</p>
              </div>
            ) : (
              <div className="history-timeline">
                {Object.entries(groupedSales)
                  .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                  .map(([date, dateSales]) => {
                    const totalItems = dateSales.productSales.length + dateSales.withdrawals.length;
                    return (
                      <div key={date} className="timeline-group">
                        <button
                          onClick={() => toggleDateExpansion(date)}
                          className="timeline-header"
                        >
                          <div className="timeline-date">
                            <Calendar className="w-4 h-4" />
                            <span>{date}</span>
                            <span className="transaction-count">({totalItems} transactions)</span>
                          </div>
                          {expandedDates.has(date) ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                        
                                                 {expandedDates.has(date) && (
                           <div className="timeline-content">
                             {/* Product Sales Category */}
                             {dateSales.productSales.length > 0 && (
                               <div className="category-section">
                                 <button
                                   onClick={() => toggleCategoryExpansion(date, 'productSales')}
                                   className="category-header"
                                 >
                                   <div className="category-info">
                                     <ShoppingCart className="w-4 h-4" />
                                     <span>Product Sales ({dateSales.productSales.length})</span>
                                   </div>
                                   {categoryExpansion[date]?.productSales ? (
                                     <ChevronUp className="w-4 h-4" />
                                   ) : (
                                     <ChevronDown className="w-4 h-4" />
                                   )}
                                 </button>
                                 
                                 {categoryExpansion[date]?.productSales && (
                                   <div className="category-items">
                                     {dateSales.productSales.map((sale) => (
                                       <div key={sale._id} className="sale-card product-sale">
                                         <div className="sale-card-header">
                                           <div className="sale-info">
                                             <div className="sale-type-badge product">
                                               <ShoppingCart className="w-3 h-3" />
                                               Product Sale
                                             </div>
                                             <h4 className="sale-name">{sale.productName}</h4>
                                             <p className="sale-time">{formatTime(sale.createdAt)}</p>
                                           </div>
                                           <div className="sale-actions">
                                             <button
                                               onClick={() => handleEditRecord(sale, 'product_sale')}
                                               className="edit-button"
                                               title="Edit Sale"
                                             >
                                               <Edit className="w-4 h-4" />
                                             </button>
                                             <button
                                               onClick={() => handleDeleteRecord(sale, 'product_sale')}
                                               className="delete-button"
                                               title="Delete Sale"
                                             >
                                               <Trash2 className="w-4 h-4" />
                                             </button>
                                             <div className="sale-value">
                                               {formatCurrency(sale.totalSoldMoney)}
                                             </div>
                                           </div>
                                         </div>
                                         <div className="sale-details">
                                           <div className="detail-item">
                                             <span className="detail-label">Quantity:</span>
                                             <span className="detail-value">{sale.soldQuantity}</span>
                                           </div>
                                           <div className="detail-item">
                                             <span className="detail-label">Unit Price:</span>
                                             <span className="detail-value">{formatCurrency(sale.pricePerUnit)}</span>
                                           </div>
                                         </div>
                                       </div>
                                     ))}
                                   </div>
                                 )}
                               </div>
                             )}
                             
                             {/* Withdrawals Category */}
                             {dateSales.withdrawals.length > 0 && (
                               <div className="category-section">
                                 <button
                                   onClick={() => toggleCategoryExpansion(date, 'withdrawals')}
                                   className="category-header"
                                 >
                                   <div className="category-info">
                                     <Receipt className="w-4 h-4" />
                                     <span>Withdrawals ({dateSales.withdrawals.length})</span>
                                   </div>
                                   {categoryExpansion[date]?.withdrawals ? (
                                     <ChevronUp className="w-4 h-4" />
                                   ) : (
                                     <ChevronDown className="w-4 h-4" />
                                   )}
                                 </button>
                                 
                                 {categoryExpansion[date]?.withdrawals && (
                                   <div className="category-items">
                                     {dateSales.withdrawals.map((withdrawal) => (
                                       <div key={withdrawal._id} className="sale-card withdrawal">
                                         <div className="sale-card-header">
                                           <div className="sale-info">
                                             <div className="sale-type-badge withdrawal">
                                               <Receipt className="w-3 h-3" />
                                               Withdrawal
                                             </div>
                                             <h4 className="sale-name">{withdrawal.reason}</h4>
                                             <p className="sale-time">{formatTime(withdrawal.createdAt)}</p>
                                           </div>
                                           <div className="sale-actions">
                                             <button
                                               onClick={() => handleEditRecord(withdrawal, 'withdrawal')}
                                               className="edit-button"
                                               title="Edit Withdrawal"
                                             >
                                               <Edit className="w-4 h-4" />
                                             </button>
                                             <button
                                               onClick={() => handleDeleteRecord(withdrawal, 'withdrawal')}
                                               className="delete-button"
                                               title="Delete Withdrawal"
                                             >
                                               <Trash2 className="w-4 h-4" />
                                             </button>
                                             <div className="sale-value withdrawal">
                                               -{formatCurrency(withdrawal.amount)}
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
                         )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteDialog.isOpen && deleteDialog.record && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl border-0 w-full max-w-lg animate-slideIn" style={{ backgroundColor: '#ffffff' }}>
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 bg-white rounded-t-2xl" style={{ backgroundColor: '#ffffff' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Are you sure you want to delete this {deleteDialog.recordType === 'product_sale' ? 'sale' : 'withdrawal'}?
                  </p>
                </div>
                <button
                  onClick={closeDeleteDialog}
                  className="w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors bg-white rounded-full border border-gray-200 flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: '#ffffff' }}
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="px-8 py-6 bg-white rounded-b-2xl" style={{ backgroundColor: '#ffffff' }}>
              {/* Record Details */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                <div className="space-y-2">
                  {deleteDialog.recordType === 'product_sale' && 'productName' in deleteDialog.record ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-700">Product:</span>
                        <span className="text-gray-900">{deleteDialog.record.productName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-700">Quantity:</span>
                        <span className="text-gray-900">{deleteDialog.record.soldQuantity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-700">Total:</span>
                        <span className="text-gray-900">${deleteDialog.record.totalSoldMoney}</span>
                      </div>
                    </>
                  ) : deleteDialog.recordType === 'withdrawal' && 'reason' in deleteDialog.record ? (
                    <>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-700">Amount:</span>
                        <span className="text-gray-900">${deleteDialog.record.amount}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-700">Reason:</span>
                        <span className="text-gray-900">{deleteDialog.record.reason}</span>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={closeDeleteDialog}
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
                    `Delete ${deleteDialog.recordType === 'product_sale' ? 'Sale' : 'Withdrawal'}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .enhanced-sales-management {
          max-width: 100%;
          margin: 0 auto;
          space-y: 2rem;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-slideIn {
          animation: slideIn 0.2s ease-out;
        }

        /* Sales Form Styles */
        .sales-form-container {
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
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
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

        .sale-type-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          background: #f1f5f9;
          padding: 0.5rem;
          border-radius: 16px;
          margin-bottom: 2rem;
        }

        .toggle-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
          color: #64748b;
        }

        .toggle-button.active {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
        }

        .toggle-button:hover:not(.active) {
          background: #e2e8f0;
        }

        .modern-form {
          space-y: 1.5rem;
        }

        .section-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 1.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .product-sale-item {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1rem;
          transition: all 0.2s ease;
        }

        .product-sale-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .item-number {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .remove-item-btn {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          padding: 0.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .remove-item-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
        }

        .item-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
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
          margin-bottom: 0.5rem;
        }

        .field-input, .field-textarea, .field-select {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 0.875rem;
          background: #ffffff;
          transition: all 0.2s ease;
        }

        .field-input:focus, .field-textarea:focus, .field-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .field-hint {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.25rem;
          font-style: italic;
        }

        .field-error {
          font-size: 0.75rem;
          color: #dc2626;
          margin-top: 0.25rem;
          font-weight: 600;
        }

        .field-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .item-total {
          text-align: right;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
          font-weight: 700;
          color: #059669;
        }

        .add-item-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          color: white;
          border: none;
          padding: 1rem;
          border-radius: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 1rem;
        }

        .add-item-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 16px rgba(6, 182, 212, 0.3);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .total-preview {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 20px;
          padding: 1.5rem;
          margin: 1.5rem 0;
          box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);
        }

        .total-preview.withdrawal-preview {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          box-shadow: 0 10px 20px rgba(245, 158, 11, 0.3);
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
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 20px;
          padding: 1.25rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 
            0 10px 20px rgba(16, 185, 129, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          margin-top: 1rem;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 
            0 15px 25px rgba(16, 185, 129, 0.4),
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

        .submit-button.withdrawal {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          box-shadow: 
            0 10px 20px rgba(245, 158, 11, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .submit-button.offline:hover:not(:disabled),
        .submit-button.withdrawal:hover:not(:disabled) {
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
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
        }

        .history-toggle:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 12px rgba(16, 185, 129, 0.4);
        }

        .history-content {
          padding: 2rem;
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

        .history-timeline {
          space-y: 1.5rem;
        }

        .timeline-group {
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 1.5rem;
        }

        .timeline-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .timeline-header:hover {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        }

        .timeline-date {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #374151;
          font-weight: 600;
        }

        .transaction-count {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

                 .timeline-content {
           padding: 1.5rem;
           background: #ffffff;
           border-top: 1px solid #e2e8f0;
           space-y: 1rem;
         }

         .category-section {
           margin-bottom: 1.5rem;
         }

         .category-header {
           width: 100%;
           display: flex;
           justify-content: space-between;
           align-items: center;
           padding: 1rem 1.25rem;
           background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
           border: 1px solid #e2e8f0;
           border-radius: 12px;
           cursor: pointer;
           transition: all 0.2s ease;
           text-align: left;
           margin-bottom: 0.75rem;
         }

         .category-header:hover {
           background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
           transform: translateY(-1px);
           box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
         }

         .category-info {
           display: flex;
           align-items: center;
           gap: 0.75rem;
           color: #374151;
           font-weight: 600;
           font-size: 0.875rem;
         }

         .category-items {
           padding-left: 0.5rem;
           space-y: 0.75rem;
         }

        .sale-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.2s ease;
          margin-bottom: 1rem;
        }

        .sale-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
          border-color: #3b82f6;
        }

        .sale-card.withdrawal {
          border-left: 4px solid #f59e0b;
        }

        .sale-card.product-sale {
          border-left: 4px solid #10b981;
        }

        .sale-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .sale-type-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .sale-type-badge.product {
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
          color: #15803d;
        }

        .sale-type-badge.withdrawal {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #a16207;
        }

        .sale-name {
          font-size: 1.125rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 0.25rem 0;
        }

        .sale-time {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0;
        }

        .sale-value {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1.125rem;
          box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
        }

        .sale-value.withdrawal {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          box-shadow: 0 4px 8px rgba(245, 158, 11, 0.3);
        }

        .sale-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .detail-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .detail-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .sale-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-left: auto;
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
          .sales-form-container,
          .history-container {
            border-radius: 16px;
            padding: 1.5rem;
          }

          .form-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .sale-type-toggle {
            grid-template-columns: 1fr;
            gap: 0.25rem;
          }

          .item-grid,
          .form-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .history-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .timeline-header {
            flex-direction: column;
            gap: 0.75rem;
            align-items: flex-start;
          }

          .sale-card-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .sale-details {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .sales-form-container,
          .history-container {
            padding: 1rem;
          }

          .history-content {
            padding: 1rem;
          }

          .timeline-content {
            padding: 1rem;
          }

          .sale-card,
          .product-sale-item {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}

