import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redisUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

type Window = `${number} ${"ms" | "s" | "m" | "h" | "d"}`;

function makeLimiter(prefix: string, requests: number, window: Window): Ratelimit | null {
  if (!redisUrl || !redisToken) return null;
  return new Ratelimit({
    redis: new Redis({ url: redisUrl, token: redisToken }),
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `ktimahub:${prefix}`,
  });
}

const limiters = {
  signup: makeLimiter("signup", 5, "1 h"),
  login: makeLimiter("login", 10, "15 m"),
  verifyEmail: makeLimiter("verify-email", 10, "1 h"),
  invite: makeLimiter("invite", 20, "1 h"),
} as const;

export type RateLimitScope = keyof typeof limiters;

export async function checkRateLimit(
  scope: RateLimitScope,
  key: string
): Promise<{ allowed: boolean }> {
  const limiter = limiters[scope];
  if (!limiter) return { allowed: true };
  const { success } = await limiter.limit(key);
  return { allowed: success };
}
