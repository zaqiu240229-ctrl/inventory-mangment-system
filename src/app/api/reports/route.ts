import { NextRequest, NextResponse } from "next/server";
import { isDemoMode, demoDataStore } from "@/lib/demo-data";
import { createClient } from "@/lib/neon";

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

// GET reports data
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // Demo mode - return demo data
  if (isDemoMode) {
    let transactions = demoDataStore.getTransactions();
    const products = demoDataStore.getProducts();

    // Filter transactions by date range if specified
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date

      transactions = transactions.filter((txn) => {
        const txnDate = new Date(txn.created_at);
        // Compare dates by year, month, day to avoid timezone issues
        const txnYear = txnDate.getFullYear();
        const txnMonth = txnDate.getMonth();
        const txnDay = txnDate.getDate();

        const startYear = start.getFullYear();
        const startMonth = start.getMonth();
        const startDay = start.getDate();

        const endYear = end.getFullYear();
        const endMonth = end.getMonth();
        const endDay = end.getDate();

        const txnDateOnly = new Date(txnYear, txnMonth, txnDay);
        const startDateOnly = new Date(startYear, startMonth, startDay);
        const endDateOnly = new Date(endYear, endMonth, endDay);

        return txnDateOnly >= startDateOnly && txnDateOnly <= endDateOnly;
      });
    }

    // Calculate all reports from filtered transactions
    const allDailyReports = calculateDailyReports(transactions, products);
    const allWeeklyReports = calculateWeeklyReports(transactions, products);
    const allMonthlyReports = calculateMonthlyReports(transactions, products);
    const allYearlyReports = calculateYearlyReports(transactions, products);

    // Calculate reports for different time periods
    const reports: ReportsData = {
      daily: allDailyReports,
      weekly: allWeeklyReports,
      monthly: allMonthlyReports,
      yearly: allYearlyReports,
      summary: calculateSummary(transactions, products), // Summary from filtered transactions
    };

    return NextResponse.json({
      success: true,
      data: reports,
    });
  }

  // For production mode, query from Neon database
  try {
    const client = createClient();

    // Fetch all transactions (date filtering is done on the frontend per period)
    const transactionsResult = await client`
      SELECT 
        id,
        product_id,
        type,
        quantity,
        created_at
      FROM transactions
      ORDER BY created_at DESC
    `;

    // Fetch all products
    const productsResult = await client`
      SELECT 
        id,
        name,
        buy_price,
        sell_price
      FROM products
      WHERE deleted_at IS NULL
    `;

    const transactions = transactionsResult;
    const products = productsResult;

    // Calculate reports using existing helper functions
    const daily = calculateDailyReports(transactions, products);
    const weekly = calculateWeeklyReports(transactions, products);
    const monthly = calculateMonthlyReports(transactions, products);
    const yearly = calculateYearlyReports(transactions, products);
    const summary = calculateSummary(transactions, products);

    return NextResponse.json({
      success: true,
      data: {
        summary,
        daily,
        weekly,
        monthly,
        yearly,
      },
    });
  } catch (error) {
    console.error("Error fetching reports from database:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate reports",
      },
      { status: 500 }
    );
  }
}

function calculateDailyReports(transactions: any[], products: any[]): ProfitReport[] {
  const dailyData: { [key: string]: any[] } = {};

  // Group transactions by day
  transactions.forEach((txn) => {
    const date = new Date(txn.created_at);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayKey = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

    if (!dailyData[dayKey]) {
      dailyData[dayKey] = [];
    }
    dailyData[dayKey].push(txn);
  });

  return Object.entries(dailyData)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 30) // Last 30 days
    .map(([period, txns]) => calculatePeriodReport(period, txns, products));
}

