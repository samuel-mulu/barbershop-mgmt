"use client";
import { useState, useEffect } from "react";
import { ShoppingCart, DollarSign, Calendar, Eye, EyeOff, Plus, Minus, WifiOff, Download, X } from "lucide-react";
import { useOfflineQueue } from "../../providers/OfflineProvider";
import ImageUpload from "./ImageUpload";

interface Product {
  _id: string;
  name: string;
  quantity: number;
  quantityType: string;
  pricePerUnit: number;
}

interface ProductSale {
  _id: string;
  productName: string;
  soldQuantity: number;
  pricePerUnit: number;
  totalSoldMoney: number;
  productId: string;
  createdAt: string;
  by?: 'cash' | 'mobile banking(telebirr)';
  paymentImageUrl?: string;
}

interface Withdrawal {
  _id: string;
  reason: string;
  amount: number;
  createdAt: string;
}

interface ProductSaleForm {
  productId: string;
  soldQuantity: number;
}

interface SalesManagementProps {
  onSuccess?: () => void;
  onDataChange?: (productSales: ProductSale[], withdrawals: Withdrawal[]) => void;
}

export default function SalesManagement({ onSuccess, onDataChange }: SalesManagementProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [productSales, setProductSales] = useState<ProductSale[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saleType, setSaleType] = useState<'product_sale' | 'withdrawal'>('product_sale');
  const [productSalesForm, setProductSalesForm] = useState<ProductSaleForm[]>([]);
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile banking(telebirr)">("cash");
  const [paymentImageUrl, setPaymentImageUrl] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Offline functionality
  const { isOffline, pendingCount, queueSale } = useOfflineQueue();

  const fetchSalesData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch product sales
      const productSalesResponse = await fetch('/api/product-sales', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Fetch withdrawals
      const withdrawalsResponse = await fetch('/api/withdrawals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (productSalesResponse.ok) {
        const productSalesData = await productSalesResponse.json();
        setProductSales(productSalesData.productSales || []);
      }
      
      if (withdrawalsResponse.ok) {
        const withdrawalsData = await withdrawalsResponse.json();
        setWithdrawals(withdrawalsData.withdrawals || []);
      }

      // Notify parent component of data changes
      if (onDataChange) {
        const productSalesData = productSalesResponse.ok ? (await productSalesResponse.json()).productSales || [] : [];
        const withdrawalsData = withdrawalsResponse.ok ? (await withdrawalsResponse.json()).withdrawals || [] : [];
        onDataChange(productSalesData, withdrawalsData);
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

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
        console.log('🛒 Fetched products for sales:', data.products);
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    if (showHistory) {
      fetchSalesData();
    }
    if (saleType === 'product_sale') {
      fetchProducts();
    }
  }, [showHistory, saleType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate product sales
      if (saleType === 'product_sale') {
        for (const sale of productSalesForm) {
          const product = getProductById(sale.productId);
          if (!product) {
            alert(`Product not found for sale ${sale.productId}`);
            setLoading(false);
            return;
          }
          if (product.pricePerUnit <= 0) {
            alert(`Cannot sell product "${product.name}" with $0 price. Please update the product price first.`);
            setLoading(false);
            return;
          }
          if (sale.soldQuantity > product.quantity) {
            alert(`Insufficient quantity for "${product.name}". Available: ${product.quantity}, Requested: ${sale.soldQuantity}`);
            setLoading(false);
            return;
          }
        }
        
        // Validate payment method for product sales
        if (paymentMethod === "mobile banking(telebirr)" && !paymentImageUrl) {
          alert("Payment proof image is required for Mobile Banking (Telebirr) payments.");
          setLoading(false);
          return;
        }
      }

      // Prepare sale data
      const saleData = saleType === 'product_sale' 
        ? { 
            type: 'product_sale' as const, 
            productSales: productSalesForm,
            by: paymentMethod,
            paymentImageUrl: paymentImageUrl || undefined
          }
        : { type: 'withdrawal' as const, reason: withdrawalReason, amount: withdrawalAmount };

      // If offline, queue the operation
      if (isOffline) {
        console.log('📱 [OFFLINE] Queueing sale operation:', saleData);
        await queueSale(saleData);
        
        // Reset form
        setSaleType('product_sale');
        setProductSalesForm([]);
        setWithdrawalReason('');
        setWithdrawalAmount(0);
        setPaymentMethod('cash');
        setPaymentImageUrl('');
        
        if (onSuccess) {
          onSuccess();
        }
        
        console.log('✅ [OFFLINE] Sale queued successfully');
        return;
      }

      // Online - proceed with normal submission
      const token = localStorage.getItem('token');
      let response;

      if (saleType === 'product_sale') {
        // Use separate product sales endpoint
        console.log('🛒 Sending product sales data:', { 
          productSales: productSalesForm,
          by: paymentMethod,
          paymentImageUrl: paymentImageUrl || undefined
        });
        response = await fetch('/api/product-sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            productSales: productSalesForm,
            by: paymentMethod,
            paymentImageUrl: paymentImageUrl || undefined
          })
        });
      } else {
        // Use separate withdrawals endpoint
        response = await fetch('/api/withdrawals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            reason: withdrawalReason, 
            amount: withdrawalAmount 
          })
        });
      }

      if (response.ok) {
        await response.json();
        setSaleType('product_sale');
        setProductSalesForm([]);
        setWithdrawalReason('');
        setWithdrawalAmount(0);
        setPaymentMethod('cash');
        setPaymentImageUrl('');
        if (showHistory) {
          fetchSalesData();
        }
        if (saleType === 'product_sale') {
          fetchProducts(); // Refresh products to update quantities
        }
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const error = await response.json();
        const errorMessage = error.error || 'Failed to record sale';
        console.error('❌ Sale failed:', errorMessage);
        
        // Show more specific error messages
        if (errorMessage.includes('Insufficient quantity')) {
          alert(`❌ Sale Failed: ${errorMessage}\n\nPlease check product inventory and try again.`);
        } else if (errorMessage.includes('Product not found')) {
          alert(`❌ Sale Failed: ${errorMessage}\n\nThis product may have been deleted or moved.`);
        } else {
          alert(`❌ Sale Failed: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('Error recording sale:', error);
      
      // If online submission fails, try to queue offline
      if (!isOffline) {
        try {
          const saleData = saleType === 'product_sale' 
            ? { type: 'product_sale' as const, productSales: productSalesForm }
            : { type: 'withdrawal' as const, reason: withdrawalReason, amount: withdrawalAmount };
          
          await queueSale(saleData);
          console.log('📱 [FALLBACK] Sale queued after online failure');
          
          // Reset form
          setSaleType('product_sale');
          setProductSalesForm([]);
          setWithdrawalReason('');
          setWithdrawalAmount(0);
          setPaymentMethod('cash');
          setPaymentImageUrl('');
          
          if (onSuccess) {
            onSuccess();
          }
        } catch (queueError) {
          console.error('Failed to queue sale:', queueError);
          alert('Failed to record sale');
        }
      } else {
      alert('Failed to record sale');
      }
    } finally {
      setLoading(false);
    }
  };

  const addProductSale = () => {
    setProductSalesForm([...productSalesForm, { productId: '', soldQuantity: 1 }]);
  };

  const removeProductSale = (index: number) => {
    setProductSalesForm(productSalesForm.filter((_, i) => i !== index));
  };

  const updateProductSale = (index: number, field: keyof ProductSaleForm, value: string | number) => {
    const updated = [...productSalesForm];
    updated[index] = { ...updated[index], [field]: value };
    
    // If product is selected, validate quantity immediately
    if (field === 'productId' && value) {
      const product = getProductById(value as string);
      if (product && product.quantity <= 0) {
        alert(`⚠️ Warning: "${product.name}" is out of stock (${product.quantity} available). Please add inventory first.`);
      }
    }
    
    // If quantity is being updated, validate against available stock
    if (field === 'soldQuantity' && updated[index].productId) {
      const product = getProductById(updated[index].productId);
      if (product && (value as number) > product.quantity) {
        alert(`⚠️ Warning: Requested quantity (${value}) exceeds available stock (${product.quantity}) for "${product.name}".`);
      }
    }
    
    setProductSalesForm(updated);
  };

  const getProductById = (productId: string) => {
    return products.find(p => p._id === productId);
  };

  const calculateTotalSaleAmount = () => {
    return productSalesForm.reduce((total, sale) => {
      const product = getProductById(sale.productId);
      console.log('🛒 Calculating total for sale:', sale, 'Product:', product);
      if (product && product.pricePerUnit === 0) {
        console.warn('⚠️ Product has $0 price:', product);
      }
      return total + (product ? sale.soldQuantity * product.pricePerUnit : 0);
    }, 0);
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

  const downloadPaymentProof = (imageUrl: string, productName: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `payment-proof-${productName}-${new Date().toISOString().split('T')[0]}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Combine and sort all sales data for display
  const allSalesData = [
    ...productSales.map(sale => ({
      ...sale,
      type: 'product_sale' as const,
      displayName: sale.productName,
      amount: sale.totalSoldMoney,
      isRevenue: true,
      paymentMethod: sale.by || 'cash',
      paymentImageUrl: sale.paymentImageUrl
    })),
    ...withdrawals.map(withdrawal => ({
      ...withdrawal,
      type: 'withdrawal' as const,
      displayName: withdrawal.reason,
      amount: withdrawal.amount,
      isRevenue: false,
      paymentMethod: 'cash' as const,
      paymentImageUrl: undefined
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      {/* Sales Form */}
      <div className="bg-gradient-to-br from-white via-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 rounded-xl flex items-center justify-center shadow-lg">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Record Sale</h4>
            <p className="text-sm text-purple-600 font-medium">Add new product sales or withdrawals</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sale Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-purple-700 mb-3">
              Choose Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSaleType('product_sale')}
                className={`relative p-5 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                  saleType === 'product_sale'
                    ? 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-emerald-300 text-emerald-700 shadow-lg'
                    : 'bg-white border-purple-200 text-purple-600 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                    saleType === 'product_sale' ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-purple-100'
                  }`}>
                    <ShoppingCart className={`w-5 h-5 ${saleType === 'product_sale' ? 'text-white' : 'text-purple-500'}`} />
                  </div>
                  <span className="text-sm font-semibold">Product Sale</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setSaleType('withdrawal')}
                className={`relative p-5 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                  saleType === 'withdrawal'
                    ? 'bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 border-amber-300 text-amber-700 shadow-lg'
                    : 'bg-white border-purple-200 text-purple-600 hover:border-amber-300 hover:bg-amber-50 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                    saleType === 'withdrawal' ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-purple-100'
                  }`}>
                    <DollarSign className={`w-5 h-5 ${saleType === 'withdrawal' ? 'text-white' : 'text-purple-500'}`} />
                  </div>
                  <span className="text-sm font-semibold">Withdrawal</span>
                </div>
              </button>
            </div>
          </div>

          {saleType === 'product_sale' ? (
            /* Product Sale Form */
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Products Sold
                </label>
                  <p className="text-xs text-gray-500">Select products and quantities</p>
                </div>
                <button
                  type="button"
                  onClick={addProductSale}
                  className="flex items-center justify-center px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Product
                </button>
              </div>

              {productSalesForm.length === 0 ? (
                <div className="text-center py-16 text-purple-400 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-dashed border-purple-200">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingCart className="w-10 h-10 text-purple-400" />
                  </div>
                  <p className="text-xl font-semibold text-purple-600 mb-3">No products selected</p>
                  <p className="text-sm text-purple-500">Click &quot;Add Product&quot; to start recording sales</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {productSalesForm.map((sale, index) => (
                    <div key={index} className="bg-gradient-to-br from-white to-purple-50 rounded-2xl border border-purple-100 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 rounded-xl flex items-center justify-center shadow-md">
                            <span className="text-white text-sm font-bold">{index + 1}</span>
                          </div>
                          <span className="text-lg font-bold text-purple-700">
                          Product {index + 1}
                        </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeProductSale(index)}
                          className="text-red-500 hover:text-red-700 p-3 rounded-xl hover:bg-red-50 transition-all duration-300 transform hover:scale-110"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-purple-700 mb-2">Product</label>
                          <select
                            value={sale.productId}
                            onChange={(e) => updateProductSale(index, 'productId', e.target.value)}
                            className="w-full px-4 py-3 text-sm border border-purple-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-300 bg-white"
                            required
                          >
                            <option value="">Select Product</option>
                            {products.map((product) => (
                              <option 
                                key={product._id} 
                                value={product._id}
                                disabled={product.quantity <= 0}
                                className={product.quantity <= 0 ? 'text-gray-400' : ''}
                              >
                                {product.name} - ${product.pricePerUnit} ({product.quantity} {product.quantityType}s)
                                {product.quantity <= 0 ? ' - OUT OF STOCK' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-purple-700 mb-2">Quantity</label>
                          <input
                            type="number"
                            value={sale.soldQuantity}
                            onChange={(e) => updateProductSale(index, 'soldQuantity', parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-3 text-sm border border-purple-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-300 bg-white"
                            placeholder="e.g., 1, 5, 10"
                            min="1"
                            required
                          />
                        </div>
                      </div>

                      {sale.productId && (
                        <>
                          {/* Out of Stock Warning */}
                          {(() => {
                            const product = getProductById(sale.productId);
                            if (product && product.quantity <= 0) {
                              return (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                                  <div className="flex items-center gap-2">
                                    <span className="text-red-600 font-bold">🚫</span>
                                    <span className="text-sm text-red-700 font-semibold">
                                      OUT OF STOCK: "{product.name}" has {product.quantity} quantity available.
                                    </span>
                                  </div>
                                  <p className="text-xs text-red-600 mt-1">
                                    Please add inventory before selling this product.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Scroll to product management section
                                      const productSection = document.querySelector('[data-section="addProduct"]');
                                      if (productSection) {
                                        productSection.scrollIntoView({ behavior: 'smooth' });
                                      }
                                    }}
                                    className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                                  >
                                    📦 Manage Inventory
                                  </button>
                                </div>
                              );
                            }
                            return null;
                          })()}
                          
                          <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 rounded-xl border border-emerald-200 shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-emerald-700">Item Total:</span>
                              <span className="text-xl font-bold text-emerald-600">
                            {(() => {
                              const product = getProductById(sale.productId);
                              if (product) {
                                const total = sale.soldQuantity * product.pricePerUnit;
                                    return formatCurrency(total);
                              }
                              return '';
                            })()}
                              </span>
                            </div>
                          </div>
                          
                          {/* Warning for $0 price products */}
                          {(() => {
                            const product = getProductById(sale.productId);
                            if (product && product.pricePerUnit <= 0) {
                              return (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                                  <div className="flex items-center gap-2">
                                    <span className="text-red-600 font-bold">⚠️</span>
                                    <span className="text-sm text-red-700 font-semibold">
                                      This product has a price of $0. Please update the product price before selling.
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Payment Method Selection */}
              {productSalesForm.length > 0 && (
                <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl border border-purple-100 p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 rounded-xl flex items-center justify-center shadow-md">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h5 className="text-lg font-bold text-purple-700">Payment Method</h5>
                      <p className="text-sm text-purple-600">Choose how the customer paid</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <label className={`flex items-center space-x-3 cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                      paymentMethod === "cash"
                        ? 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-emerald-300 text-emerald-700 shadow-lg'
                        : 'bg-white border-purple-200 text-purple-600 hover:border-emerald-300 hover:bg-emerald-50'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === "cash"}
                        onChange={(e) => {
                          setPaymentMethod(e.target.value as "cash" | "mobile banking(telebirr)");
                          setPaymentImageUrl(""); // Clear image when switching to cash
                        }}
                        className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 focus:ring-emerald-500"
                      />
                      <span className="text-sm font-semibold">💵 Cash</span>
                    </label>
                    <label className={`flex items-center space-x-3 cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                      paymentMethod === "mobile banking(telebirr)"
                        ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-300 text-blue-700 shadow-lg'
                        : 'bg-white border-purple-200 text-purple-600 hover:border-blue-300 hover:bg-blue-50'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="mobile banking(telebirr)"
                        checked={paymentMethod === "mobile banking(telebirr)"}
                        onChange={(e) => setPaymentMethod(e.target.value as "cash" | "mobile banking(telebirr)")}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-semibold">📱 Mobile Banking (Telebirr)</span>
                    </label>
                  </div>

                  {/* Image Upload for Mobile Banking */}
                  {paymentMethod === "mobile banking(telebirr)" && (
                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-blue-700 mb-3">
                        Payment Proof (Required)
                      </label>
                      <p className="text-sm text-blue-600 mb-3">
                        Please upload a screenshot or photo of your mobile banking payment confirmation
                      </p>
                      <ImageUpload
                        onImageUpload={setPaymentImageUrl}
                        onImageRemove={() => setPaymentImageUrl("")}
                        currentImageUrl={paymentImageUrl}
                        disabled={loading}
                      />
                    </div>
                  )}
                </div>
              )}

              {productSalesForm.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 p-6 rounded-2xl border border-emerald-200 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-emerald-700 mb-2">Total Sale Amount</div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {formatCurrency(calculateTotalSaleAmount())}
                      </div>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                      <DollarSign className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Withdrawal Form */
            <div className="space-y-5">
                          <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 p-6 rounded-2xl border border-amber-200 shadow-lg">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 via-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h5 className="text-xl font-bold text-amber-800">Withdrawal Details</h5>
                  <p className="text-sm text-amber-600 font-medium">Record cash withdrawal from business</p>
                </div>
              </div>
                
            <div className="space-y-4">
              <div>
                    <label className="block text-sm font-semibold text-amber-700 mb-2">
                  Withdrawal Reason
                </label>
                <textarea
                  value={withdrawalReason}
                  onChange={(e) => setWithdrawalReason(e.target.value)}
                      className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 text-sm transition-all duration-300 bg-white"
                      placeholder="e.g., Cash withdrawal for supplies, Emergency expenses, Daily cash out"
                  rows={3}
                  required
                />
              </div>

              <div>
                    <label className="block text-sm font-semibold text-amber-700 mb-2">
                  Withdrawal Amount
                </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-amber-500 font-semibold">$</span>
                <input
                  type="number"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 text-sm transition-all duration-300 bg-white"
                  min="0"
                  step="0.01"
                        placeholder="e.g., 50.00, 100.50, 25.75"
                  required
                />
                    </div>
                  </div>
                </div>
              </div>

              {withdrawalAmount > 0 && (
                <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 p-6 rounded-2xl border border-amber-200 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-amber-700 mb-2">Withdrawal Amount</div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                        {formatCurrency(withdrawalAmount)}
                      </div>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <DollarSign className="w-7 h-7 text-white" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full px-8 py-5 text-xl font-bold text-white rounded-2xl focus:outline-none focus:ring-4 disabled:opacity-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] ${
              isOffline 
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 focus:ring-amber-200'
                : 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 focus:ring-purple-200'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                {isOffline ? 'Saving Offline...' : 'Recording Sale...'}
              </div>
            ) : (
              <div className="flex items-center justify-center">
                {isOffline ? (
                  <>
                    <WifiOff className="w-6 h-6 mr-3" />
                    Save Offline
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-6 h-6 mr-3" />
                    Record Sale
                  </>
                )}
              </div>
            )}
          </button>
          
          {/* Offline status message */}
          {isOffline && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center space-x-2">
                <WifiOff className="w-4 h-4 text-amber-600" />
                <p className="text-sm text-amber-700 font-medium">
                  You are offline. Sales will be saved locally and synced when connection is restored.
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

      {/* Sales History */}
      <div className="bg-gradient-to-br from-white via-purple-50 to-pink-50 rounded-2xl border border-purple-200 overflow-hidden shadow-lg">
        <div className="px-6 py-5 border-b border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 rounded-xl flex items-center justify-center shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Sales History</h4>
              <p className="text-sm text-purple-600 font-medium">View all transactions and withdrawals</p>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-center px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-xl hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {showHistory ? <EyeOff className="w-5 h-5 mr-2" /> : <Eye className="w-5 h-5 mr-2" />}
            {showHistory ? 'Hide History' : 'View History'}
          </button>
        </div>
        
        {showHistory && (
          <div className="divide-y divide-gray-100">
            {allSalesData.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-lg font-medium text-gray-500 mb-2">No sales recorded yet</p>
                <p className="text-sm text-gray-400">Start recording sales to see them here</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {allSalesData.map((item) => (
                  <div key={item._id} className="px-6 py-5 hover:bg-gray-50 transition-all duration-200">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          item.type === 'product_sale' 
                            ? 'bg-gradient-to-br from-green-400 to-green-600' 
                            : 'bg-gradient-to-br from-orange-400 to-orange-600'
                        }`}>
                          {item.type === 'product_sale' ? (
                            <ShoppingCart className="w-6 h-6 text-white" />
                          ) : (
                            <DollarSign className="w-6 h-6 text-white" />
                          )}
                        </div>
                      <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            item.type === 'product_sale' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-orange-100 text-orange-700'
                          }`}>
                            {item.type === 'product_sale' ? 'Product Sale' : 'Withdrawal'}
                          </span>
                          {item.type === 'product_sale' && (
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              item.paymentMethod === 'cash' 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.paymentMethod === 'cash' ? '💵 Cash' : '📱 Mobile Banking'}
                            </span>
                          )}
                        </div>
                          <div className="text-sm font-medium text-gray-800 truncate">
                          {item.displayName}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatDate(item.createdAt)}
                          </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-lg font-bold ${
                          item.isRevenue ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {item.isRevenue ? '+' : '-'}{formatCurrency(item.amount)}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          {item.isRevenue ? 'Revenue' : 'Withdrawal'}
                        </div>
                        {/* Payment proof buttons for product sales with mobile banking */}
                        {item.type === 'product_sale' && item.paymentMethod === 'mobile banking(telebirr)' && item.paymentImageUrl && (
                          <div className="flex gap-1 mt-2">
                            <button
                              onClick={() => setPreviewImage(previewImage === item.paymentImageUrl ? null : (item.paymentImageUrl || null))}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              title="View payment proof"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => downloadPaymentProof(item.paymentImageUrl!, item.displayName)}
                              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                              title="Download payment proof"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Inline image preview for payment proof */}
                    {previewImage === item.paymentImageUrl && item.paymentImageUrl && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">Payment Proof</span>
                          <button
                            onClick={() => setPreviewImage(null)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <img 
                          src={item.paymentImageUrl} 
                          alt="Payment proof" 
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
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
