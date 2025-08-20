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



  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
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
      const saleData = {
        productId: selectedProduct._id,
        productName: selectedProduct.name,
        soldQuantity: 0,
        pricePerUnit: selectedProduct.pricePerUnit,
        availableQuantity: selectedProduct.quantity,
        status: 'pending' as 'pending' | 'finished'
      };
      setProductSaleData(saleData);
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
         
         // For edit mode, validate against the restored quantity
         if (isEditMode && originalSaleData) {
           // The availableQuantity should already be correct after restoration
           if (productSaleData.soldQuantity > productSaleData.availableQuantity) {
             alert(`Insufficient quantity. Available: ${productSaleData.availableQuantity}, Requested: ${productSaleData.soldQuantity}`);
             setLoading(false);
             return;
           }
         } else {
           // For new sales, validate against current product quantity
           const currentProduct = products.find(p => p._id === productSaleData.productId);
           if (currentProduct && productSaleData.soldQuantity > currentProduct.quantity) {
             alert(`Insufficient quantity. Available: ${currentProduct.quantity}, Requested: ${productSaleData.soldQuantity}`);
           setLoading(false);
           return;
         }
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
            }],
            by: paymentMethod,
            paymentImageUrl: paymentImageUrl || undefined
          }
        : { type: saleType, reason: withdrawalData.reason, amount: withdrawalData.amount };

      // If offline, queue the operation
      if (isOffline) {
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

      // Online submission
      const token = localStorage.getItem('token');
      
      if (saleType === 'product_sale') {
          if (isEditMode && editingRecordId) {
            // UPDATE: Subtract the NEW sold quantity from product
            // Logic: Product quantity = Current quantity - New sold quantity
            
            // Update existing product sale
            const updateData = {
              productName: productSaleData.productName,
              soldQuantity: productSaleData.soldQuantity,
              pricePerUnit: productSaleData.pricePerUnit,
              totalSoldMoney: productSaleData.soldQuantity * productSaleData.pricePerUnit,
              quantityDifference: productSaleData.soldQuantity, // SUBTRACT (+) the new sold quantity
              productId: productSaleData.productId,
              by: paymentMethod,
              paymentImageUrl: paymentImageUrl || undefined,
              status: 'pending' // Always set to pending by default
            };
            
            // Debug: Log the update data being sent
            console.log('Sending update data:', updateData);
            
            const saleResponse = await fetch(`/api/product-sales/${editingRecordId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(updateData)
            });

            if (!saleResponse.ok) {
              const errorData = await saleResponse.json();
              throw new Error(errorData.error || 'Failed to update product sale');
            }
            
            // Refresh products to show updated quantities after edit
            await fetchProducts();
        } else {
          // Create new product sale - Update quantity FIRST, then create sale
          
          // Step 1: Update product quantity FIRST
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

          // Step 2: Create the sale record
          const requestBody = {
            productSales: [{
              productId: productSaleData.productId,
              productName: productSaleData.productName,
              soldQuantity: productSaleData.soldQuantity,
              pricePerUnit: productSaleData.pricePerUnit,
              status: 'pending' // Always set to pending by default
            }],
            by: paymentMethod,
            paymentImageUrl: paymentImageUrl || undefined
          };
          
          const saleResponse = await fetch('/api/product-sales', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
          });

          if (!saleResponse.ok) {
            // If sale creation fails, we need to rollback the quantity update
            console.error('🛒 Sale creation failed, rolling back quantity update');
            const rollbackResponse = await fetch('/api/products/update-quantity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            productUpdates: [{
              productId: productSaleData.productId,
                  quantitySold: -productSaleData.soldQuantity // Negative to add back
            }]
          })
        });

            if (!rollbackResponse.ok) {
              console.error('🛒 Failed to rollback quantity update');
        }
            
            throw new Error('Failed to record product sale');
        }

        // Refresh products to show updated quantities
          await fetchProducts();
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
          availableQuantity: 0,
          status: 'pending'
        });
        setPaymentMethod('cash');
        setPaymentImageUrl('');
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
                  pricePerUnit: productSaleData.pricePerUnit,
                  status: 'pending' // Always set to pending by default
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
    setIsEditMode(true);
    setEditingRecordId(record._id);
    setEditingRecordType(recordType);

    if (recordType === 'product_sale') {
      const saleRecord = record as ProductSale;
      
      // Find the product by name to get the productId
      const product = products.find(p => p.name === saleRecord.productName);
      
      if (!product) {
        alert('Product not found. Please refresh the page and try again.');
        return;
      }
      
      // Store original sale data for quantity management
      setOriginalSaleData({ 
        soldQuantity: saleRecord.soldQuantity, 
        productId: product._id,
        productName: saleRecord.productName
      });
      
      // Store the current product quantity before restoration
      const currentProductQuantity = product.quantity;
      
      setProductSaleData({
        productId: product._id,
        productName: saleRecord.productName,
        soldQuantity: saleRecord.soldQuantity,
        pricePerUnit: saleRecord.pricePerUnit,
        availableQuantity: currentProductQuantity + saleRecord.soldQuantity, // Available after restoration
        status: saleRecord.status || 'pending'
      });
      
      // Correctly set payment method and image URL from the record
      setPaymentMethod(saleRecord.by || 'cash');
      setPaymentImageUrl(saleRecord.paymentImageUrl || '');
      setSaleType('product_sale');
      
      // Debug: Log the payment data being set
      console.log('Setting payment data for edit:', {
        paymentMethod: saleRecord.by || 'cash',
        paymentImageUrl: saleRecord.paymentImageUrl || '',
        originalRecord: saleRecord
      });
      
              // START EDIT: Add the original sold quantity back to product
        // Logic: Product quantity = Current quantity + Original sold quantity
        try {
          const token = localStorage.getItem('token');
          const restoreResponse = await fetch(`/api/products/update-quantity`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              productUpdates: [{
                productId: product._id,
                quantitySold: -saleRecord.soldQuantity // ADD (+) the original sold quantity back
              }]
            })
          });

        if (!restoreResponse.ok) {
          throw new Error('Failed to restore product quantity');
        }
          
          // Refresh products to show updated quantities
          await fetchProducts();
        
                 // Verify the restoration was successful
         const updatedProducts = await fetch('/api/products', {
           headers: { 'Authorization': `Bearer ${token}` }
         }).then(res => res.json());
         
         const updatedProduct = updatedProducts.products.find((p: any) => p._id === product._id);
         const expectedQuantity = currentProductQuantity + saleRecord.soldQuantity;
         if (updatedProduct && updatedProduct.quantity !== expectedQuantity) {
           alert('Warning: Quantity restoration may not have completed correctly. Please refresh and try again.');
         }
        
        } catch (error) {
          console.error('Error restoring product quantity for edit:', error);
        alert('Failed to restore product quantity. Please try again.');
        setIsEditMode(false);
        setEditingRecordId(null);
        setEditingRecordType(null);
        return;
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
    // CANCEL: Subtract the ORIGINAL sold quantity from product
    // Logic: When we started editing, we ADDED the original quantity back
    // Now we need to SUBTRACT it to cancel the edit
    if (isEditMode && editingRecordType === 'product_sale' && originalSaleData?.productId) {
      try {
        const token = localStorage.getItem('token');
        const rollbackResponse = await fetch(`/api/products/update-quantity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            productUpdates: [{
              productId: originalSaleData.productId,
              quantitySold: originalSaleData.soldQuantity // SUBTRACT (-) the original sold quantity
            }]
          })
        });

        if (!rollbackResponse.ok) {
          throw new Error('Failed to rollback product quantity');
        }
        
        // Refresh products to show updated quantities
        await fetchProducts();
        
      } catch (error) {
        console.error('Error rolling back product quantity:', error);
        alert('Failed to cancel edit. Please refresh the page and try again.');
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

  const handleConfirmDelete = async () => {
    if (!deleteModal.record) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      
      // Determine if it's a product sale or withdrawal based on the record structure
      if ('productName' in deleteModal.record) {
        // Delete product sale
        const response = await fetch(`/api/product-sales/${deleteModal.record._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete product sale');
        }
      } else {
        // Delete withdrawal
        const response = await fetch(`/api/withdrawals/${deleteModal.record._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete withdrawal');
        }
      }

      // Refresh data
      if (showHistory) {
        fetchSalesData();
      }
      
      closeDeleteModal();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error deleting record:', error);
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
                          value={productSaleData.soldQuantity || ''}
                          onChange={(e) => updateSoldQuantity(parseInt(e.target.value) || 0)}
                          className="field-input"
                          placeholder="e.g., 5, 10, 25"
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
                          Please upload a screenshot or photo of your mobile banking payment confirmation
                        </p>
                        <ImageUpload
                          onImageUpload={setPaymentImageUrl}
                          onImageRemove={() => setPaymentImageUrl("")}
                          currentImageUrl={paymentImageUrl}
                          disabled={loading}
                          cameraOnly={true} // Force camera-only mode for mobile banking
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

