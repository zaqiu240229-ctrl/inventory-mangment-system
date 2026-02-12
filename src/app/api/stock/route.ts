import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/neon";

// GET all stock records
export async function GET() {
  try {
    const sql = createClient();

    const data = await sql`
      SELECT 
        s.id,
        s.product_id,
        s.quantity,
        s.min_alert_quantity,
        s.updated_at,
        p.id as product_id,
        p.name as product_name,
        p.model as product_model,
        p.buy_price as product_buy_price,
        p.sell_price as product_sell_price,
        p.created_at as product_created_at,
        p.updated_at as product_updated_at,
        c.id as category_id,
        c.name as category_name,
        c.description as category_description,
        c.is_active as category_is_active
      FROM stocks s
      JOIN products p ON s.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.deleted_at IS NULL
      ORDER BY s.updated_at DESC
    `;

    // Transform flat result into nested structure
    const transformed = data.map((row: any) => ({
      id: row.id,
      product_id: row.product_id,
      quantity: row.quantity,
      min_alert_quantity: row.min_alert_quantity,
      updated_at: row.updated_at,
      product: {
        id: row.product_id,
        name: row.product_name,
        model: row.product_model,
        buy_price: parseFloat(row.product_buy_price),
        sell_price: parseFloat(row.product_sell_price),
        created_at: row.product_created_at,
        updated_at: row.product_updated_at,
        category: row.category_id
          ? {
              id: row.category_id,
              name: row.category_name,
              description: row.category_description,
              is_active: row.category_is_active,
            }
          : null,
      },
    }));

    return NextResponse.json({ success: true, data: transformed });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST update stock (add or reduce)
export async function POST(request: NextRequest) {
  try {
    const sql = createClient();
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
    const currentStockResult = await sql`
      SELECT * FROM stocks WHERE product_id = ${product_id}
    `;
    const currentStock = currentStockResult[0];

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
      await sql`
        INSERT INTO stocks (product_id, quantity, min_alert_quantity)
        VALUES (${product_id}, ${newQty}, 5)
      `;
    } else {
      newQty = type === "BUY" ? currentStock.quantity + quantity : currentStock.quantity - quantity;

      if (newQty < 0) {
        return NextResponse.json({ success: false, error: "Insufficient stock" }, { status: 400 });
      }

      await sql`
        UPDATE stocks 
        SET quantity = ${newQty}, updated_at = NOW()
        WHERE id = ${currentStock.id}
      `;
    }

    // Get product info for price fallback
    const productResult = await sql`
      SELECT * FROM products WHERE id = ${product_id}
    `;
    const product = productResult[0];

    const unitPrice =
      price > 0
        ? price
        : type === "BUY"
          ? parseFloat(product?.buy_price || 0)
          : parseFloat(product?.sell_price || 0);

    // Create transaction
    const transactionResult = await sql`
      INSERT INTO transactions (product_id, type, quantity, price, total, created_at)
      VALUES (${product_id}, ${type}, ${quantity}, ${unitPrice}, ${unitPrice * quantity}, NOW())
      RETURNING *
    `;
    const transaction = transactionResult[0];

    // Log activity
    await sql`
      INSERT INTO activity_logs (action, entity_type, entity_id, details, created_at)
      VALUES (
        ${type === "BUY" ? "STOCK_ADD" : "STOCK_REDUCE"},
        'stock',
        ${product_id.toString()},
        ${JSON.stringify({
          product_name: product?.name,
          quantity,
          new_quantity: newQty,
          type,
        })},
        NOW()
      )
    `;

    return NextResponse.json({
      success: true,
      data: { stock: { quantity: newQty }, transaction },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
