import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/neon";

// GET all categories
export async function GET() {
  try {
    const sql = createClient();
    const data = await sql`
      SELECT * FROM categories
      WHERE is_active = true
      ORDER BY created_at ASC
    `;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST new category
export async function POST(request: NextRequest) {
  try {
    const sql = createClient();
    const body = await request.json();

    const { name, description } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Category name is required (min 2 chars)" },
        { status: 400 }
      );
    }

    const data = await sql`
      INSERT INTO categories (name, description)
      VALUES (${name.trim()}, ${description?.trim() || null})
      RETURNING *
    `;

    const newCategory = data[0];

    // Log activity
    await sql`
      INSERT INTO activity_logs (action, entity_type, entity_id, details)
      VALUES ('CREATE', 'category', ${newCategory.id}, ${JSON.stringify({ name: newCategory.name })})
    `;

    return NextResponse.json({ success: true, data: newCategory }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
