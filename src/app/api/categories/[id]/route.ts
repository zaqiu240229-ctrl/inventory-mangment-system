import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/neon";

// GET single category
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = createClient();

  const data = await sql`SELECT * FROM categories WHERE id = ${id}`;

  if (data.length === 0) {
    return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: data[0] });
}

// PUT update category
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = createClient();
  const body = await request.json();

  const { name, description, is_active } = body;

  // Build update - only update provided fields
  let data;
  if (name !== undefined && description !== undefined && is_active !== undefined) {
    data = await sql`
      UPDATE categories SET name = ${name.trim()}, description = ${description?.trim() || null}, is_active = ${is_active}, updated_at = NOW()
      WHERE id = ${id} RETURNING *
    `;
  } else if (name !== undefined && description !== undefined) {
    data = await sql`
      UPDATE categories SET name = ${name.trim()}, description = ${description?.trim() || null}, updated_at = NOW()
      WHERE id = ${id} RETURNING *
    `;
  } else if (name !== undefined && is_active !== undefined) {
    data = await sql`
      UPDATE categories SET name = ${name.trim()}, is_active = ${is_active}, updated_at = NOW()
      WHERE id = ${id} RETURNING *
    `;
  } else if (description !== undefined && is_active !== undefined) {
    data = await sql`
      UPDATE categories SET description = ${description?.trim() || null}, is_active = ${is_active}, updated_at = NOW()
      WHERE id = ${id} RETURNING *
    `;
  } else if (name !== undefined) {
    data = await sql`
      UPDATE categories SET name = ${name.trim()}, updated_at = NOW()
      WHERE id = ${id} RETURNING *
    `;
  } else if (description !== undefined) {
    data = await sql`
      UPDATE categories SET description = ${description?.trim() || null}, updated_at = NOW()
      WHERE id = ${id} RETURNING *
    `;
  } else if (is_active !== undefined) {
    data = await sql`
      UPDATE categories SET is_active = ${is_active}, updated_at = NOW()
      WHERE id = ${id} RETURNING *
    `;
  } else {
    return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
  }

  if (data.length === 0) {
    return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
  }

  await sql`
    INSERT INTO activity_logs (action, entity_type, entity_id, details)
    VALUES ('UPDATE', 'category', ${id}, ${JSON.stringify({ name, description, is_active })})
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
