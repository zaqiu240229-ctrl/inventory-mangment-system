import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Simple auth check for Neon DB version
  const isLoginPage = request.nextUrl.pathname.startsWith("/login");
  const isApiAuth = request.nextUrl.pathname.startsWith("/api/auth");
  const isPublicApi = request.nextUrl.pathname.startsWith("/api/");

  // Allow login page and auth API
  if (isLoginPage || isApiAuth) {
    return NextResponse.next();
  }

  // Check authentication cookie for protected routes
  const isAuthenticated = request.cookies.get("admin_authenticated")?.value === "true";

  // Redirect to login if not authenticated and trying to access admin pages
  if (!isAuthenticated && !isPublicApi) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
