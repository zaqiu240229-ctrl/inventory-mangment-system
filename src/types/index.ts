// ============================================
// Type Definitions
// ============================================

export interface Admin {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  model: string;
  category_id: string;
  buy_price: number;
  sell_price: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Joined fields
  category?: Category;
  stock?: Stock;
}

export interface Stock {
  id: string;
  product_id: string;
  quantity: number;
  min_alert_quantity: number;
  updated_at: string;
  // Joined fields
  product?: Product;
}

export type TransactionType = "BUY" | "SELL";

export interface Transaction {
  id: string;
  product_id: string;
  type: TransactionType;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
  // Joined fields
  product?: Product;
}

export interface ActivityLog {
  id: string;
  admin_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  // Joined fields
  admin?: Admin;
}

// ============================================
// Stock Status
// ============================================

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export function getStockStatus(quantity: number, minAlert: number): StockStatus {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= minAlert) return "low_stock";
  return "in_stock";
}

export function getStockStatusLabel(status: StockStatus): string {
  switch (status) {
    case "in_stock":
      return "In Stock";
    case "low_stock":
      return "Low Stock";
    case "out_of_stock":
      return "Out of Stock";
  }
}

export function getStockStatusColor(status: StockStatus): string {
  switch (status) {
    case "in_stock":
      return "green";
    case "low_stock":
      return "yellow";
    case "out_of_stock":
      return "red";
  }
}

// ============================================
// Dashboard Types
// ============================================

export interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  totalBuyValue: number;
  totalSellValue: number;
  totalProfit: number;
}

export interface LowStockAlert {
  product: Product;
  stock: Stock;
  status: StockStatus;
}

// ============================================
// Report Types
// ============================================

export interface ReportData {
  totalPurchases: number;
  totalSales: number;
  totalProfit: number;
  transactionCount: number;
  transactions: Transaction[];
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// Form Types
// ============================================

export interface CategoryFormData {
  name: string;
  description: string;
}

export interface ProductFormData {
  name: string;
  model: string;
  category_id: string;
  buy_price: number;
  sell_price: number;
}

export interface StockFormData {
  product_id: string;
  quantity: number;
  type: TransactionType;
  price: number;
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  type?: TransactionType;
}
