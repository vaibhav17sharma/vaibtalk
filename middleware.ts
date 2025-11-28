import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  const isAuth = !!token;
  const isProfileComplete = token?.profileCompleted;
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith("/api/auth") || pathname === "/signin" || pathname === "/signup" || pathname === "/auth/signup";
  const isPublicRoute = pathname === "/" || pathname === "/signin" || pathname === "/signup" || pathname === "/auth/signup" || pathname.startsWith("/invite/");
  
  // Public API routes that don't require authentication
  const publicApiRoutes = [
    "/api/auth",
    "/api/invite/validate",
  ];
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route));

  // Allow public API routes to pass through without auth checks
  if (isPublicApiRoute) {
    return NextResponse.next();
  }

  if (!isAuth && !isAuthRoute && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }  

  if (isAuth && !isProfileComplete && pathname !== "/profile" && !pathname.startsWith("/api/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/profile";
    return NextResponse.redirect(url);
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
     * - socket.io (websocket requests)
     * - public files (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|socket.io|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp|.*\\.ico).*)",
  ],
};
