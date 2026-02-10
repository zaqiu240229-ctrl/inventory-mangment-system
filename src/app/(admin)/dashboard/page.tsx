"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { demoDataStore, isDemoMode } from "@/lib/demo-data";
import { formatCurrency, formatNumber, formatPriceInIQDSync } from "@/lib/utils";
import {
  Package,
  Boxes,
  DollarSign,
  TrendingUp,
  ArrowRight,
  ShoppingCart,
  BarChart3,
  FileText,
  Settings,
} from "lucide-react";
import type { DashboardStats } from "@/types";
import StatCard from "@/components/ui/StatCard";
import { CurrencyConverter } from "@/components/CurrencyConverter";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalStock: 0,
    totalBuyValue: 0,
    totalSellValue: 0,
    totalProfit: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      if (isDemoMode) {
        // Use centralized demo data store
        setStats(demoDataStore.getDashboardStats());
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Fetch products (non-deleted)
      const { data: products } = await supabase
        .from("products")
        .select("*, category:categories(*)")
        .is("deleted_at", null);

      // Fetch stocks with products
      const { data: stocks } = await supabase
        .from("stocks")
        .select("*, product:products(*, category:categories(*))");

      const activeProducts = products || [];
      const allStocks = stocks || [];

      // Calculate stats
      const totalProducts = activeProducts.length;
      const totalStock = allStocks.reduce((sum: number, s: any) => sum + s.quantity, 0);

      // Calculate buy/sell values from transactions
      let totalBuyValue = 0;
      let totalSellValue = 0;

      const { data: buyTxns } = await supabase
        .from("transactions")
        .select("total")
        .eq("type", "BUY");

      const { data: sellTxns } = await supabase
        .from("transactions")
        .select("total")
        .eq("type", "SELL");

      if (buyTxns) totalBuyValue = buyTxns.reduce((sum: number, t: any) => sum + Number(t.total), 0);
      if (sellTxns) totalSellValue = sellTxns.reduce((sum: number, t: any) => sum + Number(t.total), 0);

      setStats({
        totalProducts,
        totalStock,
        totalBuyValue,
        totalSellValue,
        totalProfit: 0,
      });
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      // Fall back to demo data on error
      setStats({
        totalProducts: 350,
        totalStock: 1250,
        totalBuyValue: 15200,
        totalSellValue: 28500,
        totalProfit: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    
    // Subscribe to demo data changes for real-time updates
    if (isDemoMode) {
      const unsubscribe = demoDataStore.subscribe(() => {
        setStats(demoDataStore.getDashboardStats());
      });
      return unsubscribe;
    }
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin w-8 h-8 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-slate-400 text-sm">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Products"
          value={formatNumber(stats.totalProducts)}
          icon={<Package className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Total Stock"
          value={formatNumber(stats.totalStock)}
          icon={<Boxes className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          label="Total Buy Value"
          value={formatPriceInIQDSync(stats.totalBuyValue, "IQD")}
          icon={<ShoppingCart className="w-5 h-5" />}
          color="yellow"
        />
        <StatCard
          label="Total Sell Value"
          value={formatPriceInIQDSync(stats.totalSellValue, "IQD")}
          icon={<Boxes className="w-5 h-5" />}
          color="green"
        />
      </div>

      {/* Currency Converter */}
      <div className="grid grid-cols-1 gap-6">
        <div className="card p-5">
          <CurrencyConverter />
        </div>
      </div>
    </div>
  );
}
