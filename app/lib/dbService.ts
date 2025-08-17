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
    
    const result = await User.updateOne(
      { "products._id": new mongoose.Types.ObjectId(productId) },
      { 
        $set: { 
          "products.$.quantity": newQuantity,
          "products.$.updatedAt": new Date()
        }
      }
    );

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
  static async getProductSales(adminId: string) {
    await connectDB();
    const user = await User.findById(adminId);
    return user?.productSales || [];
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

    const newProductSale = {
      ...productSaleData,
      _id: new mongoose.Types.ObjectId(),
      createdAt: new Date()
    };

    user.productSales.push(newProductSale);
    await user.save();
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
}
