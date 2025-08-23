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

    // Store the original operation for worker updates
    const originalOperation = user.adminServiceOperations[operationIndex];

    // Ensure the operation has an _id field
    if (!user.adminServiceOperations[operationIndex]._id) {
      user.adminServiceOperations[operationIndex]._id = new mongoose.Types.ObjectId();
    }

    // Remove originalOperation and convertToNewStructure from updateData before saving
    const { originalOperation: updateOriginalOperation, convertToNewStructure, ...cleanUpdateData } = updateData;
    
    console.log("🔧 [DB-SERVICE] Updating admin service operation:", {
      operationIndex,
      originalOperation: user.adminServiceOperations[operationIndex],
      newData: cleanUpdateData,
      convertToNewStructure
    });
    
    // If converting to new structure, ensure we have the proper format
    if (convertToNewStructure) {
      console.log("🔧 [DB-SERVICE] Converting operation to new structure:", {
        operationIndex,
        cleanUpdateData
      });
      
      // Create the new structure operation
      const newStructureOperation = {
        _id: user.adminServiceOperations[operationIndex]._id || new mongoose.Types.ObjectId(),
        name: cleanUpdateData.name,
        totalPrice: cleanUpdateData.totalPrice,
        workers: cleanUpdateData.workers,
        status: user.adminServiceOperations[operationIndex].status || 'pending',
        createdAt: user.adminServiceOperations[operationIndex].createdAt || new Date(),
        by: cleanUpdateData.by,
        paymentImageUrl: cleanUpdateData.paymentImageUrl,
        updatedAt: new Date()
      };
      
      console.log("🔧 [DB-SERVICE] New structure operation:", newStructureOperation);
      
      // Replace the operation in the array
      user.adminServiceOperations[operationIndex] = newStructureOperation as any;
      
      // Mark the array as modified
      user.markModified('adminServiceOperations');
      
      // Save the user
      await user.save();
      
      console.log("🔧 [DB-SERVICE] Operation converted successfully");
      
      // Handle worker service operations updates
      await this.handleWorkerServiceOperationsUpdate(originalOperation, newStructureOperation);
      
      return newStructureOperation;
    } else {
      // Regular update (old structure) - use any type to avoid TypeScript issues
      (user.adminServiceOperations[operationIndex] as any) = {
        ...user.adminServiceOperations[operationIndex],
        ...cleanUpdateData,
        updatedAt: new Date()
      };
    }

    // Mark the adminServiceOperations array as modified to ensure it gets saved
    user.markModified('adminServiceOperations');
    
    // Force save and verify the data was saved
    await user.save();
    
    // Handle worker service operations updates
    await this.handleWorkerServiceOperationsUpdate(originalOperation, user.adminServiceOperations[operationIndex]);
    
    return user.adminServiceOperations[operationIndex];
  }

  // New method to handle worker service operations updates
  static async handleWorkerServiceOperationsUpdate(originalOperation: any, updatedOperation: any) {
    console.log("🔧 [DB-SERVICE] Handling worker service operations update:", {
      originalOperation,
      updatedOperation
    });

    try {
      // If this is a new structure operation (has workers array)
      if (updatedOperation.workers && updatedOperation.workers.length > 0) {
        console.log("🔧 [DB-SERVICE] Processing new structure operation with workers:", updatedOperation.workers);
        
        // Handle each worker in the workers array
        for (const worker of updatedOperation.workers) {
          await this.updateWorkerServiceOperation(worker, updatedOperation, originalOperation);
        }
      } else {
        // Handle old structure operation (single worker)
        console.log("🔧 [DB-SERVICE] Processing old structure operation");
        
        const workerData = {
          workerId: updatedOperation.workerId,
          workerName: updatedOperation.workerName,
          workerRole: updatedOperation.workerRole,
          price: updatedOperation.price || updatedOperation.totalPrice
        };
        
        await this.updateWorkerServiceOperation(workerData, updatedOperation, originalOperation);
      }
    } catch (error) {
      console.error("🔧 [DB-SERVICE] Error handling worker service operations update:", error);
      // Don't throw error here to avoid breaking the main update
    }
  }

  // Helper method to update individual worker service operations
  static async updateWorkerServiceOperation(workerData: any, updatedOperation: any, originalOperation: any) {
    console.log("🔧 [DB-SERVICE] Updating worker service operation:", {
      workerData,
      updatedOperation,
      originalOperation
    });

    if (!workerData.workerId) {
      console.log("🔧 [DB-SERVICE] No worker ID provided, skipping worker update");
      return;
    }

    // Find the worker user
    const workerUser = await User.findById(workerData.workerId);
    if (!workerUser) {
      console.log("🔧 [DB-SERVICE] Worker user not found:", workerData.workerId);
      return;
    }

    if (!workerUser.serviceOperations) {
      workerUser.serviceOperations = [];
    }

    // Check if role has changed (handle both old and new structure)
    const originalRole = originalOperation.workerRole || (originalOperation.workers && originalOperation.workers[0]?.workerRole);
    const originalWorkerId = originalOperation.workerId || (originalOperation.workers && originalOperation.workers[0]?.workerId);
    
    const roleChanged = originalRole !== workerData.workerRole;
    const workerIdChanged = originalWorkerId !== workerData.workerId;
    
    console.log("🔧 [DB-SERVICE] Role/ID change check:", {
      roleChanged,
      workerIdChanged,
      originalRole: originalOperation.workerRole,
      newRole: workerData.workerRole,
      originalWorkerId: originalOperation.workerId,
      newWorkerId: workerData.workerId
    });

    // If role or worker ID changed, remove from original worker's serviceOperations
    if ((roleChanged || workerIdChanged) && originalWorkerId) {
      const originalWorker = await User.findById(originalWorkerId);
      if (originalWorker && originalWorker.serviceOperations) {
        const originalWorkerOperationIndex = (originalWorker.serviceOperations as any[]).findIndex(op => 
          op._id && op._id.toString() === originalOperation._id?.toString()
        );
        
        if (originalWorkerOperationIndex !== -1) {
          console.log("🔧 [DB-SERVICE] Removing operation from original worker:", {
            workerId: originalWorkerId,
            operationIndex: originalWorkerOperationIndex
          });
          
          (originalWorker.serviceOperations as any[]).splice(originalWorkerOperationIndex, 1);
          originalWorker.markModified('serviceOperations');
          await originalWorker.save();
        }
      }
    }

    // Find the operation in the current worker's serviceOperations
    let operationIndex = (workerUser.serviceOperations as any[]).findIndex(op => 
      op._id && op._id.toString() === updatedOperation._id?.toString()
    );

    // If not found by ID, try to find by matching properties
    if (operationIndex === -1) {
      operationIndex = (workerUser.serviceOperations as any[]).findIndex(op => {
        return op.name === originalOperation.name &&
               op.price === originalOperation.price &&
               (op.workerName === originalOperation.workerName || op.workerName === (originalOperation.workers && originalOperation.workers[0]?.workerName)) &&
               (op.workerRole === originalOperation.workerRole || op.workerRole === (originalOperation.workers && originalOperation.workers[0]?.workerRole)) &&
               op.by === originalOperation.by;
      });
    }

    // Create the worker operation data
    const workerOperationData = {
      _id: updatedOperation._id || new mongoose.Types.ObjectId(),
      name: updatedOperation.name,
      price: workerData.price,
      workerName: workerData.workerName,
      workerRole: workerData.workerRole,
      workerId: workerData.workerId,
      status: updatedOperation.status || 'pending',
      createdAt: updatedOperation.createdAt || new Date(),
      by: updatedOperation.by,
      paymentImageUrl: updatedOperation.paymentImageUrl,
      updatedAt: new Date()
    };

    if (operationIndex !== -1) {
      // Update existing operation
      console.log("🔧 [DB-SERVICE] Updating existing worker operation:", {
        workerId: workerData.workerId,
        operationIndex
      });
      
      workerUser.serviceOperations[operationIndex] = workerOperationData as any;
    } else {
      // Add new operation
      console.log("🔧 [DB-SERVICE] Adding new worker operation:", {
        workerId: workerData.workerId
      });
      
      workerUser.serviceOperations.push(workerOperationData as any);
    }

    // Mark the serviceOperations array as modified
    workerUser.markModified('serviceOperations');
    
    // Save the worker user
    await workerUser.save();
    
    console.log("🔧 [DB-SERVICE] Worker service operation updated successfully:", {
      workerId: workerData.workerId,
      operationId: workerOperationData._id
    });
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
