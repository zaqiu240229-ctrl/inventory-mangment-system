import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/neon";
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

    const buyTxns = transactions.filter((t) => t.type === "BUY");
    const sellTxns = transactions.filter((t) => t.type === "SELL");

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
      .filter((s) => {
        const product = products.find((p) => p.id === s.product_id);
        return product && !product.deleted_at && s.quantity <= s.min_alert_quantity;
      })
      .map((s) => {
        const product = products.find((p) => p.id === s.product_id)!;
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

  try {
    const sql = createClient();

    // Products count
    const countResult = await sql`SELECT COUNT(*) as count FROM products WHERE deleted_at IS NULL`;
    const totalProducts = parseInt(countResult[0].count);

    // Total stock
    const stocksResult = await sql`SELECT COALESCE(SUM(quantity), 0) as total FROM stocks`;
    const totalStock = parseInt(stocksResult[0].total);

    // Buy/Sell totals
    const buyResult =
      await sql`SELECT COALESCE(SUM(total), 0) as total FROM transactions WHERE type = 'BUY'`;
    const sellResult =
      await sql`SELECT COALESCE(SUM(total), 0) as total FROM transactions WHERE type = 'SELL'`;
    const totalBuyValue = parseFloat(buyResult[0].total);
    const totalSellValue = parseFloat(sellResult[0].total);

    // Recent transactions
    const recentTxns = await sql`
      SELECT t.*, p.name as product_name, p.model as product_model,
             p.buy_price as product_buy_price, p.sell_price as product_sell_price
      FROM transactions t
      LEFT JOIN products p ON t.product_id = p.id
      ORDER BY t.created_at DESC
      LIMIT 5
    `;
    const recentTransactions = recentTxns.map((t: any) => ({
      ...t,
      price: parseFloat(t.price),
      total: parseFloat(t.total),
      product: t.product_name
        ? {
            id: t.product_id,
            name: t.product_name,
            model: t.product_model,
            buy_price: parseFloat(t.product_buy_price),
            sell_price: parseFloat(t.product_sell_price),
          }
        : null,
    }));

    // Low stock alerts
    const lowStockData = await sql`
      SELECT s.quantity, s.min_alert_quantity,
             p.id as prod_id, p.name, p.model, p.buy_price, p.sell_price, p.deleted_at
      FROM stocks s
      JOIN products p ON s.product_id = p.id
      WHERE p.deleted_at IS NULL AND s.quantity <= s.min_alert_quantity
      ORDER BY s.quantity ASC
      LIMIT 10
    `;
    const lowStockAlerts = lowStockData.map((s: any) => ({
      product: {
        id: s.prod_id,
        name: s.name,
        model: s.model,
        buy_price: parseFloat(s.buy_price),
        sell_price: parseFloat(s.sell_price),
      },
      stock: { quantity: s.quantity, min_alert_quantity: s.min_alert_quantity },
      status: s.quantity <= 0 ? "out_of_stock" : "low_stock",
    }));

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
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
