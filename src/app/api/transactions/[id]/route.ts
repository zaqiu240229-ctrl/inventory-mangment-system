import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DELETE transaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // First, get the transaction to log it
  const { data: transaction, error: fetchError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) {
    return NextResponse.json({ success: false, error: fetchError.message }, { status: 404 });
  }

  // Delete the transaction
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  // Log the deletion
  await supabase.from("activity_logs").insert({
    action: "DELETE",
    entity_type: "transaction",
    entity_id: id,
    details: transaction,
  });

  return NextResponse.json({ success: true, message: "Transaction deleted successfully" });
}