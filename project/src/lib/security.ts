import { RateLimiterMemory } from 'rate-limiter-flexible';
import xss from 'xss';

// Rate limiter for API calls
export const apiRateLimiter = new RateLimiterMemory({
  points: 100, // Number of points
  duration: 60, // Per 60 seconds
});

// Sanitize user input
export function sanitizeInput(input: string): string {
  return xss(input.trim());
}

// Validate and sanitize search query
export function sanitizeSearchQuery(query: string): string {
  const sanitized = sanitizeInput(query);
  // Remove potential SQL injection characters
  return sanitized.replace(/[;'"\\]/g, '');
}

// CSRF token generation
export function generateCSRFToken(): string {
  return crypto.randomUUID();
}

// Session timeout (30 minutes)
export const SESSION_TIMEOUT = 30 * 60 * 1000;

// Password requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireNumbers: true,
  requireSpecialChars: true,
  requireUppercase: true,
  requireLowercase: true
};

export function validatePassword(password: string): boolean {
  return (
    password.length >= PASSWORD_REQUIREMENTS.minLength &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password)
  );
}