import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/neon";
import { demoDataStore, isDemoMode } from "@/lib/demo-data";

// GET transactions with pagination
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");
  const type = searchParams.get("type");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (isDemoMode) {
    let transactions = demoDataStore.getTransactions();

    // Filter by type
    if (type && ["BUY", "SELL"].includes(type)) {
      transactions = transactions.filter((t) => t.type === type);
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(`${startDate}T00:00:00`);
      transactions = transactions.filter((t) => new Date(t.created_at) >= start);
    }

    if (endDate) {
      const end = new Date(`${endDate}T23:59:59`);
      transactions = transactions.filter((t) => new Date(t.created_at) <= end);
    }

    // Sort by created_at descending
    transactions.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    const paginatedTransactions = transactions.slice(from, to);

    return NextResponse.json({
      success: true,
      data: paginatedTransactions,
      total: transactions.length,
      page,
      pageSize,
      totalPages: Math.ceil(transactions.length / pageSize),
    });
  }

  try {
    const sql = createClient();
    const from = (page - 1) * pageSize;

    // Build WHERE conditions
    let whereConditions = [];
    let params: any = {};

    if (type && ["BUY", "SELL"].includes(type)) {
      whereConditions.push(`t.type = '${type}'`);
    }

    if (startDate) {
      whereConditions.push(`t.created_at >= '${startDate}T00:00:00'`);
    }

    if (endDate) {
      whereConditions.push(`t.created_at <= '${endDate}T23:59:59'`);
    }

    const whereClause = whereConditions.length > 0 ? "WHERE " + whereConditions.join(" AND ") : "";

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as count 
      FROM transactions t
      ${whereClause ? sql.unsafe(whereClause) : sql``}
    `;
    const total = parseInt(countResult[0].count);

    // Get paginated data with product details
    const data = await sql`
      SELECT 
        t.id,
        t.product_id,
        t.type,
        t.quantity,
        t.price,
        t.total,
        t.created_at,
        p.id as product_id,
        p.name as product_name,
        p.model as product_model,
        p.buy_price as product_buy_price,
        p.sell_price as product_sell_price
      FROM transactions t
      LEFT JOIN products p ON t.product_id = p.id
      ${whereClause ? sql.unsafe(whereClause) : sql``}
      ORDER BY t.created_at DESC
      LIMIT ${pageSize} OFFSET ${from}
    `;

    // Transform flat result into nested structure
    const transformed = data.map((row: any) => ({
      id: row.id,
      product_id: row.product_id,
      type: row.type,
      quantity: row.quantity,
      price: parseFloat(row.price),
      total: parseFloat(row.total),
      created_at: row.created_at,
      product: row.product_name
        ? {
            id: row.product_id,
            name: row.product_name,
            model: row.product_model,
            buy_price: parseFloat(row.product_buy_price),
            sell_price: parseFloat(row.product_sell_price),
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: transformed,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
