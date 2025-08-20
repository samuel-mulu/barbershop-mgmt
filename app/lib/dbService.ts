import mongoose from "mongoose";
import { connectDB } from "./db";
import User from "@/models/User";

// Database service for handling User subcollections
export class DatabaseService {
  // Product operations within User document
  static async getProducts(adminId: string) {
    await connectDB();
    const user = await User.findById(adminId);
    return user?.products || [];
  }

  static async createProduct(adminId: string, productData: any) {
    await connectDB();
    const user = await User.findById(adminId);
    if (!user) {
      throw new Error('User not found');
    }

    // Ensure products array exists
    if (!user.products) {
      user.products = [];
    }

    const newProduct = {
      ...productData,
      _id: new mongoose.Types.ObjectId(),
      createdAt: new Date()
    };

    user.products.push(newProduct);
    await user.save();
    return newProduct;
  }

  static async getProductById(adminId: string, productId: string) {
    await connectDB();
    const user = await User.findById(adminId);
    if (!user) return null;
    
    return user.products?.find(product => product._id.toString() === productId);
  }

  // Get product by ID globally (searches all users)
  static async findProductById(productId: string) {
    await connectDB();
    const users = await User.find({ "products._id": new mongoose.Types.ObjectId(productId) });
    for (const user of users) {
      const product = user.products?.find(p => p._id.toString() === productId);
      if (product) return product;
    }
    return null;
  }

  // Update product quantity (global search)
  static async updateProductQuantity(productId: string, newQuantity: number) {
    await connectDB();
    
    console.log(`🛒 [DB-SERVICE] Updating product ${productId} quantity to:`, newQuantity);
    
    const result = await User.updateOne(
      { "products._id": new mongoose.Types.ObjectId(productId) },
      { 
        $set: { 
          "products.$.quantity": newQuantity,
          "products.$.updatedAt": new Date()
        }
      }
    );

    console.log(`🛒 [DB-SERVICE] Update result:`, {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      success: result.matchedCount > 0
    });

    if (result.matchedCount === 0) {
      throw new Error('Product not found');
    }

    return result;
  }

  // Update product quantity within specific admin context
  static async updateProductQuantityForAdmin(adminId: string, productId: string, quantityChange: number) {
    await connectDB();
    
    const user = await User.findById(adminId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.products) {
      throw new Error('Products array not found');
    }

    console.log('Looking for product with ID:', productId);
    console.log('User products:', user.products.map(p => ({ id: p._id.toString(), name: p.name })));
    
    const productIndex = user.products.findIndex(product => product._id.toString() === productId);
    if (productIndex === -1) {
      throw new Error(`Product with ID ${productId} not found in user's products`);
    }

    const currentQuantity = user.products[productIndex].quantity;
    const newQuantity = Math.max(0, currentQuantity + quantityChange);
    
    user.products[productIndex].quantity = newQuantity;
    user.products[productIndex].updatedAt = new Date();
    
    await user.save();
    return user.products[productIndex];
  }

  static async updateProduct(adminId: string, productId: string, updateData: any) {
    await connectDB();
    const user = await User.findById(adminId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.products) {
      throw new Error('Products array not found');
    }

    const productIndex = user.products.findIndex(product => product._id.toString() === productId);
    if (productIndex === -1) {
      throw new Error('Product not found');
    }

    user.products[productIndex] = {
      ...user.products[productIndex],
      ...updateData
    };

    await user.save();
    return user.products[productIndex];
  }

  static async deleteProduct(adminId: string, productId: string) {
    await connectDB();
    const user = await User.findById(adminId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.products) {
      throw new Error('Products array not found');
    }

    const productIndex = user.products.findIndex(product => product._id.toString() === productId);
    if (productIndex === -1) {
      throw new Error('Product not found');
    }

    const deletedProduct = user.products[productIndex];
    user.products.splice(productIndex, 1);
    await user.save();
    return deletedProduct;
  }

  // Product Sale operations within User document
  static async getProductSales(adminId: string, status?: string) {
    await connectDB();
    const user = await User.findById(adminId);
    const productSales = user?.productSales || [];
    
    // Filter by status if provided
    if (status) {
      return productSales.filter(sale => sale.status === status) as any;
    }
    
    return productSales;
  }

