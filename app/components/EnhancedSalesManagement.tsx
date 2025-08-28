"use client";
import { useState, useEffect } from "react";
import { ShoppingCart, DollarSign, Plus, Minus, Calendar, ChevronDown, ChevronUp, TrendingUp, Eye, EyeOff, WifiOff, CreditCard, Receipt, Package, Edit, Trash2, AlertTriangle, Hash, User, Download, X } from "lucide-react";
import { useOfflineQueue } from "../../providers/OfflineProvider";
import ImageUpload from "./ImageUpload";
import EthiopianDate from "./EthiopianDate";
import { formatEthiopianDate } from "@/utils/ethiopianCalendar";
import Pagination from "./Pagination";

// Ethiopian calendar months for sorting
const ETHIOPIAN_MONTHS = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehasie'
];


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
  productId: string;
  createdAt: string;
  by?: 'cash' | 'mobile banking(telebirr)';
  paymentImageUrl?: string;
  status?: 'pending' | 'finished';
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




export default function EnhancedSalesManagement({ onSuccess, onDataChange }: SalesManagementProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [productSales, setProductSales] = useState<ProductSale[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saleType, setSaleType] = useState<'product_sale' | 'withdrawal'>('product_sale');
  
  // Filter states
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'product_sale' | 'withdrawal'>('product_sale');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'mobile banking(telebirr)'>('all');

  // Edit Mode State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editingRecordType, setEditingRecordType] = useState<'product_sale' | 'withdrawal' | null>(null);
  const [originalSaleData, setOriginalSaleData] = useState<{
    soldQuantity: number;
    productId: string;
    productName: string;
  } | null>(null);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    record: ProductSale | Withdrawal | null;
  }>({
    isOpen: false,
    record: null
  });
  const [deleting, setDeleting] = useState(false);



  // Product Sale Form - Single product selection
  const [productSaleData, setProductSaleData] = useState({
    productId: '',
    productName: '',
    soldQuantity: 0,
    pricePerUnit: 0,
    availableQuantity: 0,
    status: 'pending' as 'pending' | 'finished'
  });

  // Withdrawal Form
  const [withdrawalData, setWithdrawalData] = useState({
    reason: '',
    amount: 0
  });

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile banking(telebirr)">("cash");
  const [paymentImageUrl, setPaymentImageUrl] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Offline functionality
  const { isOffline, pendingCount, queueSale } = useOfflineQueue();

  // Polling for real-time updates
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // 🏦 SIMPLE QUANTITY MANAGEMENT SYSTEM
  // ======================================
  // Rule 1: When entering edit mode → Restore quantity to product
  // Rule 2: When saving edit → Subtract new quantity from product  
  // Rule 3: When canceling edit → Restore quantity back to product
  // Rule 4: When deleting sale → Restore quantity back to product
  // ======================================

  // Loading states for different operations
  const [quantityLoading, setQuantityLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // 🏦 SIMPLE QUANTITY MANAGEMENT SYSTEM
  // ======================================
  // Rule 1: When entering edit mode → Restore quantity to product
  // Rule 2: When saving edit → Subtract new quantity from product  
  // Rule 3: When canceling edit → Restore quantity back to product
  // Rule 4: When deleting sale → Restore quantity back to product
  // ======================================



  // Fetch only products that are ready to sell (quantity > 0)
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Only show products that are ready to sell (quantity > 0)
        const availableProducts = (data.products || []).filter((product: Product) => product.quantity > 0);
        setProducts(availableProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchSalesData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [productSalesResponse, withdrawalsResponse] = await Promise.all([
        fetch('/api/product-sales?status=pending', {
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

  // Load available products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (showHistory) {
      fetchSalesData();
      
      // Start polling every 5 seconds when history is shown
      const interval = setInterval(() => {
        fetchSalesData();
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

  // Refresh products when products change to ensure quantity synchronization
  useEffect(() => {
    if (products.length > 0) {
      refreshAvailableQuantity();
    }
  }, [products, isEditMode, originalSaleData]);

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
    if (selectedProduct) {
      // Use the actual product quantity as available quantity
      const availableQuantity = selectedProduct.quantity;
      
      const saleData = {
        productId: selectedProduct._id,
        productName: selectedProduct.name,
        soldQuantity: 0,
        pricePerUnit: selectedProduct.pricePerUnit,
        availableQuantity: availableQuantity,
        status: 'pending' as 'pending' | 'finished'
      };
      setProductSaleData(saleData);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 🏦 VALIDATE BANK TRANSACTION
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
        
        // 🏦 CHECK AVAILABLE QUANTITY (simple validation)
        const currentQuantity = getCurrentProductQuantity(productSaleData.productId);
        
        if (currentQuantity < productSaleData.soldQuantity) {
          alert(`Insufficient quantity. Available: ${currentQuantity}, Requested: ${productSaleData.soldQuantity}`);
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

      // 🏦 PREPARE TRANSACTION DATA
      const saleData = saleType === 'product_sale' 
        ? { 
            type: saleType, 
            productSales: [{
              productId: productSaleData.productId,
              productName: productSaleData.productName,
              soldQuantity: productSaleData.soldQuantity,
              pricePerUnit: productSaleData.pricePerUnit
            }],
            by: paymentMethod,
            paymentImageUrl: paymentImageUrl || undefined
          }
        : { type: saleType, reason: withdrawalData.reason, amount: withdrawalData.amount };

      // 🏦 OFFLINE MODE: Queue transaction
      if (isOffline) {
        if (saleType === 'product_sale') {
          await handleOfflineQuantityUpdate(productSaleData.productId, productSaleData.soldQuantity);
        }
        
        await queueSale(saleData);
        
        // Reset form
        if (saleType === 'product_sale') {
          setProductSaleData({
            productId: '',
            productName: '',
            soldQuantity: 0,
            pricePerUnit: 0,
            availableQuantity: 0,
            status: 'pending'
          });
          setPaymentMethod('cash');
          setPaymentImageUrl('');
        } else {
          setWithdrawalData({ reason: '', amount: 0 });
        }
        
        if (onSuccess) {
          onSuccess();
        }
        
        return;
      }

      // 🏦 ONLINE MODE: Process transaction
      const token = localStorage.getItem('token');
      
      if (saleType === 'product_sale') {
        if (isEditMode && editingRecordId) {
          // 🏦 EDIT MODE: Subtract new quantity from product (since we restored it when entering edit)
          console.log('🏦 [EDIT] Processing edit transaction');
          
          // 🏦 STEP 1: SUBTRACT NEW QUANTITY FROM PRODUCT
          console.log('🏦 [EDIT] Subtracting new quantity:', productSaleData.soldQuantity);
          
          const subtractResponse = await fetch('/api/products/update-quantity', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              productUpdates: [{ productId: productSaleData.productId, quantitySold: productSaleData.soldQuantity }] // Positive = subtract
            })
          });

          if (!subtractResponse.ok) {
            throw new Error('Failed to update product quantity');
          }
          
          console.log('✅ [EDIT] Product quantity updated successfully');
          
          // 🏦 STEP 2: UPDATE SALE RECORD
          const updateData = {
            productName: productSaleData.productName,
            soldQuantity: productSaleData.soldQuantity,
            pricePerUnit: productSaleData.pricePerUnit,
            totalSoldMoney: productSaleData.soldQuantity * productSaleData.pricePerUnit,
            productId: productSaleData.productId,
            by: paymentMethod,
            paymentImageUrl: paymentImageUrl || undefined,
            status: 'pending'
          };
          
          const saleResponse = await fetch(`/api/product-sales/${editingRecordId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
          });

          if (!saleResponse.ok) {
            // 🏦 ROLLBACK: If sale update fails, restore quantity back
            console.error('❌ [EDIT] Sale update failed, rolling back quantity');
            
            try {
              const rollbackResponse = await fetch('/api/products/update-quantity', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  productUpdates: [{ productId: productSaleData.productId, quantitySold: -productSaleData.soldQuantity }] // Negative = add back
                })
              });
              
              if (rollbackResponse.ok) {
                console.log('✅ [EDIT] Quantity rollback successful');
              }
            } catch (rollbackError) {
              console.error('❌ [EDIT] Quantity rollback failed:', rollbackError);
            }
            
            const errorData = await saleResponse.json();
            throw new Error(errorData.error || 'Failed to update sale record');
          }
          
          console.log('✅ [EDIT] Sale record updated successfully');
          await fetchProducts(); // Refresh products
          
        } else {
          // 🏦 NEW SALE: Withdraw from bank + Create transaction record
          console.log('🏦 [NEW SALE] Processing new sale transaction');
          
          // 🏦 STEP 1: SUBTRACT QUANTITY FROM PRODUCT
          console.log('🏦 [NEW SALE] Subtracting quantity from product:', productSaleData.soldQuantity);
          
          const subtractResponse = await fetch('/api/products/update-quantity', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              productUpdates: [{ productId: productSaleData.productId, quantitySold: productSaleData.soldQuantity }] // Positive = subtract
            })
          });

          if (!subtractResponse.ok) {
            throw new Error('Failed to update product quantity');
          }
          
          console.log('✅ [NEW SALE] Product quantity updated successfully');
          
          // 🏦 STEP 2: CREATE SALE RECORD
          const requestBody = {
            productSales: [{
              productId: productSaleData.productId,
              productName: productSaleData.productName,
              soldQuantity: productSaleData.soldQuantity,
              pricePerUnit: productSaleData.pricePerUnit,
              status: 'pending'
            }],
            by: paymentMethod,
            paymentImageUrl: paymentImageUrl || undefined
          };
          
          console.log('🏦 [NEW SALE] Creating sale record:', requestBody);
          
          const saleResponse = await fetch('/api/product-sales', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
          });

          if (!saleResponse.ok) {
            // 🏦 ROLLBACK: If sale creation fails, restore quantity back
            console.error('❌ [NEW SALE] Sale creation failed, rolling back quantity');
            
            try {
              const rollbackResponse = await fetch('/api/products/update-quantity', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  productUpdates: [{ productId: productSaleData.productId, quantitySold: -productSaleData.soldQuantity }] // Negative = add back
                })
              });
              
              if (rollbackResponse.ok) {
                console.log('✅ [NEW SALE] Quantity rollback successful');
              }
            } catch (rollbackError) {
              console.error('❌ [NEW SALE] Quantity rollback failed:', rollbackError);
            }
            
            const saleError = await saleResponse.json();
            throw new Error(saleError.error || 'Failed to create sale record');
          }

          console.log('✅ [NEW SALE] Sale record created successfully');
        }
      } else {
        // Handle withdrawal (no quantity involved)
        if (isEditMode && editingRecordId) {
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

      // 🏦 TRANSACTION COMPLETE: Reset form and refresh data
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
          availableQuantity: 0,
          status: 'pending'
        });
        setPaymentMethod('cash');
        setPaymentImageUrl('');
      } else {
        setWithdrawalData({ reason: '', amount: 0 });
      }
      
      // Refresh data after successful transaction
      await fetchSalesData();
      await fetchProducts();
      
      if (showHistory) {
        fetchSalesData();
      }
      if (onSuccess) {
        onSuccess();
      }
      
      console.log('🎉 [BANK] Transaction completed successfully!');
      
    } catch (error) {
      console.error('❌ [BANK] Transaction failed:', error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to record sale';
      console.error('User error message:', errorMessage);
      
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
                  pricePerUnit: productSaleData.pricePerUnit,
                  status: 'pending'
                }],
                by: paymentMethod,
                paymentImageUrl: paymentImageUrl || undefined
              }
            : { type: saleType, reason: withdrawalData.reason, amount: withdrawalData.amount };
          
          await queueSale(saleData);
          
          // Reset form
          if (saleType === 'product_sale') {
            setProductSaleData({
              productId: '',
              productName: '',
              soldQuantity: 0,
              pricePerUnit: 0,
              availableQuantity: 0,
              status: 'pending'
            });
            setPaymentMethod('cash');
            setPaymentImageUrl('');
          } else {
            setWithdrawalData({ reason: '', amount: 0 });
          }
          
          if (onSuccess) {
            onSuccess();
          }
        } catch (queueError) {
          console.error('Failed to queue sale:', queueError);
          alert('Failed to record sale. Please try again.');
        }
      } else {
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSoldQuantity = (quantity: number) => {
    // Validate quantity doesn't exceed available stock
    const maxQuantity = getCurrentProductQuantity(productSaleData.productId);
    const validQuantity = Math.min(Math.max(0, quantity), maxQuantity);
    
    setProductSaleData({
      ...productSaleData,
      soldQuantity: validQuantity
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' ብር';
  };

  const downloadPaymentProof = (imageUrl: string, productName: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `payment-proof-${productName}-${new Date().toISOString().split('T')[0]}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateTotal = () => {
    return productSaleData.soldQuantity * productSaleData.pricePerUnit;
  };

  // Helper function to get current product quantity
  const getCurrentProductQuantity = (productId: string) => {
    const product = products.find(p => p._id === productId);
    return product?.quantity || 0;
  };

  // Helper function to calculate available quantity for editing
  const calculateAvailableQuantityForEdit = (currentProductQuantity: number, originalSoldQuantity: number) => {
    // When editing, the available quantity is current + original sold (since we restore it)
    return currentProductQuantity + originalSoldQuantity;
  };

  // Edit Functions
  const handleEditRecord = async (record: ProductSale | Withdrawal, recordType: 'product_sale' | 'withdrawal') => {
    setEditLoading(true);
    
    try {
      console.log('🏦 [EDIT] Starting edit mode for record:', record._id);
      
      setIsEditMode(true);
      setEditingRecordId(record._id);
      setEditingRecordType(recordType);

      if (recordType === 'product_sale') {
        const saleRecord = record as ProductSale;
        
        // 🏦 FIND PRODUCT
        const product = products.find(p => p.name === saleRecord.productName);
        
        if (!product) {
          alert('Product not found. Please refresh the page and try again.');
          return;
        }
        
        // 🏦 STORE ORIGINAL DATA
        setOriginalSaleData({ 
          soldQuantity: saleRecord.soldQuantity, 
          productId: product._id,
          productName: saleRecord.productName
        });
        
        // 🏦 STEP 1: RESTORE QUANTITY IMMEDIATELY (like returning money to bank)
        console.log('🏦 [EDIT] Restoring quantity to product:', saleRecord.soldQuantity);
        
        const token = localStorage.getItem('token');
        const restoreResponse = await fetch('/api/products/update-quantity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            productUpdates: [{ productId: product._id, quantitySold: -saleRecord.soldQuantity }] // Negative = add back
          })
        });

        if (!restoreResponse.ok) {
          throw new Error('Failed to restore product quantity');
        }
        
        console.log('✅ [EDIT] Quantity restored successfully');
        
        // 🏦 CALCULATE UPDATED QUANTITY (since we restored the sold quantity)
        const updatedQuantity = product.quantity + saleRecord.soldQuantity;
        
        // 🏦 SET FORM DATA WITH UPDATED QUANTITY
        setProductSaleData({
          productId: product._id,
          productName: saleRecord.productName,
          soldQuantity: saleRecord.soldQuantity,
          pricePerUnit: saleRecord.pricePerUnit,
          availableQuantity: updatedQuantity,
          status: saleRecord.status || 'pending'
        });
        
        // 🏦 REFRESH PRODUCTS IN BACKGROUND
        fetchProducts();
        
        // 🏦 SET PAYMENT DETAILS
        setPaymentMethod(saleRecord.by || 'cash');
        setPaymentImageUrl(saleRecord.paymentImageUrl || '');
        setSaleType('product_sale');
        
        console.log('🏦 [EDIT] Edit mode activated with restored quantity');
        
      } else {
        // Handle withdrawal edit (no quantity involved)
        const withdrawalRecord = record as Withdrawal;
        setWithdrawalData({
          reason: withdrawalRecord.reason,
          amount: withdrawalRecord.amount
        });
        setSaleType('withdrawal');
      }
      
    } catch (error) {
      console.error('❌ [EDIT] Failed to start edit mode:', error);
      alert('Failed to start edit mode. Please try again.');
      setIsEditMode(false);
      setEditingRecordId(null);
      setEditingRecordType(null);
    } finally {
      setEditLoading(false);
    }
  };

  // 🏦 CANCEL EDIT: Restore quantity back when canceling
  const cancelEdit = async () => {
    setCancelLoading(true);
    
    try {
      console.log('🏦 [CANCEL] Canceling edit mode');
      
      // 🏦 STEP 1: RESTORE QUANTITY BACK (like taking money back from bank)
      if (originalSaleData && isEditMode) {
        console.log('🏦 [CANCEL] Restoring quantity back:', originalSaleData.soldQuantity);
        
        const token = localStorage.getItem('token');
        const restoreResponse = await fetch('/api/products/update-quantity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            productUpdates: [{ productId: originalSaleData.productId, quantitySold: originalSaleData.soldQuantity }] // Positive = subtract back
          })
        });

        if (!restoreResponse.ok) {
          console.error('❌ [CANCEL] Failed to restore quantity back');
        } else {
          console.log('✅ [CANCEL] Quantity restored back successfully');
          await fetchProducts(); // Refresh products
        }
      }
      
      // 🏦 STEP 2: RESET FORM DATA
      setIsEditMode(false);
      setEditingRecordId(null);
      setEditingRecordType(null);
      
      // Reset form data
      setProductSaleData({
        productId: '',
        productName: '',
        soldQuantity: 0,
        pricePerUnit: 0,
        availableQuantity: 0,
        status: 'pending'
      });
      setWithdrawalData({
        reason: '',
        amount: 0
      });
      setPaymentMethod('cash');
      setPaymentImageUrl('');
      setOriginalSaleData(null);
      
      console.log('✅ [CANCEL] Edit mode canceled successfully');
      
    } catch (error) {
      console.error('❌ [CANCEL] Failed to cancel edit:', error);
      alert('Failed to cancel edit. Please refresh the page and try again.');
    } finally {
      setCancelLoading(false);
    }
  };

  // Delete Functions
  const handleDeleteRecord = (record: ProductSale | Withdrawal) => {
    setDeleteModal({
      isOpen: true,
      record
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      record: null
    });
  };

  // 🏦 DELETE RECORD: Delete sale/withdrawal (like canceling a bank transaction)
  const handleConfirmDelete = async () => {
    if (!deleteModal.record) return;

    setDeleting(true);
    try {
      console.log('🏦 [DELETE] Starting deletion process');
      
      const token = localStorage.getItem('token');
      
      // 🏦 DETERMINE RECORD TYPE (like checking transaction type)
      if ('productName' in deleteModal.record) {
        // 🏦 DELETE PRODUCT SALE: Deposit quantity back to bank
        const saleRecord = deleteModal.record as ProductSale;
        
        console.log('🏦 [DELETE] Deleting product sale:', {
          productName: saleRecord.productName,
          soldQuantity: saleRecord.soldQuantity
        });
        
        // 🏦 FIND PRODUCT (like finding account)
        const product = products.find(p => p.name === saleRecord.productName);
        
        if (product) {
          // 🏦 RESTORE QUANTITY BACK TO PRODUCT
          console.log('🏦 [DELETE] Restoring quantity back to product:', saleRecord.soldQuantity);
          
          const restoreResponse = await fetch('/api/products/update-quantity', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              productUpdates: [{ productId: product._id, quantitySold: -saleRecord.soldQuantity }] // Negative = add back
            })
          });

          if (restoreResponse.ok) {
            console.log('✅ [DELETE] Quantity restored back to product successfully');
          } else {
            console.error('❌ [DELETE] Failed to restore quantity back to product');
          }
        }
        
        // 🏦 DELETE SALE RECORD
        const response = await fetch(`/api/product-sales/${deleteModal.record._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete product sale');
        }
        
        console.log('✅ [DELETE] Sale record deleted successfully');
        
      } else {
        // 🏦 DELETE WITHDRAWAL (no quantity involved)
        console.log('🏦 [DELETE] Deleting withdrawal record');
        
        const response = await fetch(`/api/withdrawals/${deleteModal.record._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete withdrawal');
        }
        
        console.log('✅ [DELETE] Withdrawal record deleted successfully');
      }

      // 🏦 REFRESH DATA (like updating bank statement)
      if (showHistory) {
        fetchSalesData();
      }
      
      closeDeleteModal();
      
      if (onSuccess) {
        onSuccess();
      }
      
      console.log('🎉 [DELETE] Deletion completed successfully!');
      
    } catch (error) {
      console.error('❌ [DELETE] Deletion failed:', error);
      alert('Failed to delete record');
    } finally {
      setDeleting(false);
    }
  };


  // Get available dates for filter
  const getAvailableDates = () => {
    const allDates = [...productSales, ...withdrawals]
      .map(item => formatEthiopianDate(item.createdAt, false))
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort((a, b) => {
        // Sort by Ethiopian date (newest first)
        const dateA = new Date(a.split(' ')[2] + '-' + (ETHIOPIAN_MONTHS.indexOf(a.split(' ')[1]) + 1).toString().padStart(2, '0') + '-' + a.split(' ')[0].padStart(2, '0'));
        const dateB = new Date(b.split(' ')[2] + '-' + (ETHIOPIAN_MONTHS.indexOf(b.split(' ')[1]) + 1).toString().padStart(2, '0') + '-' + b.split(' ')[0].padStart(2, '0'));
        return dateB.getTime() - dateA.getTime();
      });
    
    return allDates;
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter and sort data
  const getFilteredData = () => {
    let filteredData = [...productSales, ...withdrawals];
    
    // Filter by type
    if (typeFilter !== 'all') {
      if (typeFilter === 'product_sale') {
        filteredData = filteredData.filter(item => 'productName' in item);
      } else {
        filteredData = filteredData.filter(item => !('productName' in item));
      }
    }
    
    // Filter by date
    if (dateFilter !== 'all') {
      filteredData = filteredData.filter(item => formatEthiopianDate(item.createdAt, false) === dateFilter);
    }
    
    // Filter by payment method (only for product sales)
    if (paymentFilter !== 'all') {
      filteredData = filteredData.filter(item => {
        if ('productName' in item) {
          return item.by === paymentFilter;
        }
        return true; // Keep withdrawals when filtering by payment
      });
    }
    
    // Sort by newest first
    return filteredData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  // Get paginated data
  const getPaginatedData = () => {
    const filteredData = getFilteredData();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  };

  // Calculate pagination info
  const getPaginationInfo = () => {
    const filteredData = getFilteredData();
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
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, dateFilter, paymentFilter]);

  // Calculate total for filtered product sales
  const getFilteredProductSalesTotal = () => {
    const filteredData = getFilteredData();
    const productSalesOnly = filteredData.filter(item => 'productName' in item) as ProductSale[];
    return productSalesOnly.reduce((total, sale) => total + sale.totalSoldMoney, 0);
  };

  // Helper function to refresh available quantity based on current product state
  const refreshAvailableQuantity = () => {
    if (productSaleData.productId) {
      const currentProduct = products.find(p => p._id === productSaleData.productId);
      if (currentProduct) {
        // Use the actual product quantity as available quantity
        const availableQuantity = currentProduct.quantity;
        
        setProductSaleData(prev => ({
          ...prev,
          availableQuantity: availableQuantity
        }));
      }
    }
  };

  // Helper function to handle offline quantity management
  const handleOfflineQuantityUpdate = async (productId: string, quantitySold: number) => {
    try {
      console.log('📱 [OFFLINE] Handling quantity update:', { productId, quantitySold });
      
      // Store the quantity update in localStorage for offline sync
      const offlineUpdates = JSON.parse(localStorage.getItem('offlineQuantityUpdates') || '[]');
      offlineUpdates.push({
        productId,
        quantitySold,
        timestamp: new Date().toISOString(),
        operation: 'sale'
      });
      localStorage.setItem('offlineQuantityUpdates', JSON.stringify(offlineUpdates));
      
      // Update local products state immediately for UI consistency
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product._id === productId 
            ? { 
                ...product, 
                quantity: Math.max(0, product.quantity - quantitySold) 
              }
            : product
        ).filter(product => product.quantity > 0) // Remove products with 0 quantity
      );
      
      console.log('📱 [OFFLINE] Quantity update stored locally and UI updated');
      
      // Also update the available quantity in the form if this product is selected
      if (productSaleData.productId === productId) {
        setProductSaleData(prev => ({
          ...prev,
          availableQuantity: Math.max(0, prev.availableQuantity - quantitySold)
        }));
      }
      
    } catch (error) {
      console.error('Error handling offline quantity update:', error);
    }
  };

  // Helper function to sync offline quantity updates when coming back online
  const syncOfflineQuantityUpdates = async () => {
    try {
      const offlineUpdates = JSON.parse(localStorage.getItem('offlineQuantityUpdates') || '[]');
      if (offlineUpdates.length === 0) {
        console.log('📱 [SYNC] No offline quantity updates to sync');
        return;
      }
      
      console.log('📱 [SYNC] Syncing offline quantity updates:', offlineUpdates);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('📱 [SYNC] No authentication token found');
        return;
      }
      
      // Group updates by productId
      const updatesByProduct = offlineUpdates.reduce((acc: any, update: any) => {
        if (!acc[update.productId]) {
          acc[update.productId] = 0;
        }
        acc[update.productId] += update.quantitySold;
        return acc;
      }, {});
      
      console.log('📱 [SYNC] Grouped updates by product:', updatesByProduct);
      
      // Send bulk update to server
      const response = await fetch('/api/products/update-quantity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productUpdates: Object.entries(updatesByProduct).map(([productId, quantitySold]) => ({
            productId,
            quantitySold
          }))
        })
      });
      
      if (response.ok) {
        // Clear offline updates after successful sync
        localStorage.removeItem('offlineQuantityUpdates');
        console.log('✅ [SYNC] Offline quantity updates synced successfully');
        
        // Refresh products to get updated quantities (will filter out 0 quantity products)
        await fetchProducts();
      } else {
        const errorData = await response.json();
        console.error('❌ [SYNC] Failed to sync offline quantity updates:', errorData);
      }
    } catch (error) {
      console.error('Error syncing offline quantity updates:', error);
    }
  };

  // Monitor online/offline status and sync when coming back online
  useEffect(() => {
    const handleOnline = async () => {
      console.log('🌐 [ONLINE] Connection restored, syncing offline updates...');
      await syncOfflineQuantityUpdates();
    };

    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Helper function to handle edit mode quantity restoration
  const handleEditModeQuantityRestoration = async (productId: string, originalSoldQuantity: number) => {
    try {
      console.log('🔧 [EDIT] Restoring quantity for edit mode:', { productId, originalSoldQuantity });
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const restoreResponse = await fetch(`/api/products/update-quantity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productUpdates: [{
            productId: productId,
            quantitySold: -originalSoldQuantity // ADD (+) the original sold quantity back
          }]
        })
      });

      if (!restoreResponse.ok) {
        const errorData = await restoreResponse.json();
        throw new Error(errorData.error || 'Failed to restore product quantity');
      }
      
      console.log('✅ [EDIT] Quantity restoration successful');
      await fetchProducts();
      return true;
    } catch (error) {
      console.error('❌ [EDIT] Error restoring product quantity:', error);
      throw error;
    }
  };



  return (
    <div className="enhanced-sales-management">

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.record && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl border-0 w-full max-w-lg animate-slideIn" style={{ backgroundColor: '#ffffff' }}>
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 bg-white rounded-t-2xl" style={{ backgroundColor: '#ffffff' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Are you sure you want to delete this {deleteModal.record && 'productName' in deleteModal.record ? 'sale' : 'withdrawal'}?
                  </p>
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
              {/* Record Details */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                <div className="space-y-2">
                  {deleteModal.record && 'productName' in deleteModal.record ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-700">Product:</span>
                        <span className="text-gray-900">{deleteModal.record.productName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-700">Quantity:</span>
                        <span className="text-gray-900">{deleteModal.record.soldQuantity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-700">Total:</span>
                        <span className="text-gray-900">${deleteModal.record.totalSoldMoney}</span>
                      </div>
                    </>
                  ) : deleteModal.record && 'reason' in deleteModal.record ? (
                    <>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-700">Amount:</span>
                        <span className="text-gray-900">${deleteModal.record.amount}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-700">Reason:</span>
                        <span className="text-gray-900">{deleteModal.record.reason}</span>
                      </div>
                    </>
                  ) : null}
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
                    `Delete ${deleteModal.record && 'productName' in deleteModal.record ? 'Sale' : 'Withdrawal'}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
          <div className="form-header-right">
            {isOffline && (
              <div className="offline-badge">
                <WifiOff className="w-4 h-4" />
                <span>Offline Mode</span>
              </div>
            )}
            {products.length === 0 && !isEditMode && (
              <div className="no-products-badge">
                <Package className="w-4 h-4" />
                <span>No Products Available</span>
              </div>
            )}
          </div>
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
                      {products.length === 0 ? (
                        <option value="" disabled>
                          No products available for sale (all products have 0 quantity)
                        </option>
                      ) : (
                        products.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name} - {formatCurrency(product.pricePerUnit)} 
                            (Available: {product.quantity} {product.quantityType})
                          </option>
                        ))
                      )}
                      {/* Show the product being edited if it's not in the current products list */}
                      {isEditMode && !products.find(p => p._id === productSaleData.productId) && productSaleData.productName && (
                        <option value={productSaleData.productId} disabled>
                          {productSaleData.productName} - {formatCurrency(productSaleData.pricePerUnit)} (Editing)
                        </option>
                      )}
                    </select>
                    {products.length === 0 && (
                      <div className="field-hint" style={{ color: '#dc2626', fontStyle: 'normal' }}>
                        ⚠️ No products are currently available for sale. Please add inventory or wait for stock to be replenished.
                      </div>
                    )}
                  </div>

                  {(productSaleData.productId || (isEditMode && productSaleData.productName)) && (
                    <>
                      <div className="form-field">
                        <label className="field-label">Quantity to Sell</label>
                        <input
                          type="number"
                          value={productSaleData.soldQuantity || ''}
                          onChange={(e) => updateSoldQuantity(parseInt(e.target.value) || 0)}
                          className="field-input"
                          placeholder="e.g., 5, 10, 25"
                          min="0"
                          max={getCurrentProductQuantity(productSaleData.productId)}
                          required
                        />
                        <p className="field-hint">
                          📦 Available: {productSaleData.availableQuantity} units
                        </p>
                        {productSaleData.soldQuantity > getCurrentProductQuantity(productSaleData.productId) && (
                          <p className="field-error">
                            ⚠️ Quantity exceeds available stock. Maximum: {getCurrentProductQuantity(productSaleData.productId)}
                          </p>
                        )}
                      </div>
                      
                      <div className="form-field">
                        <label className="field-label">Price Per Unit</label>
                        <input
                          type="number"
                          step="0.01"
                          value={productSaleData.pricePerUnit || ''}
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

                {/* Payment Method Selection */}
                {productSaleData.soldQuantity > 0 && (
                  <div className="payment-method-section">
                    <h5 className="payment-method-title">
                      <CreditCard className="w-4 h-4" />
                      Payment Method
                    </h5>
                    <p className="payment-method-subtitle">Choose how the customer paid</p>
                    
                    <div className="payment-method-options">
                      <label className={`payment-option ${paymentMethod === "cash" ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cash"
                          checked={paymentMethod === "cash"}
                          onChange={(e) => {
                            setPaymentMethod(e.target.value as "cash" | "mobile banking(telebirr)");
                            setPaymentImageUrl(""); // Clear image when switching to cash
                          }}
                          className="payment-radio"
                        />
                        <div className="payment-option-content">
                          <div className="payment-icon cash-icon">💵</div>
                          <span className="payment-label">Cash</span>
                        </div>
                      </label>
                      
                      <label className={`payment-option ${paymentMethod === "mobile banking(telebirr)" ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="mobile banking(telebirr)"
                          checked={paymentMethod === "mobile banking(telebirr)"}
                          onChange={(e) => setPaymentMethod(e.target.value as "cash" | "mobile banking(telebirr)")}
                          className="payment-radio"
                        />
                        <div className="payment-option-content">
                          <div className="payment-icon mobile-icon">📱</div>
                          <span className="payment-label">Mobile Banking (Telebirr)</span>
                        </div>
                      </label>
                    </div>

                    {/* Image Upload for Mobile Banking */}
                    {paymentMethod === "mobile banking(telebirr)" && (
                      <div className="image-upload-section">
                        <label className="image-upload-label">
                          Payment Proof (Required)
                        </label>
                        <p className="image-upload-hint">
                          Please upload a screenshot or photo of your mobile banking payment confirmation. You can take a new photo or select an existing image from your device.
                        </p>
                        <ImageUpload
                          onImageUpload={setPaymentImageUrl}
                          onImageRemove={() => setPaymentImageUrl("")}
                          currentImageUrl={paymentImageUrl}
                          disabled={loading}
                          cameraOnly={false} // Allow both camera and device upload
                        />
                      </div>
                    )}
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
                    value={withdrawalData.amount || ''}
                    onChange={(e) => setWithdrawalData({ ...withdrawalData, amount: parseFloat(e.target.value) || 0 })}
                    className="field-input"
                    placeholder="e.g., 100.00, 250.50, 500.00"
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
            disabled={loading || quantityLoading || editLoading || cancelLoading}
            className={`submit-button ${isOffline ? 'offline' : ''} ${saleType === 'withdrawal' ? 'withdrawal' : ''}`}
          >
            {loading || quantityLoading || editLoading || cancelLoading ? (
              <div className="button-content">
                <div className="loading-spinner"></div>
                {quantityLoading ? '🏦 Processing Bank Transaction...' : 
                 editLoading ? '🏦 Starting Edit Mode...' :
                 cancelLoading ? '🏦 Canceling Edit...' :
                 isOffline ? 'Saving Offline...' : 
                 (isEditMode ? 'Updating...' : 'Recording Sale...')}
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
              disabled={loading || quantityLoading || editLoading || cancelLoading}
              className="cancel-button"
            >
              {cancelLoading ? (
                <div className="button-content">
                  <div className="loading-spinner"></div>
                  🏦 Canceling...
                </div>
              ) : (
                '❌ Cancel Edit'
              )}
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
            <h3 className="history-title">Sales History (Pending Only)</h3>
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
            {/* Filter Controls */}
            <div className="filter-controls">
              <div className="filter-row">
                <div className="filter-group">
                  <label className="filter-label">Type:</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as 'all' | 'product_sale' | 'withdrawal')}
                    className="filter-select"
                  >
                    <option value="product_sale">Product Sales</option>
                    <option value="withdrawal">Withdrawals</option>
                    <option value="all">All Types</option>
                  </select>
              </div>
                <div className="filter-group">
                  <label className="filter-label">Date:</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Dates</option>
                    {getAvailableDates().map((date) => (
                      <option key={date} value={date}>{date}</option>
                    ))}
                  </select>
                          </div>
                <div className="filter-group">
                  <label className="filter-label">Payment:</label>
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value as 'all' | 'cash' | 'mobile banking(telebirr)')}
                    className="filter-select"
                  >
                    <option value="all">All Payments</option>
                    <option value="cash">💵 Cash</option>
                    <option value="mobile banking(telebirr)">📱 Mobile Banking</option>
                  </select>
                                   </div>
              </div>
              
              {/* Summary Card for Product Sales */}
              {typeFilter === 'product_sale' && getFilteredData().filter(item => 'productName' in item).length > 0 && (
                <div className="summary-card">
                  <div className="summary-content">
                    <ShoppingCart className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="summary-label">ዘይተረከበ ብር</p>
                      <p className="summary-amount">{formatCurrency(getFilteredProductSalesTotal())}</p>
                                             </div>
                                           </div>
                                             </div>
              )}
                                           </div>

            {getFilteredData().length === 0 ? (
              <div className="empty-state">
                <ShoppingCart className="w-16 h-16 text-slate-300" />
                <h4>No Records Found</h4>
                <p>No sales or withdrawals match your current filters</p>
                                         </div>
            ) : (
              <>
                <div className="sales-table-container">
                  <table className="sales-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Type</th>
                        <th>Details</th>
                        {typeFilter !== 'withdrawal' && <th>Payment Method</th>}
                        <th>Status</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedData().map((record, index) => {
                        const paginationInfo = getPaginationInfo();
                        const rowNumber = paginationInfo.startItem + index;
                        return (
                          <tr key={record._id} className="sale-row">
                            <td className="row-number">{rowNumber}</td>
                        <td className="type-cell">
                          {'productName' in record ? (
                            <div className="type-badge product">
                              <ShoppingCart className="w-3 h-3" />
                              Product Sale
                                           </div>
                          ) : (
                            <div className="type-badge withdrawal">
                              <Receipt className="w-3 h-3" />
                              Withdrawal
                                           </div>
                          )}
                        </td>
                        <td className="details-cell">
                          {'productName' in record ? (
                            <div className="product-details">
                              <div className="product-name">{record.productName}</div>
                              <div className="product-info">
                                Qty: {record.soldQuantity} × {formatCurrency(record.pricePerUnit)}
                                         </div>
                                       </div>
                          ) : (
                            <div className="withdrawal-details">
                              <div className="withdrawal-reason">{record.reason}</div>
                                   </div>
                                 )}
                        </td>
                        {typeFilter !== 'withdrawal' && (
                          <td className="payment-cell">
                            {'productName' in record && record.by ? (
                              <div className={`payment-method-badge ${record.by === 'cash' ? 'cash' : 'mobile'}`}>
                                {record.by === 'cash' ? '💵 Cash' : '📱 Mobile Banking'}
                               </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        )}
                        <td className="status-cell">
                          {'productName' in record ? (
                            record.status ? (
                              <div className={`status-badge ${record.status === 'finished' ? 'finished' : 'pending'}`}>
                                {record.status === 'finished' ? '✅ Finished' : '⏳ Pending'}
                                   </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="amount-cell">
                          {'productName' in record ? (
                            <span className="amount-positive">{formatCurrency(record.totalSoldMoney)}</span>
                          ) : (
                            <span className="amount-negative">-{formatCurrency(record.amount)}</span>
                          )}
                        </td>
                        <td className="date-cell">
                          <div className="date-info">
                            <div className="date-main">
                              <EthiopianDate dateString={record.createdAt} showTime={false} />
                                             </div>
                            <div className="date-time">
                              <EthiopianDate dateString={record.createdAt} showTime={true} showWeekday={false} />
                                           </div>
                          </div>
                        </td>
                        <td className="actions-cell">
                                           <div className="sale-actions">
                                             <button
                              type="button"
                              onClick={() => handleEditRecord(record, 'productName' in record ? 'product_sale' : 'withdrawal')}
                                               className="edit-button"
                              title="Edit"
                                             >
                                               <Edit className="w-4 h-4" />
                                             </button>
                                             <button
                              type="button"
                              onClick={() => handleDeleteRecord(record)}
                                               className="delete-button"
                              title="Delete"
                                             >
                                               <Trash2 className="w-4 h-4" />
                                             </button>
                            
                            {/* Payment proof buttons for mobile banking */}
                            {'productName' in record && record.by === 'mobile banking(telebirr)' && record.paymentImageUrl && (
                              <div className="payment-proof-buttons">
                <button
                                  type="button"
                                  onClick={() => setPreviewImage(previewImage === record.paymentImageUrl ? null : (record.paymentImageUrl || null))}
                                  className="view-button"
                                  title="View payment proof"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => downloadPaymentProof(record.paymentImageUrl!, record.productName)}
                                  className="download-button"
                                  title="Download payment proof"
                                >
                                  <Download className="w-4 h-4" />
                </button>
                                   </div>
                                 )}
                               </div>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
                
                {/* Payment proof preview modal */}
                {previewImage && (
                  <>
                    <div className="payment-proof-backdrop" onClick={() => setPreviewImage(null)}></div>
                    <div className="payment-proof-preview">
                      <div className="preview-header">
                        <span className="preview-title">Payment Proof</span>
                        <button
                          type="button"
                          onClick={() => setPreviewImage(null)}
                          className="close-preview"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <img 
                        src={previewImage} 
                        alt="Payment proof" 
                        className="preview-image"
                      />
                    </div>
                  </>
                )}
              </div>
              
              {/* Pagination Component */}
              {getFilteredData().length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={getPaginationInfo().totalPages}
                  totalItems={getPaginationInfo().totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  showItemsPerPage={true}
                />
              )}
            </>
          )}
        </div>
      )}
      </div>





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

        .form-header-right {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          align-items: flex-end;
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

        .no-products-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
          box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
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

        /* Filter Controls */
        .filter-controls {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .filter-row {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .filter-select {
          padding: 0.75rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: white;
          font-size: 0.875rem;
          transition: all 0.2s ease;
          min-width: 150px;
        }

        .filter-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        /* Summary Card */
        .summary-card {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 16px;
          padding: 1.5rem;
          margin-top: 1rem;
          box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
        }

        .summary-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: white;
        }

        .summary-label {
          font-size: 0.875rem;
          font-weight: 500;
          margin: 0;
          opacity: 0.9;
        }

        .summary-amount {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        /* Sales Table Styles */
        .sales-table-container {
          overflow-x: auto;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          background: white;
        }

        .sales-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .sales-table th {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e2e8f0;
          font-size: 0.875rem;
        }

        .sales-table td {
          padding: 1rem;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .sales-table tr:hover {
          background: #f8fafc;
        }

        .row-number {
          font-weight: 600;
          color: #64748b;
          text-align: center;
          width: 50px;
        }

        .type-cell {
          text-align: center;
          width: 120px;
        }

        .type-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          justify-content: center;
        }

        .type-badge.product {
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
          color: #15803d;
        }

        .type-badge.withdrawal {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #a16207;
        }

        .details-cell {
          min-width: 200px;
        }

        .product-details {
           display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .product-name {
          font-weight: 600;
          color: #1e293b;
        }

        .product-info {
          font-size: 0.75rem;
          color: #64748b;
        }

        .withdrawal-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .withdrawal-reason {
          font-weight: 600;
          color: #1e293b;
        }

        .payment-cell {
          text-align: center;
          width: 120px;
        }

        .payment-method-badge {
          display: inline-flex;
           align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.75rem;
           border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .payment-method-badge.cash {
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
          color: #15803d;
        }

        .payment-method-badge.mobile {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          color: #1d4ed8;
        }

        .status-cell {
          text-align: center;
          width: 100px;
        }

        .status-badge {
          display: inline-flex;
           align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
           font-weight: 600;
        }

        .status-badge.pending {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #a16207;
        }

        .status-badge.finished {
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
          color: #15803d;
        }

        .amount-cell {
          text-align: right;
          width: 120px;
        }

        .amount-positive {
          font-weight: 700;
          color: #059669;
        }

        .amount-negative {
          font-weight: 700;
          color: #dc2626;
        }

        .date-cell {
          width: 150px;
        }

        .date-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .date-main {
          font-weight: 600;
          color: #374151;
           font-size: 0.875rem;
         }

        .date-time {
          font-size: 0.75rem;
          color: #64748b;
        }

        .actions-cell {
          text-align: center;
          width: 120px;
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

        /* Payment Method Styles */
        .payment-method-section {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.5rem;
          margin-top: 1.5rem;
        }

        .payment-method-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.125rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 0.5rem 0;
        }

        .payment-method-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0 0 1rem 0;
        }

        .payment-method-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .payment-option {
          display: flex;
          align-items: center;
          padding: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
        }

        .payment-option:hover {
          border-color: #3b82f6;
          transform: translateY(-1px);
        }

        .payment-option.active {
          border-color: #3b82f6;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2);
        }

        .payment-radio {
          margin-right: 0.75rem;
          width: 1rem;
          height: 1rem;
          accent-color: #3b82f6;
        }

        .payment-option-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .payment-icon {
          font-size: 1.5rem;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }

        .cash-icon {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .mobile-icon {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
        }

        .payment-label {
          font-weight: 600;
          color: #374151;
        }

        .image-upload-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .image-upload-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #3b82f6;
          margin-bottom: 0.5rem;
        }

        .image-upload-hint {
          font-size: 0.75rem;
          color: #64748b;
          margin-bottom: 1rem;
        }

        .payment-method-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .payment-method-badge.cash {
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
          color: #15803d;
        }

        .payment-method-badge.mobile {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          color: #1d4ed8;
        }

        .payment-proof-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .view-button, .download-button {
          background: white;
          border: 1px solid #e2e8f0;
          padding: 0.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-button {
          color: #3b82f6;
        }

        .view-button:hover {
          background: #eff6ff;
          border-color: #3b82f6;
        }

        .download-button {
          color: #10b981;
        }

        .download-button:hover {
          background: #f0fdf4;
          border-color: #10b981;
        }

        .payment-proof-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 9999;
          cursor: pointer;
        }

        .payment-proof-preview {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          z-index: 10000;
          max-width: 90vw;
          max-height: 90vh;
          overflow: hidden;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .preview-title {
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
        }

        .close-preview {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .close-preview:hover {
          background: #e2e8f0;
          color: #374151;
        }

        .preview-image {
          max-width: 100%;
          max-height: 70vh;
          object-fit: contain;
          display: block;
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

        /* Modal Animations */
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }

        /* Submit Button and Loading Spinner Styles */
        .submit-button {
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .button-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
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

          .form-header-right {
            align-items: flex-start;
            width: 100%;
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

          .filter-row {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .filter-group {
            width: 100%;
          }

          .sales-table-container {
            font-size: 0.75rem;
          }

          .sales-table th,
          .sales-table td {
            padding: 0.75rem 0.5rem;
          }

          .details-cell {
            min-width: 150px;
          }

          .actions-cell {
            width: 100px;
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

