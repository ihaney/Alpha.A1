// Simple in-memory rate limiting
const rateLimits = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // Maximum requests per minute

export function rateLimit(clientIP: string): boolean {
  const now = Date.now();
  const timestamps = rateLimits.get(clientIP) || [];
  
  // Remove timestamps outside the current window
  const validTimestamps = timestamps.filter(
    timestamp => now - timestamp < RATE_LIMIT_WINDOW
  );
  
  if (validTimestamps.length >= MAX_REQUESTS) {
    return false;
  }
  
  validTimestamps.push(now);
  rateLimits.set(clientIP, validTimestamps);
  return true;
}