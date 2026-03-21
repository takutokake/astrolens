import { createServiceClient } from "./supabase/server";
import { createHash } from "crypto";

/**
 * SECURITY: Rate limiting configuration following OWASP best practices
 * - Prevents brute force attacks
 * - Mitigates DoS/DDoS attempts
 * - Protects against resource exhaustion
 */

interface RateLimitConfig {
  windowMs: number; // window size in milliseconds
  maxRequests: number;
  ipMaxRequests?: number; // separate limit for IP-based (unauthenticated) requests
}

// SECURITY: Conservative rate limits to prevent abuse
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  "/api/news": { windowMs: 60 * 1000, maxRequests: 30, ipMaxRequests: 10 },
  "/api/digest": { windowMs: 60 * 60 * 1000, maxRequests: 10, ipMaxRequests: 3 },
  "/api/tts": { windowMs: 24 * 60 * 60 * 1000, maxRequests: 5, ipMaxRequests: 2 },
  "/api/saved": { windowMs: 60 * 1000, maxRequests: 60, ipMaxRequests: 20 },
  "/api/interactions": { windowMs: 60 * 1000, maxRequests: 60, ipMaxRequests: 20 },
  "/api/user": { windowMs: 60 * 1000, maxRequests: 30, ipMaxRequests: 10 },
  "/api/generate-radio-script": { windowMs: 60 * 60 * 1000, maxRequests: 10, ipMaxRequests: 2 },
  "/api/force-refresh": { windowMs: 60 * 60 * 1000, maxRequests: 5, ipMaxRequests: 1 },
  "/api/cron/fetch-news": { windowMs: 60 * 60 * 1000, maxRequests: 100, ipMaxRequests: 1 }, // Cron only
};

/**
 * SECURITY: Hash IP address using SHA-256 to prevent PII storage
 * Complies with GDPR/privacy regulations
 */
export function hashIP(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

/**
 * SECURITY: Extract client IP from request headers
 * Handles various proxy/CDN configurations (Vercel, Cloudflare, etc.)
 */
export function getClientIP(request: Request): string | null {
  const headers = request.headers;
  
  // Check common proxy headers in order of preference
  const ip = 
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("cf-connecting-ip") || // Cloudflare
    headers.get("x-vercel-forwarded-for") || // Vercel
    null;
  
  return ip;
}

/**
 * SECURITY: Enhanced rate limiting with IP + user-based tracking
 * Returns 429 Too Many Requests when limit exceeded
 */
export async function checkRateLimit(
  userId: string | null,
  route: string,
  ipHash?: string
): Promise<{ allowed: boolean; remaining: number; resetAt?: Date }> {
  const config = RATE_LIMITS[route] || { windowMs: 60 * 1000, maxRequests: 30, ipMaxRequests: 10 };
  const supabase = await createServiceClient();

  const windowStart = new Date(Date.now() - config.windowMs).toISOString();
  const resetAt = new Date(Date.now() + config.windowMs);

  // SECURITY: Use stricter limits for unauthenticated (IP-only) requests
  const maxAllowed = userId ? config.maxRequests : (config.ipMaxRequests || config.maxRequests);

  // Query existing usage in the current window
  let query = supabase
    .from("api_usage")
    .select("count")
    .eq("route", route)
    .gte("window_start", windowStart);

  if (userId) {
    query = query.eq("user_id", userId);
  } else if (ipHash) {
    query = query.eq("ip_hash", ipHash);
  } else {
    // SECURITY: No identifier provided - deny by default
    return { allowed: false, remaining: 0, resetAt };
  }

  const { data } = await query;

  const totalCount = data?.reduce((sum, row) => sum + (row.count || 0), 0) || 0;

  if (totalCount >= maxAllowed) {
    return { allowed: false, remaining: 0, resetAt };
  }

  // Record this request
  await supabase.from("api_usage").insert({
    user_id: userId,
    ip_hash: ipHash || null,
    route,
    count: 1,
    window_start: new Date().toISOString(),
  });

  return { 
    allowed: true, 
    remaining: maxAllowed - totalCount - 1,
    resetAt 
  };
}
