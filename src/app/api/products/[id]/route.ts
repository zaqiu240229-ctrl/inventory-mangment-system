import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*), stock:stocks(*)")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}

// PUT update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();

  const { name, model, category_id, buy_price, sell_price, currency } = body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name.trim();
  if (model !== undefined) updateData.model = model.trim();
  if (category_id !== undefined) updateData.category_id = category_id;
  if (buy_price !== undefined) updateData.buy_price = buy_price;
  if (sell_price !== undefined) updateData.sell_price = sell_price;
  if (currency !== undefined) updateData.currency = currency;

  const { data, error } = await supabase
    .from("products")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  await supabase.from("activity_logs").insert({
    action: "UPDATE",
    entity_type: "product",
    entity_id: id,
    details: updateData,
  });

  return NextResponse.json({ success: true, data });
}

// DELETE (soft delete) product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  await supabase.from("activity_logs").insert({
    action: "DELETE",
    entity_type: "product",
    entity_id: id,
    details: { name: data.name },
  });

  return NextResponse.json({ success: true, data });
}
