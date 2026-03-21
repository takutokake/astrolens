import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * SECURITY: Security headers middleware (OPTIONAL - RECOMMENDED FOR PRODUCTION)
 * 
 * To enable, rename this file to `middleware.ts` and update your existing middleware
 * to include these security headers.
 * 
 * OWASP Security Headers:
 * - Content-Security-Policy: Prevents XSS attacks
 * - X-Content-Type-Options: Prevents MIME sniffing
 * - X-Frame-Options: Prevents clickjacking
 * - X-XSS-Protection: Legacy XSS protection
 * - Referrer-Policy: Controls referrer information
 * - Permissions-Policy: Restricts browser features
 * - Strict-Transport-Security: Enforces HTTPS
 */

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // SECURITY: Content Security Policy (adjust for your needs)
  // This is a strict policy - you may need to relax it based on your requirements
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval/inline
    "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
    "img-src 'self' data: https: blob:", // Allow images from any HTTPS source
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://api.openai.com https://texttospeech.googleapis.com https://newsdata.io",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  // SECURITY: Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // SECURITY: Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // SECURITY: Enable XSS filter (legacy, but still useful)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // SECURITY: Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // SECURITY: Restrict browser features
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // SECURITY: Enforce HTTPS (only in production)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // SECURITY: Rate limit headers (if rate limiting is active)
  // These are set by individual endpoints, but you can add global limits here

  return response;
}

// SECURITY: Apply middleware to all routes except static files
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
