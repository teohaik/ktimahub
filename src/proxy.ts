import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);
const intlMiddleware = createMiddleware(routing);

const publicPaths = ["/login", "/api/auth"];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function stripLocale(pathname: string): string {
  const locales = routing.locales as readonly string[];
  for (const locale of locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1) || "/";
    }
  }
  return pathname;
}

export default auth(function middleware(
  req: NextRequest & { auth?: { user?: unknown } | null }
) {
  const { pathname } = req.nextUrl;
  const basePath = stripLocale(pathname);

  // API routes and Next.js internals must pass through untouched
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return;
  }

  // Public locale-aware paths (e.g. /login, /el/login) pass through intl only
  if (isPublicPath(basePath)) {
    return intlMiddleware(req);
  }

  if (!req.auth?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
