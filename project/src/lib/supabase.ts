import { createClient } from '@supabase/supabase-js';
import { logError } from './errorLogging';
import { apiRateLimiter } from './security';

// Validate environment variables
const validateEnvVars = () => {
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate URL format
  try {
    new URL(import.meta.env.VITE_SUPABASE_URL);
  } catch {
    throw new Error('Invalid SUPABASE_URL format');
  }
};

validateEnvVars();

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public'
    }
  }
);

// Enhanced error handling
supabase.handleError = async (error: any) => {
  console.error('Supabase error:', error);
  await logError(
    error instanceof Error ? error : new Error(error?.message || 'Unknown Supabase error'),
    { source: 'supabase' }
  );
};

// Rate limited fetch wrapper
const originalFetch = supabase.rest.headers.fetch;
supabase.rest.headers.fetch = async (...args) => {
  try {
    // Extract hostname for rate limiting to avoid header construction issues
    const url = args[0] instanceof URL ? args[0] : new URL(args[0].toString());
    await apiRateLimiter.consume(url.hostname);
    
    const response = await originalFetch.apply(supabase.rest.headers, args);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
    if (error.name === 'RateLimiterError') {
      throw new Error('Too many requests. Please try again later.');
    }
    throw error;
  }
};