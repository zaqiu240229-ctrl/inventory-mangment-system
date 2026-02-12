"use client";

import React, { useEffect, useState, useCallback } from "react";
import type { ActivityLog } from "@/types";
import { formatDateTime } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  ScrollText,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Package,
  ArrowUpDown,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const PAGE_SIZE = 15;

const actionIcons: Record<string, React.ReactNode> = {
  CREATE: <Plus className="w-3.5 h-3.5 text-emerald-400" />,
  UPDATE: <Pencil className="w-3.5 h-3.5 text-blue-400" />,
  DELETE: <Trash2 className="w-3.5 h-3.5 text-red-400" />,
  RECOVER: <RotateCcw className="w-3.5 h-3.5 text-purple-400" />,
  STOCK_ADD: <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />,
  STOCK_REDUCE: <TrendingDown className="w-3.5 h-3.5 text-yellow-400" />,
  BUY: <ShoppingCart className="w-3.5 h-3.5 text-green-400" />,
  SELL: <DollarSign className="w-3.5 h-3.5 text-blue-400" />,
  LOGIN: <ScrollText className="w-3.5 h-3.5 text-blue-400" />,
  ENABLE: <Plus className="w-3.5 h-3.5 text-emerald-400" />,
  DISABLE: <Trash2 className="w-3.5 h-3.5 text-red-400" />,
  BULK_IMPORT: <Package className="w-3.5 h-3.5 text-purple-400" />,
};

const actionColors: Record<string, "green" | "blue" | "red" | "purple" | "yellow" | "gray"> = {
  CREATE: "green",
  UPDATE: "blue",
  DELETE: "red",
  RECOVER: "purple",
  STOCK_ADD: "green",
  STOCK_REDUCE: "yellow",
  BUY: "green",
  SELL: "blue",
  LOGIN: "blue",
  ENABLE: "green",
  DISABLE: "red",
  BULK_IMPORT: "purple",
};

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; log: ActivityLog | null }>({
    show: false,
    log: null,
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/logs?page=${page}&pageSize=${PAGE_SIZE}`);
      const result = await res.json();
      if (result.success) {
        setLogs(result.data);
        setTotalCount(result.total);
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
    setLoading(false);
  }, [page]);

  const handleDeleteLog = useCallback(async (log: ActivityLog) => {
    try {
      // Note: logs API doesn't have delete yet, just remove from local state
      setLogs((prev) => prev.filter((l) => l.id !== log.id));
      setTotalCount((prev) => prev - 1);
    } catch (err) {
      console.error("Error deleting log:", err);
    }
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteConfirm.log) {
      handleDeleteLog(deleteConfirm.log);
      setDeleteConfirm({ show: false, log: null });
    }
  }, [deleteConfirm.log, handleDeleteLog]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs, page]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  if (loading && logs.length === 0) {
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
        <p className="text-sm text-slate-400">Track all admin actions and system changes.</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e293b]">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Action
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Entity
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Details
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    No activity logs yet
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="table-row">
                    <td className="px-6 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={actionColors[log.action] || "gray"}>
                        <span className="flex items-center gap-1.5">
                          {actionIcons[log.action] || <ScrollText className="w-3.5 h-3.5" />}
                          {log.action}
                        </span>
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-300 capitalize">
                      {log.entity_type}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : "—"}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => setDeleteConfirm({ show: true, log })}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Delete log entry"
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
        onOpenChange={(open) => setDeleteConfirm({ show: open, log: null })}
        title="Delete Log Entry"
        description={
          deleteConfirm.log
            ? `Are you sure you want to delete this log entry? This action cannot be undone.`
            : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
