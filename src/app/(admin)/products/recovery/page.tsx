"use client";

import React, { useEffect, useState, useCallback } from "react";
import type { Product, Category } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { RotateCcw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

const DEMO_DELETED_PRODUCTS: Product[] = [
  {
    id: "d1",
    name: "Old iPhone 6 Screen",
    model: "iPhone 6",
    category_id: "1",
    buy_price: 500,
    sell_price: 800,
    currency: "IQD",
    created_at: "",
    updated_at: "",
    deleted_at: "2024-04-10T12:00:00Z",
    category: {
      id: "1",
      name: "Screens",
      description: null,
      is_active: true,
      created_at: "",
      updated_at: "",
    } as Category,
  },
  {
    id: "d2",
    name: "Galaxy S5 Battery",
    model: "Galaxy S5",
    category_id: "2",
    buy_price: 300,
    sell_price: 500,
    currency: "IQD",
    created_at: "",
    updated_at: "",
    deleted_at: "2024-04-08T09:00:00Z",
    category: {
      id: "2",
      name: "Batteries",
      description: null,
      is_active: true,
      created_at: "",
      updated_at: "",
    } as Category,
  },
];

export default function ProductRecoveryPage() {
  const { toast } = useToast();
  const [deletedProducts, setDeletedProducts] = useState<Product[]>([]);
  const [recoverConfirm, setRecoverConfirm] = useState<{ show: boolean; product: Product | null }>({
    show: false,
    product: null,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; product: Product | null }>({
    show: false,
    product: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchDeleted = useCallback(async () => {
    try {
      const res = await fetch("/api/products?deleted=true");
      const result = await res.json();
      if (result.success) {
        setDeletedProducts(result.data);
      }
    } catch (err) {
      console.error("Error fetching deleted products:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDeleted();
  }, [fetchDeleted]);

  const handleRecover = async (product: Product) => {
    setRecoverConfirm({ show: true, product });
  };

  const confirmRecover = async () => {
    if (!recoverConfirm.product) return;

    const product = recoverConfirm.product;

    try {
      const res = await fetch(`/api/products/${product.id}/recover`, {
        method: "POST",
      });
      const result = await res.json();

      if (result.success) {
        toast({
          title: "Product recovered",
          description: `${product.name} has been restored to inventory`,
        });
        fetchDeleted();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to recover product",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to recover product",
        variant: "destructive",
      });
    }
    setRecoverConfirm({ show: false, product: null });
  };

  const handleDelete = async (product: Product) => {
    setDeleteConfirm({ show: true, product });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.product) return;

    const product = deleteConfirm.product;

    try {
      const res = await fetch(`/api/products/${product.id}?permanent=true`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (result.success) {
        toast({
          title: "Product permanently deleted",
          description: `${product.name} has been permanently removed from the system`,
        });
        fetchDeleted();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to permanently delete product",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to permanently delete product",
        variant: "destructive",
      });
    }
    setDeleteConfirm({ show: false, product: null });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
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
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Product Recovery</h2>
        <p className="text-sm text-slate-400 mt-1">
          Recover deleted products. Products are never permanently removed.
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e293b]">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Model
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Buy Price
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Deleted At
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {deletedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No deleted products to recover
                  </td>
                </tr>
              ) : (
                deletedProducts.map((product) => (
                  <tr key={product.id} className="table-row">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-white">{product.name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">{product.model}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {product.category?.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {formatCurrency(product.buy_price)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {product.deleted_at ? formatDate(product.deleted_at) : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRecover(product)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-md transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Recover
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recovery Confirmation Dialog */}
      <ConfirmationDialog
        open={recoverConfirm.show}
        onOpenChange={(open: boolean) => setRecoverConfirm({ show: open, product: null })}
        title="Recover Product"
        description={
          recoverConfirm.product
            ? `Are you sure you want to recover "${recoverConfirm.product.name}"? This will restore the product to the main inventory.`
            : ""
        }
        confirmText="Recover"
        cancelText="Cancel"
        onConfirm={confirmRecover}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirm.show}
        onOpenChange={(open: boolean) => setDeleteConfirm({ show: open, product: null })}
        title="Permanently Delete Product"
        description={
          deleteConfirm.product
            ? `Are you sure you want to permanently delete "${deleteConfirm.product.name}"? This action cannot be undone and the product will be completely removed from the system.`
            : ""
        }
        confirmText="Delete Permanently"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}
