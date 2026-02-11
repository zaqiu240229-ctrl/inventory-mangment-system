import { NextRequest, NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo-data";

// POST login
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: "Username and password are required" },
      { status: 400 }
    );
  }

  // Demo mode - hardcoded credentials
  if (isDemoMode) {
    if (email === "admin" && password === "admin123") {
      const response = NextResponse.json({
        success: true,
        data: {
          user: {
            id: "demo-admin-1",
            username: "admin",
          },
        },
      });

      // Set HTTP-only cookie for middleware
      response.cookies.set("admin_authenticated", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });

      return response;
    } else {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }
  }

  // Neon DB authentication
  const admin = await authenticateAdmin(email, password);

  if (!admin) {
    return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({
    success: true,
    data: {
      user: {
        id: admin.id,
        username: admin.username,
      },
    },
  });

  // Set HTTP-only cookie for middleware
  response.cookies.set("admin_authenticated", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  return response;
}
