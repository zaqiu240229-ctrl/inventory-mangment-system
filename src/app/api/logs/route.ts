import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/neon";

// GET activity logs with pagination
export async function GET(request: NextRequest) {
  try {
    const sql = createClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const offset = (page - 1) * pageSize;

    const countResult = await sql`SELECT COUNT(*) as count FROM activity_logs`;
    const total = parseInt(countResult[0].count);

    const data = await sql`
      SELECT * FROM activity_logs
      ORDER BY created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    return NextResponse.json({
      success: true,
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
