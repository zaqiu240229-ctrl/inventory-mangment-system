import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/neon";

// GET single stock record
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = createClient();

    const data = await sql`
      SELECT 
        s.id, s.product_id, s.quantity, s.min_alert_quantity, s.updated_at,
        p.id as prod_id, p.name, p.model, p.buy_price, p.sell_price, p.category_id
      FROM stocks s
      LEFT JOIN products p ON s.product_id = p.id
      WHERE s.product_id = ${parseInt(id)}
    `;

    if (data.length === 0) {
      return NextResponse.json({ success: false, error: "Stock not found" }, { status: 404 });
    }

    const row = data[0];
    const result = {
      id: row.id,
      product_id: row.product_id,
      quantity: row.quantity,
      min_alert_quantity: row.min_alert_quantity,
      updated_at: row.updated_at,
      product: row.prod_id
        ? {
            id: row.prod_id,
            name: row.name,
            model: row.model,
            buy_price: parseFloat(row.buy_price || 0),
            sell_price: parseFloat(row.sell_price || 0),
            category_id: row.category_id,
          }
        : null,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT update stock alert level
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = createClient();
    const body = await request.json();

    const { min_alert_quantity } = body;

    const data = await sql`
      UPDATE stocks
      SET min_alert_quantity = ${min_alert_quantity}, updated_at = NOW()
      WHERE product_id = ${parseInt(id)}
      RETURNING *
    `;

    if (data.length === 0) {
      return NextResponse.json({ success: false, error: "Stock not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
