import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Simple in-memory store for development (when Redis not configured)
class MemoryStore {
  private store = new Map<string, { count: number; resetAt: number }>();

  async limit(key: string, limit: number, window: number) {
    const now = Date.now();
    const existing = this.store.get(key);

    if (existing && existing.resetAt > now) {
      if (existing.count >= limit) {
        return {
          success: false,
          limit,
          remaining: 0,
          reset: existing.resetAt,
        };
      }
      existing.count++;
      return {
        success: true,
        limit,
        remaining: limit - existing.count,
        reset: existing.resetAt,
      };
    }

    // New window
    const resetAt = now + window;
    this.store.set(key, { count: 1, resetAt });

    // Clean up old entries
    for (const [k, v] of this.store.entries()) {
      if (v.resetAt <= now) {
        this.store.delete(k);
      }
    }

    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: resetAt,
    };
  }
}

const memoryStore = new MemoryStore();

// Create rate limiter with proper fallback
const createRateLimiter = () => {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    // Production: Use Upstash Redis
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
      analytics: true,
    });
  }

  // Development: Return mock ratelimiter using in-memory store
  return {
    limit: async (key: string) => {
      return memoryStore.limit(key, 10, 60000); // 10 requests per 60 seconds
    },
  };
};

export const ratelimit = createRateLimiter();

export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (works with proxies like Cloudflare)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0].trim() || 'unknown';
  return ip;
}
