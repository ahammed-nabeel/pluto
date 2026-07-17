import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const isAuthPage = nextUrl.pathname.startsWith("/login");

  // Allow auth pages without session
  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/boards", nextUrl));
    }
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check suspended users
  if (session?.user?.status === "suspended") {
    return NextResponse.redirect(new URL("/login?error=suspended", nextUrl));
  }

  // Super admin only routes
  if (nextUrl.pathname.startsWith("/admin") && session?.user?.role !== "super_admin") {
    return NextResponse.redirect(new URL("/boards", nextUrl));
  }

  return NextResponse.next();
});

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
    "/((?!_next/static|_next/image|favicon.ico|favicon.svg|icon.svg|uploads|api/auth).*)",
  ],
};
