import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /admin routes and /api/admin routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production",
    });

    const isApiRoute = pathname.startsWith("/api/admin");

    // If not authenticated or not an admin
    if (!token || token.role !== "ADMIN") {
      if (isApiRoute) {
        return NextResponse.json(
          { error: "دسترسی غیرمجاز. فقط مدیر سیستم مجاز به دسترسی است." },
          { status: 403 }
        );
      }

      // If user is logged in as a regular user, redirect to homepage
      if (token && token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
      }

      // If not logged in at all, redirect to login page with return URL
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
