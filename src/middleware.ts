import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Keep in sync with SESSION_COOKIE in src/lib/auth.ts (this file runs on the Edge runtime).
const SESSION_COOKIE = "school4you_session";

/**
 * Redirects visitors without a valid session to /login before any page renders, so signed-out
 * users never see an empty workspace shell. API routes still enforce their own checks.
 */
export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET;
  if (token && secret && secret.length >= 32) {
    try {
      await jwtVerify(token, new TextEncoder().encode(secret));
      return NextResponse.next();
    } catch {
      // fall through to the redirect below
    }
  }
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|login|register|terms|privacy|forgot-password|reset-password|verify-email).*)"],
};
