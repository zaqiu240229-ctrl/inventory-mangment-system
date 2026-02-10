import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET single category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.from("categories").select("*").eq("id", id).single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}

// PUT update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();

  const { name, description, is_active } = body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name.trim();
  if (description !== undefined) updateData.description = description?.trim() || null;
  if (is_active !== undefined) updateData.is_active = is_active;

  const { data, error } = await supabase
    .from("categories")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  await supabase.from("activity_logs").insert({
    action: "UPDATE",
    entity_type: "category",
    entity_id: id,
    details: updateData,
  });

  return NextResponse.json({ success: true, data });
}

// DELETE category (disable)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .update({ is_active: false })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  await supabase.from("activity_logs").insert({
    action: "DELETE",
    entity_type: "category",
    entity_id: id,
    details: { name: data.name },
  });

  return NextResponse.json({ success: true, data });
}
