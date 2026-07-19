import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  
  // Use getToken directly to avoid importing full NextAuth, Prisma, and bcrypt 
  // into the Vercel Edge runtime, which exceeds the 1MB free tier limit.
  // The token contains all custom claims (role, status) added by the API route.
  const token = await getToken({ 
    req, 
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production" || nextUrl.protocol === "https:",
    salt: process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token",
  });
  
  const isLoggedIn = !!token;
  const isAuthPage = nextUrl.pathname.startsWith("/login");

  // Allow auth pages without session
  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/boards", nextUrl));
    }
    return NextResponse.next();
  }

  // Return 401 for API routes, redirect unauthenticated users to login for pages
  if (!isLoggedIn) {
    if (nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check suspended users
  if (token?.status === "suspended") {
    return NextResponse.redirect(new URL("/login?error=suspended", nextUrl));
  }

  // Super admin only routes
  if (nextUrl.pathname.startsWith("/admin") && token?.role !== "super_admin") {
    return NextResponse.redirect(new URL("/boards", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (Next.js assets)
     * - _next/image (image optimization)
     * - favicon.ico, favicon.svg, icon.svg (browser icons)
     * - public folder
     * - API auth routes (handled by NextAuth)
     */
    "/((?!_next/static|_next/image|favicon.ico|favicon.svg|icon.svg|uploads|api/auth|api/mobile/login|mobile-auth).*)",
  ],
};
