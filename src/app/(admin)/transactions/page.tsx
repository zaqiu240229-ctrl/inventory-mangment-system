"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { Transaction, Product } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import Tabs from "@/components/ui/Tabs";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownCircle, ArrowUpCircle, Trash2, BarChart3 } from "lucide-react";

const PAGE_SIZE = 10;

export default function TransactionsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("transactions");
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<"ALL" | "BUY" | "SELL">("ALL");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    transaction: Transaction | null;
  }>({ show: false, transaction: null });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions");
      const result = await res.json();
      if (result.success) setAllTransactions(result.data);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = async () => {
    const transaction = deleteConfirm.transaction;
    if (!transaction) return;

    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, { method: "DELETE" });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });

      setAllTransactions((prev) => prev.filter((t) => t.id !== transaction.id));
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete transaction",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirm({ show: false, transaction: null });
    }
  };

  // Filter and paginate
  const filteredTransactions =
    filterType === "ALL" ? allTransactions : allTransactions.filter((t) => t.type === filterType);
  const totalCount = filteredTransactions.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const transactions = filteredTransactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center justify-between mb-6">
        <Tabs
          tabs={[{ id: "transactions", label: "Transactions" }]}
          activeTab={activeTab}
          onChange={(id) => {
            setActiveTab(id);
          }}
        />
        <div className="flex items-center gap-2">
          <Link
            href="/reports"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            View Reports
          </Link>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as "ALL" | "BUY" | "SELL");
              setPage(1);
            }}
            className="input-field w-auto text-sm"
          >
            <option value="ALL">All Types</option>
            <option value="BUY">Purchases</option>
            <option value="SELL">Sales</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e293b]">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn.id} className="table-row">
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {formatDateTime(txn.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-white">
                        {txn.product?.name || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={txn.type === "SELL" ? "green" : "blue"}>{txn.type}</Badge>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-white font-medium">
                      {txn.quantity}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-white">
                      {formatCurrency(txn.total)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setDeleteConfirm({ show: true, transaction: txn })}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-[#1e293b] rounded-md transition-colors"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirm.show}
        onOpenChange={(open) => setDeleteConfirm({ show: open, transaction: null })}
        title="Delete Transaction"
        description={
          deleteConfirm.transaction
            ? `Are you sure you want to delete this ${deleteConfirm.transaction.type} transaction for ${deleteConfirm.transaction.product?.name}? This action cannot be undone.`
            : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
