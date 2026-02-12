"use client";

import React, { useEffect, useState, useCallback } from "react";
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
      const res = await fetch("/api/dashboard");
      const result = await res.json();
      if (result.success) {
        setStats(result.data.stats);
      }
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      setStats({
        totalProducts: 0,
        totalStock: 0,
        totalBuyValue: 0,
        totalSellValue: 0,
        totalProfit: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin w-8 h-8 text-blue-500" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
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
