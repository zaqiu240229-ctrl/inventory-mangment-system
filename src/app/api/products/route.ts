import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/neon";

// GET products with pagination and search
export async function GET(request: NextRequest) {
  try {
    const sql = createClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("category_id") || "";
    const includeDeleted = searchParams.get("deleted") === "true";

    const offset = (page - 1) * pageSize;

    // Build WHERE conditions
    const conditions: string[] = [];
    if (!includeDeleted) {
      conditions.push("p.deleted_at IS NULL");
    } else {
      conditions.push("p.deleted_at IS NOT NULL");
    }
    if (search) {
      conditions.push(`(p.name ILIKE '%${search}%' OR p.model ILIKE '%${search}%')`);
    }
    if (categoryId) {
      conditions.push(`p.category_id = ${categoryId}`);
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as count FROM products p
      ${whereClause ? sql.unsafe(whereClause) : sql``}
    `;
    const total = parseInt(countResult[0].count);

    // Get paginated products with category and stock
    const data = await sql`
      SELECT
        p.id, p.name, p.model, p.category_id, p.buy_price, p.sell_price,
        p.created_at, p.updated_at, p.deleted_at,
        c.id as cat_id, c.name as cat_name, c.description as cat_desc, c.is_active as cat_active,
        s.id as stock_id, s.quantity, s.min_alert_quantity, s.updated_at as stock_updated
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN stocks s ON s.product_id = p.id
      ${whereClause ? sql.unsafe(whereClause) : sql``}
      ORDER BY p.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    // Transform to nested structure
    const transformed = data.map((row: any) => ({
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
    }));

    return NextResponse.json({
      success: true,
      data: transformed,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST new product
export async function POST(request: NextRequest) {
  try {
    const sql = createClient();
    const body = await request.json();

    const { name, model, category_id, buy_price, sell_price } = body;

    if (!name || !model || !category_id) {
      return NextResponse.json(
        { success: false, error: "Name, model, and category are required" },
        { status: 400 }
      );
    }

    // Create product
    const productResult = await sql`
      INSERT INTO products (name, model, category_id, buy_price, sell_price, created_at, updated_at)
      VALUES (${name.trim()}, ${model.trim()}, ${category_id}, ${buy_price || 0}, ${sell_price || 0}, NOW(), NOW())
      RETURNING *
    `;
    const product = productResult[0];

    // Auto-create stock entry
    await sql`
      INSERT INTO stocks (product_id, quantity, min_alert_quantity, updated_at)
      VALUES (${product.id}, 0, 5, NOW())
    `;

    // Log activity
    await sql`
      INSERT INTO activity_logs (action, entity_type, entity_id, details, created_at)
      VALUES ('CREATE', 'product', ${product.id.toString()}, ${JSON.stringify({ name: product.name, model: product.model })}, NOW())
    `;

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
