import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/neon";

// DELETE transaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sql = createClient();

    // First, get the transaction to log it
    const txnResult = await sql`SELECT * FROM transactions WHERE id = ${parseInt(id)}`;
    if (txnResult.length === 0) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
    }
    const transaction = txnResult[0];

    // Delete the transaction
    await sql`DELETE FROM transactions WHERE id = ${parseInt(id)}`;

    // Log the deletion
    await sql`
      INSERT INTO activity_logs (action, entity_type, entity_id, details, created_at)
      VALUES ('DELETE', 'transaction', ${id}, ${JSON.stringify(transaction)}, NOW())
    `;

    return NextResponse.json({ success: true, message: "Transaction deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
