"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { demoDataStore, isDemoMode } from "@/lib/demo-data";
import type { Stock, Product, Category } from "@/types";
import { getStockStatus } from "@/types";
import Badge from "@/components/ui/Badge";
import { AlertTriangle, AlertCircle, Package } from "lucide-react";

interface AlertItem {
  product: Product;
  stock: Stock;
  type: "low_stock" | "out_of_stock";
}



export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    if (isDemoMode) {
      const lowStockProducts = demoDataStore.getLowStockAlerts();
      const formattedAlerts: AlertItem[] = lowStockProducts.map(p => ({
        product: p,
        stock: p.stock as Stock,
        type: ((p.stock as Stock).quantity ?? 0) <= 0 ? "out_of_stock" : "low_stock"
      }));
      setAlerts(formattedAlerts);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data } = await supabase
      .from("stocks")
      .select("*, product:products(*, category:categories(*))")
      .order("quantity", { ascending: true });

    if (data) {
      const alertItems: AlertItem[] = data
        .filter((s: any) => {
          if (!s.product || s.product.deleted_at) return false;
          const status = getStockStatus(s.quantity, s.min_alert_quantity);
          return status !== "in_stock";
        })
        .map((s: any) => ({
          product: s.product as Product,
          stock: s,
          type: s.quantity <= 0 ? "out_of_stock" : "low_stock",
        }));
      setAlerts(alertItems);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAlerts();
    
    // Subscribe to demo data changes for real-time alerts
    if (isDemoMode) {
      const unsubscribe = demoDataStore.subscribe(() => {
        const lowStockItems = demoDataStore.getLowStockAlerts();
        const formattedAlerts: AlertItem[] = lowStockItems.map(item => ({
          product: item,
          stock: item.stock as Stock,
          type: ((item.stock as Stock).quantity ?? 0) <= 0 ? "out_of_stock" : "low_stock"
        }));
        setAlerts(formattedAlerts);
      });
      return unsubscribe;
    }
  }, [fetchAlerts]);

  const outOfStock = alerts.filter((a) => a.type === "out_of_stock");
  const lowStock = alerts.filter((a) => a.type === "low_stock");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <svg className="animate-spin w-8 h-8 text-blue-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5 border-l-4 border-l-red-500">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <div>
              <p className="text-2xl font-bold text-white">{outOfStock.length}</p>
              <p className="text-sm text-slate-400">Out of Stock Items</p>
            </div>
          </div>
        </div>
        <div className="card p-5 border-l-4 border-l-yellow-500">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <div>
              <p className="text-2xl font-bold text-white">{lowStock.length}</p>
              <p className="text-sm text-slate-400">Low Stock Items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Out of Stock */}
      {outOfStock.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Out of Stock ({outOfStock.length})
          </h3>
          <div className="card overflow-hidden">
            <div className="divide-y divide-[#1e293b]">
              {outOfStock.map((alert) => (
                <div key={alert.stock.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#1a2236] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <Package className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{alert.product.name}</p>
                      <p className="text-xs text-slate-500">{alert.product.model} · {alert.product.category?.name}</p>
                    </div>
                  </div>
                  <Badge variant="red">Out of Stock</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Low Stock */}
      {lowStock.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Low Stock ({lowStock.length})
          </h3>
          <div className="card overflow-hidden">
            <div className="divide-y divide-[#1e293b]">
              {lowStock.map((alert) => (
                <div key={alert.stock.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#1a2236] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                      <Package className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{alert.product.name}</p>
                      <p className="text-xs text-slate-500">
                        {alert.product.model} · {alert.product.category?.name} ·{" "}
                        <span className="text-yellow-400">{alert.stock.quantity} remaining</span>
                      </p>
                    </div>
                  </div>
                  <Badge variant="yellow">Low Stock</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {alerts.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Package className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">All Clear!</h3>
          <p className="text-slate-400 text-sm">No stock alerts at this time. All products are well stocked.</p>
        </div>
      )}
    </div>
  );
}

