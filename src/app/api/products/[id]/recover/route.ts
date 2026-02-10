import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST recover a soft-deleted product
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .update({ deleted_at: null })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  await supabase.from("activity_logs").insert({
    action: "RECOVER",
    entity_type: "product",
    entity_id: id,
    details: { name: data.name },
  });

  return NextResponse.json({ success: true, data, message: "Product recovered successfully" });
}
