import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
      transactions = transactions.filter(t => t.type === type);
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(`${startDate}T00:00:00`);
      transactions = transactions.filter(t => new Date(t.created_at) >= start);
    }

    if (endDate) {
      const end = new Date(`${endDate}T23:59:59`);
      transactions = transactions.filter(t => new Date(t.created_at) <= end);
    }

    // Sort by created_at descending
    transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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

  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("transactions")
    .select("*, product:products(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (type && ["BUY", "SELL"].includes(type)) {
    query = query.eq("type", type);
  }

  if (startDate) {
    query = query.gte("created_at", `${startDate}T00:00:00`);
  }

  if (endDate) {
    query = query.lte("created_at", `${endDate}T23:59:59`);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  });
}
