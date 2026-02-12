import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/neon";

// POST recover a soft-deleted product
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = createClient();

    const data = await sql`
      UPDATE products
      SET deleted_at = NULL
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;

    if (data.length === 0) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    await sql`
      INSERT INTO activity_logs (action, entity_type, entity_id, details, created_at)
      VALUES ('RECOVER', 'product', ${id}, ${JSON.stringify({ name: data[0].name })}, NOW())
    `;

    return NextResponse.json({
      success: true,
      data: data[0],
      message: "Product recovered successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
