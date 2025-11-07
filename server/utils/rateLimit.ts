// Rate limiting utility for security
// Uses in-memory store for simplicity (use Redis in production)

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries every 10 minutes
if (process.server) {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }, 10 * 60 * 1000)
}

export interface RateLimitConfig {
  maxAttempts: number // Maximum number of attempts
  windowMs: number // Time window in milliseconds
  identifier: string // Unique identifier (IP, email, etc.)
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

/**
 * Check if request should be rate limited
 * @param config Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  const { maxAttempts, windowMs, identifier } = config
  
  const key = `rate_limit:${identifier}`
  const now = Date.now()
  
  let entry = rateLimitStore.get(key)
  
  // If entry doesn't exist or has expired, create new entry
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(key, entry)
  }
  
  // Increment count
  entry.count++
  
  const allowed = entry.count <= maxAttempts
  const remaining = Math.max(0, maxAttempts - entry.count)
  
  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  }
}

/**
 * Get client IP from event
 */
export function getClientIP(event: any): string {
  const headers = event.headers || {}
  
  // Check various headers for IP (in order of preference)
  const forwarded = headers['x-forwarded-for']
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = headers['x-real-ip']
  if (realIP) {
    return realIP
  }
  
  const remoteAddress = event.node?.req?.socket?.remoteAddress
  if (remoteAddress) {
    return remoteAddress
  }
  
  return 'unknown'
}







