import { NextResponse } from "next/server";
import { createClient, initializeDatabase } from "@/lib/neon";
import { isDemoMode } from "@/lib/demo-data";

interface TableRow {
  table_name: string;
}

// Database connection test endpoint
export async function GET() {
  try {
    if (isDemoMode) {
      return NextResponse.json({
        success: true,
        mode: "demo",
        message: "Demo mode active - No database connection required",
        instruction: "Set NEON_DATABASE_URL in .env.local to enable database mode",
      });
    }

    // Test Neon connection
    const sql = createClient();

    // Simple query to test connection
    const result = await sql`SELECT NOW() as current_time, version() as db_version`;

    // Try to initialize database if not already done
    await initializeDatabase();

    // Check tables exist
    const tables = (await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `) as unknown as TableRow[];

    // Test each table (count check disabled due to dynamic SQL limitations)
    const tableTests = [];
    const tableNames = [
      "admins",
      "categories",
      "products",
      "stocks",
      "transactions",
      "activity_logs",
    ];

    for (const tableName of tableNames) {
      const found = tables.some((t) => t.table_name === tableName);
      tableTests.push({
        table: tableName,
        exists: found,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Neon database connected successfully!",
        mode: "database",
        connection: {
          timestamp: result[0].current_time,
          version: result[0].db_version,
        },
        tables: tables.map((t: TableRow) => t.table_name),
        tableTests,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Database test error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Database connection error",
        error: errorMessage,
        mode: "error",
        details: "Check your NEON_DATABASE_URL in .env.local",
      },
      { status: 500 }
    );
  }
}
