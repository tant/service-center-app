/**
 * Rate Limiting Middleware
 *
 * Protects public endpoints from abuse by limiting request frequency
 * Implements sliding window rate limiting with IP-based tracking
 */

import { type NextRequest, NextResponse } from "next/server";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (consider Redis for production)
const rateLimitStore: RateLimitStore = {};

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  publicEndpoints: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 requests per hour per IP
  },
  // Add more endpoint-specific configs as needed
};

/**
 * Get client IP from request
 */
function getClientIP(request: NextRequest): string {
  // Check X-Forwarded-For header (common in proxies/load balancers)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  // Check X-Real-IP header
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Next.js 15+ provides request.ip
  // @ts-expect-error - ip property exists in Next.js 15+ runtime but may not be in types yet
  return request.ip || "unknown";
}

/**
 * Check if request should be rate limited
 */
function checkRateLimit(
  clientIP: string,
  windowMs: number,
  maxRequests: number,
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `rate_limit:${clientIP}`;

  // Get or initialize rate limit entry
  let entry = rateLimitStore[key];

  // Reset if window has expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
    rateLimitStore[key] = entry;
  }

  // Increment request count
  entry.count++;

  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limiting middleware for public service request endpoint
 */
export function rateLimitPublicEndpoint(request: NextRequest) {
  const clientIP = getClientIP(request);
  const { windowMs, maxRequests } = RATE_LIMIT_CONFIG.publicEndpoints;

  const { allowed, remaining, resetTime } = checkRateLimit(
    clientIP,
    windowMs,
    maxRequests,
  );

  if (!allowed) {
    // Rate limit exceeded
    const resetDate = new Date(resetTime);
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000); // seconds

    return NextResponse.json(
      {
        error: "Too Many Requests",
        message: `Vượt quá giới hạn. Tối đa ${maxRequests} yêu cầu mỗi giờ mỗi IP.`,
        retryAfter: resetDate.toISOString(),
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": resetDate.toISOString(),
          "Retry-After": retryAfter.toString(),
        },
      },
    );
  }

  // Request allowed - add rate limit headers to response
  return NextResponse.next({
    headers: {
      "X-RateLimit-Limit": maxRequests.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": new Date(resetTime).toISOString(),
    },
  });
}

/**
 * Cleanup expired entries (call periodically to prevent memory leaks)
 */
export function cleanupExpiredEntries() {
  const now = Date.now();
  const keys = Object.keys(rateLimitStore);

  for (const key of keys) {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  }
}

// Run cleanup every 10 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredEntries, 10 * 60 * 1000);
}
