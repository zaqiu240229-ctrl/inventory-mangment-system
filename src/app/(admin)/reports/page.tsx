"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, DollarSign, ArrowLeft, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProfitReport {
  period: string;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  transactionCount: number;
  topProduct: {
    name: string;
    profit: number;
  };
}

interface ReportsData {
  daily: ProfitReport[];
  weekly: ProfitReport[];
  monthly: ProfitReport[];
  yearly: ProfitReport[];
  summary: {
    totalProfit: number;
    totalRevenue: number;
    totalCost: number;
    averageProfitMargin: number;
  };
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reports");
      const data = await response.json();
      if (data.success) {
        setReports(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-700 rounded w-48"></div>
          <div className="h-32 bg-slate-700 rounded"></div>
          <div className="h-96 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!reports) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <DollarSign className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">Failed to load profit data</p>
        </div>
      </div>
    );
  }

  const summary = reports.summary;

  // Calculate profits for specific periods based on selected date
  const selectedDateObj = selectedDate ? new Date(selectedDate + "T00:00:00") : new Date();
  const today = new Date();
  const isTodaySelected = selectedDate === today.toISOString().split("T")[0];

  // Find the matching report entry for each period based on selected date
  const findDailyProfit = (): number => {
    // Daily period key format: "YYYY-MM-DD"
    const match = reports.daily.find((r) => r.period === selectedDate);
    return match?.profit || 0;
  };

  const findWeeklyProfit = (): number => {
    // Weekly period key format: "February 2026 - Week 2"
    const year = selectedDateObj.getFullYear();
    const month = selectedDateObj.getMonth();
    const monthName = selectedDateObj.toLocaleString("en-US", { month: "long" });
    const firstDayOfMonth = new Date(year, month, 1);
    const dayOfMonth = selectedDateObj.getDate();
    const weekOfMonth = Math.ceil((dayOfMonth + firstDayOfMonth.getDay() - 1) / 7);
    const weekKey = `${monthName} ${year} - Week ${weekOfMonth}`;
    const match = reports.weekly.find((r) => r.period === weekKey);
    return match?.profit || 0;
  };

  const findMonthlyProfit = (): number => {
    // Monthly period key format: "February 2026"
    const monthName = selectedDateObj.toLocaleString("en-US", { month: "long" });
    const year = selectedDateObj.getFullYear();
    const monthKey = `${monthName} ${year}`;
    const match = reports.monthly.find((r) => r.period === monthKey);
    return match?.profit || 0;
  };

  const findYearlyProfit = (): number => {
    // Yearly period key format: "2026"
    const yearKey = selectedDateObj.getFullYear().toString();
    const match = reports.yearly.find((r) => r.period === yearKey);
    return match?.profit || 0;
  };

  // Create dynamic labels based on selected date, using correct period data
  const allProfits = [
    {
      label: isTodaySelected
        ? "Today"
        : selectedDateObj?.toLocaleDateString("en-US", { weekday: "long" }) || "Today",
      profit: findDailyProfit(),
      periodType: "daily" as const,
    },
    {
      label: isTodaySelected
        ? "This Week"
        : `Week of ${selectedDateObj?.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      profit: findWeeklyProfit(),
      periodType: "weekly" as const,
    },
    {
      label: isTodaySelected
        ? "This Month"
        : selectedDateObj?.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      profit: findMonthlyProfit(),
      periodType: "monthly" as const,
    },
    {
      label: isTodaySelected ? "This Year" : selectedDateObj?.getFullYear().toString(),
      profit: findYearlyProfit(),
      periodType: "yearly" as const,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">My Profits</h1>
            <p className="text-slate-400 mt-1">See how much money you're making</p>
            <div className="flex items-center gap-2 mt-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-500">
                {selectedDate
                  ? new Date(selectedDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "All Time"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <label className="text-sm text-slate-400">View reports for:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
                title="Reset to today"
              >
                Today
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Total Profit Card */}
      <div className="card p-6">
        <div className="text-center">
          <DollarSign className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-4xl font-bold text-white mb-2">Total Profit</h2>
          <p
            className={`text-5xl font-bold ${summary.totalProfit >= 0 ? "text-green-400" : "text-red-400"}`}
          >
            {summary.totalProfit >= 0 ? "+" : "-"}
            {formatCurrency(Math.abs(summary.totalProfit))}
          </p>
          <p className="text-slate-400 mt-2">
            {summary.totalProfit >= 0 ? "You're making money!" : "You're losing money"}
          </p>
        </div>
      </div>

      {/* Simple Profit List */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Profit by Time</h3>
        <div className="space-y-4">
          {allProfits.map((item, index) => {
            const periodData = selectedDateObj
              ? reports[item.periodType].find((report) => {
                  const reportDate = new Date(report.period);
                  switch (item.periodType) {
                    case "daily":
                      return reportDate.toDateString() === selectedDateObj.toDateString();
                    case "weekly":
                      // For weekly, check if the selected date falls within the week
                      return true; // Simplified for now
                    case "monthly":
                      return (
                        reportDate.getMonth() === selectedDateObj.getMonth() &&
                        reportDate.getFullYear() === selectedDateObj.getFullYear()
                      );
                    case "yearly":
                      return reportDate.getFullYear() === selectedDateObj.getFullYear();
                    default:
                      return false;
                  }
                })
              : null;
            const hasData = periodData && item.profit !== 0;

            return (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50"
              >
                <span className="text-white font-medium text-lg">{item.label}</span>
                <div className="flex items-center gap-2">
                  {item.profit > 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : item.profit < 0 ? (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  ) : null}
                  <span
                    className={`text-2xl font-bold ${item.profit >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {item.profit >= 0 ? "+" : "-"}
                    {formatCurrency(Math.abs(item.profit))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Information Panel */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          Report Date Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-slate-400">Selected Date</span>
            </div>
            <p className="text-white font-medium text-lg">
              {new Date(selectedDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-green-400" />
              <span className="text-sm text-slate-400">Current Date</span>
            </div>
            <p className="text-white font-medium text-lg">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-slate-400">Report Status</span>
            </div>
            <p className="text-green-400 font-medium text-lg">
              {selectedDate === new Date().toISOString().split("T")[0]
                ? "Live Data"
                : "Historical Data"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
