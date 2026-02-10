import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  description: z.string().max(200).optional(),
});

export const productSchema = z.object({
  name: z.string().min(2, "Product name is required").max(100),
  model: z.string().min(1, "Model is required").max(100),
  category_id: z.string().uuid("Select a valid category"),
  buy_price: z.number().min(0, "Buy price must be positive"),
  sell_price: z.number().min(0, "Sell price must be positive"),
});

export const stockUpdateSchema = z.object({
  product_id: z.string().uuid("Select a valid product"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  type: z.enum(["BUY", "SELL"]),
  price: z.number().min(0, "Price must be positive"),
});

export const reportFilterSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  type: z.enum(["BUY", "SELL"]).optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type StockUpdateFormData = z.infer<typeof stockUpdateSchema>;
export type ReportFilterFormData = z.infer<typeof reportFilterSchema>;
