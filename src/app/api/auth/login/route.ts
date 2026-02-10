import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo-data";

// POST login
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: "Email and password are required" },
      { status: 400 }
    );
  }

  // Demo mode - hardcoded credentials
  if (isDemoMode) {
    if (email === 'admin' && password === 'admin123') {
      const response = NextResponse.json({
        success: true,
        data: {
          user: {
            id: 'demo-admin-1',
            email: 'admin',
          },
          session: {
            access_token: 'demo-token',
            refresh_token: 'demo-refresh-token',
          },
        },
      });

      // Set HTTP-only cookie for middleware
      response.cookies.set('admin_authenticated', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });

      return response;
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    data: {
      user: data.user,
      session: data.session,
    },
  });
}