  static async createProductSale(adminId: string, productSaleData: any) {
    await connectDB();
    const user = await User.findById(adminId);
    if (!user) {
      throw new Error('User not found');
    }

    // Ensure productSales array exists
    if (!user.productSales) {
      user.productSales = [];
    }

    console.log('🛒 DatabaseService - Received product sale data:', productSaleData);
    console.log('🛒 DatabaseService - Payment method:', productSaleData.by);
    console.log('🛒 DatabaseService - Payment image URL:', productSaleData.paymentImageUrl);
    console.log('🛒 DatabaseService - Status:', productSaleData.status);

    const newProductSale = {
      ...productSaleData,
      _id: new mongoose.Types.ObjectId(),
      createdAt: new Date(),
      status: productSaleData.status || 'pending' // Ensure status is explicitly set
    };

    console.log('🛒 DatabaseService - Final product sale object:', newProductSale);
    console.log('🛒 DatabaseService - Status in final object:', newProductSale.status);

    user.productSales.push(newProductSale);
    await user.save();
    
    console.log('🛒 DatabaseService - Saved to database. Total sales:', user.productSales.length);
    console.log('🛒 DatabaseService - Last sale payment image URL:', user.productSales[user.productSales.length - 1]?.paymentImageUrl);
    console.log('🛒 DatabaseService - Last sale status:', user.productSales[user.productSales.length - 1]?.status);
    
    return newProductSale;
  }

  static async getProductSaleById(adminId: string, productSaleId: string) {
    await connectDB();
    const user = await User.findById(adminId);
    if (!user) return null;
    
    console.log('Getting product sale by ID:', productSaleId);
    console.log('User product sales:', user.productSales?.map(sale => ({ id: sale._id.toString(), name: sale.productName })));
    
    const sale = user.productSales?.find(sale => sale._id.toString() === productSaleId);
    console.log('Found sale:', sale);
    
    return sale;
  }

  static async updateProductSale(adminId: string, productSaleId: string, updateData: any) {
    await connectDB();
    const user = await User.findById(adminId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.productSales) {
      throw new Error('Product sales array not found');
    }

    const saleIndex = user.productSales.findIndex(sale => sale._id.toString() === productSaleId);
    if (saleIndex === -1) {
      throw new Error('Product sale not found');
    }

    user.productSales[saleIndex] = {
      ...user.productSales[saleIndex],
      ...updateData
    };

    await user.save();
    return user.productSales[saleIndex];
  }

  static async deleteProductSale(adminId: string, productSaleId: string) {
    await connectDB();
    const user = await User.findById(adminId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.productSales) {
      throw new Error('Product sales array not found');
    }

    console.log('Looking for product sale with ID:', productSaleId);
    console.log('Available product sales:', user.productSales.map(sale => ({ id: sale._id.toString(), name: sale.productName })));

    const saleIndex = user.productSales.findIndex(sale => sale._id.toString() === productSaleId);
    if (saleIndex === -1) {
      throw new Error('Product sale not found');
    }

    const deletedSale = user.productSales[saleIndex];
    user.productSales.splice(saleIndex, 1);
    await user.save();
    return deletedSale;
  }

  // Withdrawal operations within User document
  static async getWithdrawals(adminId: string) {
    await connectDB();
    const user = await User.findById(adminId);
    return user?.withdrawals || [];
  }

  static async createWithdrawal(adminId: string, withdrawalData: any) {
    await connectDB();
    const user = await User.findById(adminId);
    if (!user) {
      throw new Error('User not found');
    }

    // Ensure withdrawals array exists
    if (!user.withdrawals) {
      user.withdrawals = [];
    }

    const newWithdrawal = {
      ...withdrawalData,
      _id: new mongoose.Types.ObjectId(),
      createdAt: new Date()
    };

    user.withdrawals.push(newWithdrawal);
    await user.save();
    return newWithdrawal;
  }

  static async getWithdrawalById(adminId: string, withdrawalId: string) {
    await connectDB();
    const user = await User.findById(adminId);
    if (!user) return null;
    
    return user.withdrawals?.find(withdrawal => withdrawal._id.toString() === withdrawalId);
  }

  static async updateWithdrawal(adminId: string, withdrawalId: string, updateData: any) {
    await connectDB();
    const user = await User.findById(adminId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.withdrawals) {
      throw new Error('Withdrawals array not found');
    }

    const withdrawalIndex = user.withdrawals.findIndex(withdrawal => withdrawal._id.toString() === withdrawalId);
    if (withdrawalIndex === -1) {
      throw new Error('Withdrawal not found');
    }

    user.withdrawals[withdrawalIndex] = {
      ...user.withdrawals[withdrawalIndex],
      ...updateData
    };

    await user.save();
    return user.withdrawals[withdrawalIndex];
  }

