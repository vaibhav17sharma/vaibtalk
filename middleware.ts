import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  const isAuth = !!token;
  const isProfileComplete = token?.profileCompleted;
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith("/api/auth") || pathname === "/signin" || pathname === "/signup";
  const isPublicRoute = pathname === "/" || pathname === "/signin" || pathname === "/signup";
  const isApiRoute = pathname.startsWith("/api/");

  if (!isAuth && !isAuthRoute && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }  

  if (isAuth && !isProfileComplete && !isApiRoute && pathname !== "/profile") {
    const url = request.nextUrl.clone();
    url.pathname = "/profile";
    return NextResponse.redirect(url);
  }
  

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|images|favicon.ico|static).*)"],
};
