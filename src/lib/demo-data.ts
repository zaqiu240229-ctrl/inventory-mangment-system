import type { Category, Product, Stock, Transaction, DashboardStats, ActivityLog } from "@/types";

// Clean Demo Data Store - Optimized for performance
class DemoDataStore {
  private static instance: DemoDataStore;
  private categories: Category[] = [];
  private products: Product[] = [];
  private transactions: Transaction[] = [];
  private activityLogs: ActivityLog[] = [];
  private listeners: (() => void)[] = [];
  private nextId = 10;
  private initialized = false;

  private constructor() {
    // Delay initialization until first access
  }

  static getInstance(): DemoDataStore {
    if (!DemoDataStore.instance) {
      DemoDataStore.instance = new DemoDataStore();
    }
    return DemoDataStore.instance;
  }

  private initializeData() {
    if (this.initialized) return;

    // Initialize categories
    this.categories = [
      {
        id: "1",
        name: "Screens",
        description: "LCD, OLED, and touch screen panels",
        is_active: true,
        created_at: "",
        updated_at: "",
      },
      {
        id: "2",
        name: "Batteries",
        description: "Mobile phone batteries and power cells",
        is_active: true,
        created_at: "",
        updated_at: "",
      },
      {
        id: "3",
        name: "Chargers",
        description: "Charging cables, adapters, and wireless chargers",
        is_active: true,
        created_at: "",
        updated_at: "",
      },
    ];

    // Initialize products - reduced to essential items only
    this.products = [
      {
        id: "1",
        name: "iPhone 11 Display",
        model: "iPhone 11",
        category_id: "1",
        buy_price: 2290,
        sell_price: 3200,
        created_at: "2024-01-15T08:30:00Z",
        updated_at: "2024-01-15T08:30:00Z",
        deleted_at: null,
        category: this.findCategory("1"),
        stock: {
          id: "stock_1",
          product_id: "1",
          quantity: 15,
          min_alert_quantity: 5,
          updated_at: "2024-01-15T08:30:00Z",
        },
      },
      {
        id: "2",
        name: "iPhone 12 Display",
        model: "iPhone 12",
        category_id: "1",
        buy_price: 2800,
        sell_price: 3800,
        created_at: "2024-01-15T08:30:00Z",
        updated_at: "2024-01-15T08:30:00Z",
        deleted_at: null,
        category: this.findCategory("1"),
        stock: {
          id: "stock_2",
          product_id: "2",
          quantity: 8,
          min_alert_quantity: 5,
          updated_at: "2024-01-15T08:30:00Z",
        },
      },
      {
        id: "3",
        name: "Samsung Galaxy S21 Battery",
        model: "Galaxy S21",
        category_id: "2",
        buy_price: 450,
        sell_price: 650,
        created_at: "2024-01-15T08:30:00Z",
        updated_at: "2024-01-15T08:30:00Z",
        deleted_at: null,
        category: this.findCategory("2"),
        stock: {
          id: "stock_3",
          product_id: "3",
          quantity: 20,
          min_alert_quantity: 5,
          updated_at: "2024-01-15T08:30:00Z",
        },
      },
      {
        id: "4",
        name: "USB-C Fast Charger",
        model: "Universal",
        category_id: "3",
        buy_price: 120,
        sell_price: 180,
        created_at: "2024-01-15T08:30:00Z",
        updated_at: "2024-01-15T08:30:00Z",
        deleted_at: null,
        category: this.findCategory("3"),
        stock: {
          id: "stock_4",
          product_id: "4",
          quantity: 30,
          min_alert_quantity: 10,
          updated_at: "2024-01-15T08:30:00Z",
        },
      },
    ];

    // Initialize minimal transaction history - updated with current dates
    this.transactions = [
      {
        id: "1",
        type: "SELL",
        product_id: "1",
        quantity: 2,
        price: 3200, // sell_price of product 1
        total: 6400,
        created_at: "2026-02-08T10:15:00Z", // Recent date
        product: this.findProduct("1"),
      },
      {
        id: "2",
        type: "BUY",
        product_id: "3",
        quantity: 5,
        price: 450, // buy_price of product 3
        total: 2250,
        created_at: "2026-02-07T14:30:00Z", // Recent date
        product: this.findProduct("3"),
      },
      {
        id: "3",
        type: "SELL",
        product_id: "2",
        quantity: 1,
        price: 3800, // sell_price of product 2
        total: 3800,
        created_at: "2026-02-10T09:00:00Z", // Today's date
        product: this.findProduct("2"),
      },
      {
        id: "4",
        type: "SELL",
        product_id: "4",
        quantity: 5,
        price: 180, // sell_price of product 4
        total: 900,
        created_at: "2026-02-09T16:45:00Z", // Yesterday's date
        product: this.findProduct("4"),
      },
      {
        id: "5",
        type: "BUY",
        product_id: "1",
        quantity: 2,
        price: 2290, // buy_price of product 1
        total: 4580,
        created_at: "2026-02-06T11:20:00Z", // A few days ago
        product: this.findProduct("1"),
      },
      {
        id: "6",
        type: "SELL",
        product_id: "1",
        quantity: 5,
        price: 3200, // sell_price of product 1
        total: 16000,
        created_at: "2026-02-05T13:10:00Z", // More sales
        product: this.findProduct("1"),
      },
      {
        id: "7",
        type: "SELL",
        product_id: "2",
        quantity: 2,
        price: 3800, // sell_price of product 2
        total: 7600,
        created_at: "2026-02-04T15:25:00Z", // More sales
        product: this.findProduct("2"),
      },
      {
        id: "8",
        type: "SELL",
        product_id: "4",
        quantity: 10,
        price: 180, // sell_price of product 4
        total: 1800,
        created_at: "2026-02-03T10:45:00Z", // More sales
        product: this.findProduct("4"),
      },
    ];

    this.initialized = true;
  }

