import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let limiter: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  limiter = new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    prefix: "ktimahub:signup",
  });
}

export async function checkRateLimit(key: string): Promise<{ allowed: boolean }> {
  if (!limiter) return { allowed: true };
  const { success } = await limiter.limit(key);
  return { allowed: success };
}
