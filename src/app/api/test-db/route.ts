import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Database connection test endpoint
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Test database connection by counting categories
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name")
      .limit(5);

    if (categoriesError) {
      return NextResponse.json({
        success: false,
        message: "Database connection failed",
        error: categoriesError.message,
        mode: "database"
      }, { status: 500 });
    }

    // Test all table existence
    const tables = ["categories", "products", "stocks", "transactions", "activity_logs"];
    const tableTests = [];

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select("id")
        .limit(1);
      
      tableTests.push({
        table,
        exists: !error,
        error: error?.message || null
      });
    }

    return NextResponse.json({
      success: true,
      message: "Database connection successful!",
      mode: "database",
      data: {
        categoriesCount: categories?.length || 0,
        categories: categories || [],
        tableTests
      }
    }, { status: 200 });

  } catch (error: any) {
    // Check if we're in demo mode (no valid Supabase config)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isDemoMode = !url || url === "your_supabase_project_url";

    if (isDemoMode) {
      return NextResponse.json({
        success: true,
        message: "Running in demo mode - database not configured",
        mode: "demo",
        instruction: "Set up your Supabase project and update .env.local to enable database mode"
      }, { status: 200 });
    }

    return NextResponse.json({
      success: false,
      message: "Database connection error",
      error: error.message,
      mode: "error"
    }, { status: 500 });
  }
}