  private findCategory(id: string): Category | undefined {
    return this.categories.find((c) => c.id === id);
  }

  private findProduct(id: string): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  // Simple notification system
  subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach((callback) => callback());
  }

  private addActivityLog(action: string, entity_type: string, entity_id: string, details?: any) {
    this.activityLogs.unshift({
      id: String(this.nextId++),
      admin_id: null,
      action,
      entity_type,
      entity_id,
      details,
      created_at: new Date().toISOString(),
    });

    // Keep only latest 100 logs
    if (this.activityLogs.length > 100) {
      this.activityLogs = this.activityLogs.slice(0, 100);
    }
  }

  // Categories methods
  getCategories(): Category[] {
    this.initializeData();
    return this.categories.filter((c) => c.is_active);
  }

  getCategoryById(id: string): Category | undefined {
    this.initializeData();
    return this.categories.find((c) => c.id === id && c.is_active);
  }

  // Products methods
  getProducts(): Product[] {
    this.initializeData();
    return this.products.filter((p) => p.deleted_at === null);
  }

  getProductById(id: string): Product | undefined {
    return this.products.find((p) => p.id === id && p.deleted_at === null);
  }

  // Stock methods
  getStocks(): Stock[] {
    return this.products
      .filter((p) => p.deleted_at === null && p.stock)
      .map((p) => ({
        id: p.stock!.id,
        product_id: p.id,
        quantity: p.stock!.quantity,
        min_alert_quantity: p.stock!.min_alert_quantity,
        updated_at: p.stock!.updated_at,
      }));
  }

  // Simple, clean stock update - no complex logic or locks
  updateStock(productId: string, quantity: number): boolean {
    try {
      const product = this.products.find((p) => p.id === productId);
      if (!product || !product.stock) {
        return false;
      }

      const oldQuantity = product.stock.quantity;

      // Simple direct update
      product.stock.quantity = quantity;
      product.stock.updated_at = new Date().toISOString();

      // Add activity log
      const action = quantity > oldQuantity ? "STOCK_ADD" : "STOCK_REDUCE";
      this.addActivityLog(action, "stock", productId, {
        product_name: product.name,
        old_quantity: oldQuantity,
        new_quantity: quantity,
      });

      this.notifyListeners();
      return true;
    } catch (error) {
      console.error("Stock update error:", error);
      return false;
    }
  }

  // Transactions methods
  getTransactions(limit?: number): Transaction[] {
    this.initializeData();
    const sorted = [...this.transactions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return limit ? sorted.slice(0, limit) : sorted;
  }

  addTransaction(transactionData: Omit<Transaction, "id" | "created_at" | "product">): Transaction {
    const product = this.products.find((p) => p.id === transactionData.product_id);

    const newTransaction: Transaction = {
      ...transactionData,
      id: String(this.nextId++),
      created_at: new Date().toISOString(),
      product,
    };

    this.transactions.unshift(newTransaction);

    // Log transaction
    const actionType = transactionData.type === "BUY" ? "BUY" : "SELL";
    this.addActivityLog(actionType, "transaction", newTransaction.id, {
      product_name: product?.name || "Unknown Product",
      quantity: transactionData.quantity,
      price: transactionData.price,
      total: transactionData.total,
    });

    this.notifyListeners();
    return newTransaction;
  }

  // Dashboard stats
  getDashboardStats(): DashboardStats {
    const products = this.getProducts();

    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => {
      return sum + (p.stock?.quantity || 0);
    }, 0);

    // Current inventory value at buy/sell prices
    const totalBuyValue = products.reduce((sum, p) => {
      return sum + (p.stock?.quantity || 0) * p.buy_price;
    }, 0);

    const totalSellValue = products.reduce((sum, p) => {
      return sum + (p.stock?.quantity || 0) * p.sell_price;
    }, 0);

    const totalProfit = totalSellValue - totalBuyValue;

    return {
      totalProducts,
      totalStock,
      totalBuyValue,
      totalSellValue,
      totalProfit,
    };
  }

  // Activity logs
  getActivityLogs(limit: number = 20): ActivityLog[] {
    this.initializeData();
    return this.activityLogs.slice(0, limit);
  }

  deleteActivityLog(logId: string): boolean {
    const index = this.activityLogs.findIndex((log) => log.id === logId);
    if (index === -1) return false;
    this.activityLogs.splice(index, 1);
    this.notifyListeners();
    return true;
  }

  deleteTransaction(transactionId: string): boolean {
    const index = this.transactions.findIndex((t) => t.id === transactionId);
    if (index === -1) return false;
    this.transactions.splice(index, 1);
    this.notifyListeners();
    return true;
  }

  // Delete product (marks as deleted)
  deleteProduct(productId: string): boolean {
    const product = this.products.find((p) => p.id === productId);
    if (!product || product.deleted_at !== null) return false;
    product.deleted_at = new Date().toISOString();
    this.addActivityLog("DELETE_PRODUCT", "product", productId, { product_name: product.name });
    this.notifyListeners();
    return true;
  }

  // Update product
  updateProduct(productId: string, updates: Partial<Product>): boolean {
    const product = this.products.find((p) => p.id === productId);
    if (!product) return false;
    Object.assign(product, updates);
    product.updated_at = new Date().toISOString();
    this.addActivityLog("UPDATE_PRODUCT", "product", productId, { product_name: product.name });
    this.notifyListeners();
    return true;
  }

  // Add product
  addProduct(
    productData: Omit<
      Product,
      "id" | "created_at" | "updated_at" | "deleted_at" | "category" | "stock"
    >
  ): Product {
    const newProduct: Product = {
      ...productData,
      id: String(this.nextId++),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      category: this.findCategory(productData.category_id),
      stock: {
        id: `stock_${this.nextId}`,
        product_id: String(this.nextId - 1),
        quantity: 0,
        min_alert_quantity: 5,
        updated_at: new Date().toISOString(),
      },
    };
    this.products.push(newProduct);
    this.addActivityLog("ADD_PRODUCT", "product", newProduct.id, { product_name: newProduct.name });
    this.notifyListeners();
    return newProduct;
  }

  // Update category
  updateCategory(categoryId: string, updates: Partial<Category>): boolean {
    const category = this.categories.find((c) => c.id === categoryId);
    if (!category) return false;
    Object.assign(category, updates);
    category.updated_at = new Date().toISOString();
    this.addActivityLog("UPDATE_CATEGORY", "category", categoryId, {
      category_name: category.name,
    });
    this.notifyListeners();
    return true;
  }

  // Add category
  addCategory(categoryData: Omit<Category, "id" | "created_at" | "updated_at">): Category {
    const newCategory: Category = {
      ...categoryData,
      id: String(this.nextId++),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.categories.push(newCategory);
    this.addActivityLog("ADD_CATEGORY", "category", newCategory.id, {
      category_name: newCategory.name,
    });
    this.notifyListeners();
    return newCategory;
  }

  // Get products by category
  getProductsByCategory(categoryId: string): Product[] {
    this.initializeData();
    return this.products.filter((p) => p.category_id === categoryId && p.deleted_at === null);
  }

  // Get low stock alerts
  getLowStockAlerts(): Product[] {
    this.initializeData();
    return this.products.filter(
      (p) => p.deleted_at === null && p.stock && p.stock.quantity <= p.stock.min_alert_quantity
    );
  }

  // Get deleted products
  getDeletedProducts(): Product[] {
    return this.products.filter((p) => p.deleted_at !== null);
  }

  // Recover product
  recoverProduct(productId: string): boolean {
    const product = this.products.find((p) => p.id === productId);
    if (!product || product.deleted_at === null) return false;
    product.deleted_at = null;
    product.updated_at = new Date().toISOString();
    this.addActivityLog("RECOVER_PRODUCT", "product", productId, { product_name: product.name });
    this.notifyListeners();
    return true;
  }

  // Permanently delete product (completely remove from system)
  permanentlyDeleteProduct(productId: string): boolean {
    const index = this.products.findIndex((p) => p.id === productId);
    if (index === -1) return false;
    const product = this.products[index];
    this.products.splice(index, 1);
    this.addActivityLog("DELETE_PRODUCT_PERMANENT", "product", productId, {
      product_name: product.name,
    });
    this.notifyListeners();
    return true;
  }
}

// Demo mode flag - check if Neon database is configured
export const isDemoMode =
  !process.env.NEON_DATABASE_URL || process.env.NEON_DATABASE_URL === "your_neon_database_url_here";

// Export singleton instance
export const demoDataStore = DemoDataStore.getInstance();
