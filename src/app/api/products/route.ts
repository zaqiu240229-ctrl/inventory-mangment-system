import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET products with pagination and search
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("category_id") || "";
  const includeDeleted = searchParams.get("deleted") === "true";

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("products")
    .select("*, category:categories(*), stock:stocks(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (!includeDeleted) {
    query = query.is("deleted_at", null);
  } else {
    query = query.not("deleted_at", "is", null);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,model.ilike.%${search}%`);
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId);
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

// POST new product
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  const { name, model, category_id, buy_price, sell_price, currency } = body;

  if (!name || !model || !category_id) {
    return NextResponse.json(
      { success: false, error: "Name, model, and category are required" },
      { status: 400 }
    );
  }

  // Create product
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      name: name.trim(),
      model: model.trim(),
      category_id,
      buy_price: buy_price || 0,
      sell_price: sell_price || 0,
      currency: currency || "IQD",
    })
    .select()
    .single();

  if (productError) {
    return NextResponse.json({ success: false, error: productError.message }, { status: 500 });
  }

  // Auto-create stock entry
  await supabase.from("stocks").insert({
    product_id: product.id,
    quantity: 0,
    min_alert_quantity: 5,
  });

  // Log activity
  await supabase.from("activity_logs").insert({
    action: "CREATE",
    entity_type: "product",
    entity_id: product.id,
    details: { name: product.name, model: product.model },
  });

  return NextResponse.json({ success: true, data: product }, { status: 201 });
}
