import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/neon";

// GET single category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sql = createClient();

  const data = await sql`SELECT * FROM categories WHERE id = ${id}`;

  if (data.length === 0) {
    return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: data[0] });
}

// PUT update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sql = createClient();
  const body = await request.json();

  const { name, description, is_active } = body;

  const updateData: any = {};
  if (name !== undefined) updateData.name = name.trim();
  if (description !== undefined) updateData.description = description?.trim() || null;
  if (is_active !== undefined) updateData.is_active = is_active;

  // Build dynamic UPDATE query
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 2; // Start at 2 because $1 will be id

  if (updateData.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(updateData.name);
  }
  if (updateData.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(updateData.description);
  }
  if (updateData.is_active !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    values.push(updateData.is_active);
  }

  if (updates.length === 0) {
    return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
  }

  const data = await sql`
    UPDATE categories 
    SET ${sql(updates.join(', '))}
    WHERE id = ${id}
    RETURNING *
  `;

  if (data.length === 0) {
    return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
  }

  await sql`
    INSERT INTO activity_logs (action, entity_type, entity_id, details)
    VALUES ('UPDATE', 'category', ${id}, ${JSON.stringify(updateData)})
  `;

  return NextResponse.json({ success: true, data: data[0] });
}

// DELETE category (disable)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sql = createClient();

  const data = await sql`
    UPDATE categories 
    SET is_active = false
    WHERE id = ${id}
    RETURNING *
  `;

  if (data.length === 0) {
    return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
  }

  await sql`
    INSERT INTO activity_logs (action, entity_type, entity_id, details)
    VALUES ('DELETE', 'category', ${id}, ${JSON.stringify({ name: data[0].name })})
  `;

  return NextResponse.json({ success: true, data: data[0] });
}

  return NextResponse.json({ success: true, data });
}
