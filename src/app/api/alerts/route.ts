import { NextResponse } from "next/server";
import { createClient } from "@/lib/neon";

// GET stock alerts
export async function GET() {
  try {
    const sql = createClient();

    const data = await sql`
      SELECT 
        s.id, s.product_id, s.quantity, s.min_alert_quantity, s.updated_at,
        p.id as prod_id, p.name as prod_name, p.model as prod_model,
        p.buy_price, p.sell_price, p.category_id,
        c.id as cat_id, c.name as cat_name, c.description as cat_desc, c.is_active as cat_active
      FROM stocks s
      JOIN products p ON s.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.deleted_at IS NULL AND s.quantity <= s.min_alert_quantity
      ORDER BY s.quantity ASC
    `;

    const alerts = data.map((row: any) => ({
      id: row.id,
      product_id: row.product_id,
      quantity: row.quantity,
      min_alert_quantity: row.min_alert_quantity,
      updated_at: row.updated_at,
      product: {
        id: row.prod_id,
        name: row.prod_name,
        model: row.prod_model,
        buy_price: parseFloat(row.buy_price),
        sell_price: parseFloat(row.sell_price),
        category_id: row.category_id,
        category: row.cat_id
          ? {
              id: row.cat_id,
              name: row.cat_name,
              description: row.cat_desc,
              is_active: row.cat_active,
            }
          : null,
      },
      status: row.quantity <= 0 ? "out_of_stock" : "low_stock",
    }));

    return NextResponse.json({
      success: true,
      data: alerts,
      summary: {
        outOfStock: alerts.filter((a: any) => a.status === "out_of_stock").length,
        lowStock: alerts.filter((a: any) => a.status === "low_stock").length,
        total: alerts.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
