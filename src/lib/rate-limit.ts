import { createServiceClient } from "./supabase/server";

interface RateLimitConfig {
  windowMs: number; // window size in milliseconds
  maxRequests: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  "/api/news": { windowMs: 60 * 1000, maxRequests: 30 },
  "/api/digest": { windowMs: 60 * 60 * 1000, maxRequests: 10 },
  "/api/tts": { windowMs: 24 * 60 * 60 * 1000, maxRequests: 5 },
  "/api/saved": { windowMs: 60 * 1000, maxRequests: 60 },
  "/api/interactions": { windowMs: 60 * 1000, maxRequests: 60 },
};

export async function checkRateLimit(
  userId: string | null,
  route: string,
  ipHash?: string
): Promise<{ allowed: boolean; remaining: number }> {
  const config = RATE_LIMITS[route] || { windowMs: 60 * 1000, maxRequests: 30 };
  const supabase = await createServiceClient();

  const windowStart = new Date(Date.now() - config.windowMs).toISOString();

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
    return { allowed: true, remaining: config.maxRequests };
  }

  const { data } = await query;

  const totalCount = data?.reduce((sum, row) => sum + (row.count || 0), 0) || 0;

  if (totalCount >= config.maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  // Record this request
  await supabase.from("api_usage").insert({
    user_id: userId,
    ip_hash: ipHash || null,
    route,
    count: 1,
    window_start: new Date().toISOString(),
  });

  return { allowed: true, remaining: config.maxRequests - totalCount - 1 };
}
