import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET all stock records
export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stocks")
    .select("*, product:products(*, category:categories(*))")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  // Filter out deleted products
  const filtered = data?.filter((s: any) => s.product && !s.product.deleted_at) || [];

  return NextResponse.json({ success: true, data: filtered });
}

// POST update stock (add or reduce)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  const { product_id, quantity, type, price } = body;

  if (!product_id || !quantity || !type) {
    return NextResponse.json(
      { success: false, error: "product_id, quantity, and type are required" },
      { status: 400 }
    );
  }

  if (!["BUY", "SELL"].includes(type)) {
    return NextResponse.json(
      { success: false, error: "Type must be BUY or SELL" },
      { status: 400 }
    );
  }

  // Get current stock
  const { data: currentStock } = await supabase
    .from("stocks")
    .select("*")
    .eq("product_id", product_id)
    .single();

  if (!currentStock && type === "SELL") {
    return NextResponse.json(
      { success: false, error: "No stock record found for this product" },
      { status: 400 }
    );
  }

  let newQty: number;
  if (!currentStock) {
    // Create new stock entry
    newQty = quantity;
    await supabase.from("stocks").insert({
      product_id,
      quantity: newQty,
      min_alert_quantity: 5,
    });
  } else {
    newQty =
      type === "BUY"
        ? currentStock.quantity + quantity
        : currentStock.quantity - quantity;

    if (newQty < 0) {
      return NextResponse.json(
        { success: false, error: "Insufficient stock" },
        { status: 400 }
      );
    }

    await supabase
      .from("stocks")
      .update({ quantity: newQty })
      .eq("id", currentStock.id);
  }

  // Get product info for price fallback
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", product_id)
    .single();

  const unitPrice =
    price > 0
      ? price
      : type === "BUY"
      ? product?.buy_price || 0
      : product?.sell_price || 0;

  // Create transaction
  const { data: transaction, error: txnError } = await supabase
    .from("transactions")
    .insert({
      product_id,
      type,
      quantity,
      price: unitPrice,
      total: unitPrice * quantity,
      currency: product?.currency || "IQD",
    })
    .select()
    .single();

  if (txnError) {
    return NextResponse.json({ success: false, error: txnError.message }, { status: 500 });
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    action: type === "BUY" ? "STOCK_ADD" : "STOCK_REDUCE",
    entity_type: "stock",
    entity_id: product_id,
    details: {
      product_name: product?.name,
      quantity,
      new_quantity: newQty,
      type,
    },
  });

  return NextResponse.json({
    success: true,
    data: { stock: { quantity: newQty }, transaction },
  });
}
