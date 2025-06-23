const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // Maximum requests per window

const requestCounts = new Map<string, { count: number; timestamp: number }>();

export function rateLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Clean up old entries
  for (const [key, value] of requestCounts.entries()) {
    if (value.timestamp < windowStart) {
      requestCounts.delete(key);
    }
  }
  
  // Get or create record for this IP
  const record = requestCounts.get(ip) || { count: 0, timestamp: now };
  
  // Reset if outside window
  if (record.timestamp < windowStart) {
    record.count = 0;
    record.timestamp = now;
  }
  
  // Increment count
  record.count++;
  requestCounts.set(ip, record);
  
  // Check if over limit
  return record.count <= MAX_REQUESTS;
}