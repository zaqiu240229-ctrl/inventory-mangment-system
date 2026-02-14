import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/neon";

// GET single product
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = createClient();

    const data = await sql`
      SELECT
        p.id, p.name, p.model, p.category_id, p.buy_price, p.sell_price,
        p.created_at, p.updated_at, p.deleted_at,
        c.id as cat_id, c.name as cat_name, c.description as cat_desc, c.is_active as cat_active,
        s.id as stock_id, s.quantity, s.min_alert_quantity, s.updated_at as stock_updated
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN stocks s ON s.product_id = p.id
      WHERE p.id = ${parseInt(id)}
    `;

    if (data.length === 0) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const row = data[0];
    const product = {
      id: row.id,
      name: row.name,
      model: row.model,
      category_id: row.category_id,
      buy_price: parseFloat(row.buy_price || 0),
      sell_price: parseFloat(row.sell_price || 0),
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at,
      category: row.cat_id
        ? {
            id: row.cat_id,
            name: row.cat_name,
            description: row.cat_desc,
            is_active: row.cat_active,
          }
        : null,
      stock: row.stock_id
        ? [
            {
              id: row.stock_id,
              quantity: row.quantity,
              min_alert_quantity: row.min_alert_quantity,
              updated_at: row.stock_updated,
            },
          ]
        : [],
    };

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT update product
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = createClient();
    const body = await request.json();

    const { name, model, category_id, buy_price, sell_price } = body;

    // Build dynamic update
    const updates: string[] = [];
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) {
      updates.push(`name = '${name.trim()}'`);
      updateData.name = name.trim();
    }
    if (model !== undefined) {
      updates.push(`model = '${model.trim()}'`);
      updateData.model = model.trim();
    }
    if (category_id !== undefined) {
      updates.push(`category_id = ${category_id}`);
      updateData.category_id = category_id;
    }
    if (buy_price !== undefined) {
      updates.push(`buy_price = ${buy_price}`);
      updateData.buy_price = buy_price;
    }
    if (sell_price !== undefined) {
      updates.push(`sell_price = ${sell_price}`);
      updateData.sell_price = sell_price;
    }
    updates.push("updated_at = NOW()");

    const data = await sql`
      UPDATE products
      SET ${sql.unsafe(updates.join(", "))}
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;

    if (data.length === 0) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    await sql`
      INSERT INTO activity_logs (action, entity_type, entity_id, details, created_at)
      VALUES ('UPDATE', 'product', ${id}, ${JSON.stringify(updateData)}, NOW())
    `;

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE (soft delete or permanent delete) product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sql = createClient();

    // Check if permanent deletion is requested
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get("permanent") === "true";

    if (permanent) {
      // Permanent deletion - get product details first
      const productData = await sql`
        SELECT * FROM products WHERE id = ${parseInt(id)}
      `;

      if (productData.length === 0) {
        return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
      }

      // Delete related records first (foreign key constraints)
      await sql`DELETE FROM stocks WHERE product_id = ${parseInt(id)}`;

      // Delete transaction records (transactions table doesn't have CASCADE)
      await sql`DELETE FROM transactions WHERE product_id = ${parseInt(id)}`;

      // Delete the product permanently
      await sql`DELETE FROM products WHERE id = ${parseInt(id)}`;

      // Log the permanent deletion
      await sql`
        INSERT INTO activity_logs (action, entity_type, entity_id, details, created_at)
        VALUES ('PERMANENT_DELETE', 'product', ${id}, ${JSON.stringify({ name: productData[0].name })}, NOW())
      `;

      return NextResponse.json({ success: true, message: "Product permanently deleted" });
    } else {
      // Soft deletion
      const data = await sql`
        UPDATE products
        SET deleted_at = NOW()
        WHERE id = ${parseInt(id)}
        RETURNING *
      `;

      if (data.length === 0) {
        return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
      }

      await sql`
        INSERT INTO activity_logs (action, entity_type, entity_id, details, created_at)
        VALUES ('DELETE', 'product', ${id}, ${JSON.stringify({ name: data[0].name })}, NOW())
      `;

      return NextResponse.json({ success: true, data: data[0] });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