  static async deleteWithdrawal(adminId: string, withdrawalId: string) {
    await connectDB();
    const user = await User.findById(adminId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.withdrawals) {
      throw new Error('Withdrawals array not found');
    }

    const withdrawalIndex = user.withdrawals.findIndex(withdrawal => withdrawal._id.toString() === withdrawalId);
    if (withdrawalIndex === -1) {
      throw new Error('Withdrawal not found');
    }

    const deletedWithdrawal = user.withdrawals[withdrawalIndex];
    user.withdrawals.splice(withdrawalIndex, 1);
    await user.save();
    return deletedWithdrawal;
  }

  // Admin Service Operations within User document
  static async getAdminServiceOperations(adminId: string) {
    await connectDB();
    const user = await User.findById(adminId);
    return user?.adminServiceOperations || [];
  }

  static async createAdminServiceOperation(adminId: string, operationData: any) {
    await connectDB();
    const user = await User.findById(adminId);
    if (!user) {
      throw new Error('User not found');
    }

    // Ensure adminServiceOperations array exists
    if (!user.adminServiceOperations) {
      user.adminServiceOperations = [];
    }

    const newOperation = {
      ...operationData,
      _id: new mongoose.Types.ObjectId(),
      createdAt: new Date()
    };

    user.adminServiceOperations.push(newOperation);
    await user.save();
    return newOperation;
  }

  static async getAdminServiceOperationById(adminId: string, operationId: string) {
    await connectDB();
    const user = await User.findById(adminId);
    if (!user) return null;
    
    return user.adminServiceOperations?.find(operation => operation._id.toString() === operationId);
  }

  static async updateAdminServiceOperation(adminId: string, operationId: string, updateData: any) {
    await connectDB();
    const user = await User.findById(adminId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.adminServiceOperations) {
      throw new Error('Admin service operations array not found');
    }



    // Find operation by ID or by matching properties if no ID exists
    let operationIndex = -1;
    
    // First try to find by ID
    operationIndex = user.adminServiceOperations.findIndex(operation => 
      operation._id && operation._id.toString() === operationId
    );
    
    // If not found by ID, try to find by matching properties
    if (operationIndex === -1) {
      // Use original operation data for matching if available
      const originalOperation = updateData.originalOperation;
      if (originalOperation) {
        operationIndex = user.adminServiceOperations.findIndex(operation => {
          // Match by essential properties from original operation
          return operation.name === originalOperation.name &&
                 operation.price === originalOperation.price &&
                 operation.workerName === originalOperation.workerName &&
                 operation.workerRole === originalOperation.workerRole &&
                 operation.by === originalOperation.by;
        });
      } else {
        // Fallback: try to find by update data properties
        operationIndex = user.adminServiceOperations.findIndex(operation => {
          return operation.name === updateData.name &&
                 operation.price === updateData.price &&
                 operation.workerName === updateData.workerName &&
                 operation.workerRole === updateData.workerRole &&
                 operation.by === updateData.by;
        });
      }
    }

    if (operationIndex === -1) {
      throw new Error('Admin service operation not found');
    }

    // Ensure the operation has an _id field
    if (!user.adminServiceOperations[operationIndex]._id) {
      user.adminServiceOperations[operationIndex]._id = new mongoose.Types.ObjectId();
    }

    // Remove originalOperation from updateData before saving
    const { originalOperation, ...cleanUpdateData } = updateData;
    

    

    
    user.adminServiceOperations[operationIndex] = {
      ...user.adminServiceOperations[operationIndex],
      ...cleanUpdateData,
      updatedAt: new Date()
    };
    

    


    // Mark the adminServiceOperations array as modified to ensure it gets saved
    user.markModified('adminServiceOperations');
    
    // Force save and verify the data was saved
    await user.save();
    
    return user.adminServiceOperations[operationIndex];
  }

  static async deleteAdminServiceOperation(adminId: string, operationId: string) {
    await connectDB();
    const user = await User.findById(adminId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.adminServiceOperations) {
      throw new Error('Admin service operations array not found');
    }

    const operationIndex = user.adminServiceOperations.findIndex(operation => operation._id.toString() === operationId);
    if (operationIndex === -1) {
      throw new Error('Admin service operation not found');
    }

    const deletedOperation = user.adminServiceOperations[operationIndex];
    user.adminServiceOperations.splice(operationIndex, 1);
    await user.save();
    return deletedOperation;
  }
}
