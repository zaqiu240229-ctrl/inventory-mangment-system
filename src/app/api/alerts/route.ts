import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET stock alerts
export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stocks")
    .select("*, product:products(*, category:categories(*))")
    .order("quantity", { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  // Filter to low and out of stock items
  const alerts =
    data
      ?.filter((s) => {
        if (!s.product || s.product.deleted_at) return false;
        return s.quantity <= s.min_alert_quantity;
      })
      .map((s) => ({
        ...s,
        status: s.quantity <= 0 ? "out_of_stock" : "low_stock",
      })) || [];

  return NextResponse.json({
    success: true,
    data: alerts,
    summary: {
      outOfStock: alerts.filter((a) => a.status === "out_of_stock").length,
      lowStock: alerts.filter((a) => a.status === "low_stock").length,
      total: alerts.length,
    },
  });
}
