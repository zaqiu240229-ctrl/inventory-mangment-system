import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/neon";
import { isDemoMode } from "@/lib/demo-data";

const DEMO_CATEGORIES = [
  {
    id: "1",
    name: "Screens",
    description: "LCD, OLED, and touch screen panels",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Batteries",
    description: "Mobile phone batteries and power cells",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "3",
    name: "Chargers",
    description: "Charging cables, adapters, and wireless chargers",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "4",
    name: "Speakers",
    description: "Phone speakers and audio components",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "5",
    name: "Cameras",
    description: "Camera modules, front and rear",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "6",
    name: "IC / Chips",
    description: "Integrated circuits and chipsets",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "7",
    name: "Other Parts",
    description: "Miscellaneous mobile phone parts",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

// GET all categories
export async function GET() {
  if (isDemoMode) {
    return NextResponse.json({ success: true, data: DEMO_CATEGORIES });
  }

  try {
    const sql = createClient();
    const data = await sql`
      SELECT * FROM categories 
      ORDER BY created_at ASC
    `;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST new category
export async function POST(request: NextRequest) {
  if (isDemoMode) {
    return NextResponse.json(
      { success: false, error: "Demo mode - Database operations not available" },
      { status: 400 }
    );
  }

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
