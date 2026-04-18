import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let limiter: Ratelimit | null = null;

const redisUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

if (redisUrl && redisToken) {
  limiter = new Ratelimit({
    redis: new Redis({ url: redisUrl, token: redisToken }),
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    prefix: "ktimahub:signup",
  });
}

export async function checkRateLimit(key: string): Promise<{ allowed: boolean }> {
  if (!limiter) return { allowed: true };
  const { success } = await limiter.limit(key);
  return { allowed: success };
}
