import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode, demoDataStore } from "@/lib/demo-data";

// GET dashboard stats
export async function GET(_request: NextRequest) {
  // Demo mode - return demo data
  if (isDemoMode) {
    const products = demoDataStore.getProducts();
    const transactions = demoDataStore.getTransactions();
    const stocks = demoDataStore.getStocks();

    // Calculate stats
    const totalProducts = products.length;
    const totalStock = stocks.reduce((sum, s) => sum + s.quantity, 0);

    const buyTxns = transactions.filter(t => t.type === "BUY");
    const sellTxns = transactions.filter(t => t.type === "SELL");

    const totalBuyValue = buyTxns.reduce((sum, t) => {
      const totalIQD = t.currency === "USD" ? Number(t.total) * 1460 : Number(t.total);
      return sum + totalIQD;
    }, 0);
    const totalSellValue = sellTxns.reduce((sum, t) => {
      const totalIQD = t.currency === "USD" ? Number(t.total) * 1460 : Number(t.total);
      return sum + totalIQD;
    }, 0);

    // Recent transactions (last 5)
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    // Low stock alerts
    const lowStockAlerts = stocks
      .filter(s => {
        const product = products.find(p => p.id === s.product_id);
        return product && !product.deleted_at && s.quantity <= s.min_alert_quantity;
      })
      .map(s => {
        const product = products.find(p => p.id === s.product_id)!;
        return {
          product,
          stock: { quantity: s.quantity, min_alert_quantity: s.min_alert_quantity },
          status: s.quantity <= 0 ? "out_of_stock" : "low_stock",
        };
      })
      .sort((a, b) => a.stock.quantity - b.stock.quantity)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalProducts,
          totalStock,
          totalBuyValue,
          totalSellValue,
          totalProfit: totalSellValue - totalBuyValue,
        },
        lowStockAlerts,
        recentTransactions,
      },
    });
  }

  const supabase = await createClient();

  // Products count
  const { count: totalProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null);

  // Total stock
  const { data: stocks } = await supabase.from("stocks").select("quantity");
  const totalStock = stocks?.reduce((sum: number, s: { quantity: number }) => sum + s.quantity, 0) || 0;

  // Buy/Sell totals
  const { data: buyTxns } = await supabase
    .from("transactions")
    .select("total")
    .eq("type", "BUY");

  const { data: sellTxns } = await supabase
    .from("transactions")
    .select("total")
    .eq("type", "SELL");

  const totalBuyValue = buyTxns?.reduce((sum: number, t: { total: string | number }) => sum + Number(t.total), 0) || 0;
  const totalSellValue = sellTxns?.reduce((sum: number, t: { total: string | number }) => sum + Number(t.total), 0) || 0;

  // Recent transactions
  const { data: recentTransactions } = await supabase
    .from("transactions")
    .select("*, product:products(*)")
    .order("created_at", { ascending: false })
    .limit(5);

  // Low stock alerts
  const { data: lowStockData } = await supabase
    .from("stocks")
    .select("*, product:products(*)")
    .order("quantity", { ascending: true })
    .limit(10);

  const lowStockAlerts =
    lowStockData
      ?.filter((s: { product: any; quantity: number; min_alert_quantity: number }) =>
        s.product && !s.product.deleted_at && s.quantity <= s.min_alert_quantity
      )
      .map((s: { product: any; quantity: number; min_alert_quantity: number }) => ({
        product: s.product,
        stock: { quantity: s.quantity, min_alert_quantity: s.min_alert_quantity },
        status: s.quantity <= 0 ? "out_of_stock" : "low_stock",
      })) || [];

  return NextResponse.json({
    success: true,
    data: {
      stats: {
        totalProducts: totalProducts || 0,
        totalStock,
        totalBuyValue,
        totalSellValue,
        totalProfit: totalSellValue - totalBuyValue,
      },
      lowStockAlerts,
      recentTransactions: recentTransactions || [],
    },
  });
}
