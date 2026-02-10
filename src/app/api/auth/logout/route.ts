import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo-data";

// POST logout
export async function POST() {
  // Demo mode - clear cookie
  if (isDemoMode) {
    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    response.cookies.set('admin_authenticated', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    return response;
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.json({ success: true, message: "Logged out successfully" });
}