function calculateWeeklyReports(transactions: any[], products: any[]): ProfitReport[] {
  const weeklyData: { [key: string]: any[] } = {};

  // Group transactions by week of month
  transactions.forEach((txn) => {
    const date = new Date(txn.created_at);
    const year = date.getFullYear();
    const month = date.getMonth();

    // Calculate which week of the month (1-5)
    const firstDayOfMonth = new Date(year, month, 1);
    const dayOfMonth = date.getDate();
    const weekOfMonth = Math.ceil((dayOfMonth + firstDayOfMonth.getDay() - 1) / 7);

    const monthName = date.toLocaleString("en-US", { month: "long" });
    const weekKey = `${monthName} ${year} - Week ${weekOfMonth}`;

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = [];
    }
    weeklyData[weekKey].push(txn);
  });

  return Object.entries(weeklyData)
    .sort(([a], [b]) => {
      // Sort by date, most recent first
      const dateA = new Date(a.split(" - ")[0]);
      const dateB = new Date(b.split(" - ")[0]);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 12) // Last 12 weeks
    .map(([period, txns]) => calculatePeriodReport(period, txns, products));
}

function calculateMonthlyReports(transactions: any[], products: any[]): ProfitReport[] {
  const monthlyData: { [key: string]: any[] } = {};

  // Group transactions by month
  transactions.forEach((txn) => {
    const date = new Date(txn.created_at);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const monthKey = `${year}-${month.toString().padStart(2, "0")}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = [];
    }
    monthlyData[monthKey].push(txn);
  });

  return Object.entries(monthlyData)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 12) // Last 12 months
    .map(([period, txns]) => {
      const [year, month] = period.split("-");
      const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString("en-US", {
        month: "long",
      });
      return calculatePeriodReport(`${monthName} ${year}`, txns, products);
    });
}

function calculateYearlyReports(transactions: any[], products: any[]): ProfitReport[] {
  const yearlyData: { [key: string]: any[] } = {};

  // Group transactions by year
  transactions.forEach((txn) => {
    const date = new Date(txn.created_at);
    const year = date.getFullYear().toString();

    if (!yearlyData[year]) {
      yearlyData[year] = [];
    }
    yearlyData[year].push(txn);
  });

  return Object.entries(yearlyData)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 5) // Last 5 years
    .map(([period, txns]) => calculatePeriodReport(period, txns, products));
}

function calculatePeriodReport(period: string, transactions: any[], products: any[]): ProfitReport {
  let totalRevenue = 0;
  let totalCost = 0;
  const productProfits: { [key: string]: number } = {};

  transactions.forEach((txn) => {
    const product = products.find((p: any) => p.id === txn.product_id);
    if (!product) return;

    // Convert prices to IQD if needed (assuming all prices are already in IQD for simplicity)
    const sellPrice = product.sell_price;
    const buyPrice = product.buy_price;

    if (txn.type === "SELL") {
      // Revenue from sale: use sell_price * quantity
      totalRevenue += sellPrice * txn.quantity;
      // Cost of goods sold: use buy_price * quantity
      totalCost += buyPrice * txn.quantity;

      // Track product profits
      const profit = txn.quantity * (sellPrice - buyPrice);
      productProfits[product.name] = (productProfits[product.name] || 0) + profit;
    }
    // BUY transactions don't affect profit calculation - they just increase inventory
  });

  const profit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  // Find top product
  const topProduct = Object.entries(productProfits).sort(([, a], [, b]) => b - a)[0] || [
    "No sales",
    0,
  ];

  return {
    period,
    totalRevenue,
    totalCost,
    profit,
    profitMargin,
    transactionCount: transactions.length,
    topProduct: {
      name: topProduct[0],
      profit: topProduct[1],
    },
  };
}

function calculateSummary(transactions: any[], products: any[]): ReportsData["summary"] {
  let totalRevenue = 0;
  let totalCost = 0;

  transactions.forEach((txn) => {
    const product = products.find((p: any) => p.id === txn.product_id);
    if (!product) return;

    // Convert prices to IQD if needed (assuming all prices are already in IQD for simplicity)
    const sellPrice = product.sell_price;
    const buyPrice = product.buy_price;

    if (txn.type === "SELL") {
      totalRevenue += sellPrice * txn.quantity;
      totalCost += buyPrice * txn.quantity;
    }
    // BUY transactions don't affect profit calculation
  });

  const totalProfit = totalRevenue - totalCost;
  const averageProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return {
    totalProfit,
    totalRevenue,
    totalCost,
    averageProfitMargin,
  };
}
