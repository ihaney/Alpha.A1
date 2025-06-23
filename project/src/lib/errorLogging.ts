import { supabase } from './supabase';

export interface ErrorLog {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let retries = 0;
  let lastError: Error | null = null;
  
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retries++;
      
      // Only wait if we're going to retry
      if (retries < maxRetries) {
        const delay = baseDelay * Math.pow(2, retries - 1) * (0.5 + Math.random());
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If we've exhausted all retries, throw the last error
  throw lastError;
}

export async function logError(error: Error, context?: Record<string, any>, severity: ErrorLog['severity'] = 'error') {
  // Ensure error message is a string
  const errorMessage = error?.message || String(error);
  
  // Safely serialize context
  let serializedContext = null;
  try {
    serializedContext = context ? JSON.stringify(context) : null;
  } catch (e) {
    console.warn('Failed to serialize error context:', e);
    serializedContext = JSON.stringify({ warning: 'Context serialization failed', error: String(e) });
  }

  const errorLog: ErrorLog = {
    message: errorMessage,
    stack: error.stack,
    context: context,
    timestamp: new Date().toISOString(),
    severity,
    userId: (await supabase.auth.getUser())?.data?.user?.id,
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('Error logged:', errorLog);
  }

  try {
    // Try direct database insert with serialized context
    await retryWithBackoff(async () => {
      const { error: insertError } = await supabase
        .from('error_logs')
        .insert([{
          message: errorLog.message,
          stack: errorLog.stack,
          context: serializedContext ? JSON.parse(serializedContext) : null,
          user_id: errorLog.userId,
          timestamp: errorLog.timestamp,
          severity: errorLog.severity
        }]);

      if (insertError) {
        throw insertError;
      }
    });
  } catch (loggingError) {
    // If all retries fail, log to console but don't throw
    console.error('Error during error logging:', loggingError);
  }
}