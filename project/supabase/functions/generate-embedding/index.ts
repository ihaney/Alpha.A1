import { createClient } from 'npm:@supabase/supabase-js@2.39.7'
import OpenAI from 'npm:openai@4.28.0'
import { z } from 'npm:zod@3.22.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'https://paisan.net',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

// Input validation schema
const RequestSchema = z.object({
  text: z.string().min(1).max(8000),
});

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

// Initialize Supabase client
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      persistSession: false,
    }
  }
);

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Parse and validate request body
    const body = await req.json();
    const { text } = RequestSchema.parse(body);

    // Generate embedding
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    // Log successful request
    await supabaseAdmin
      .from('error_logs')
      .insert({
        message: 'Embedding generated successfully',
        user_id: user.id,
        severity: 'info',
        context: { text_length: text.length }
      });

    return new Response(
      JSON.stringify({ embedding: response.data[0].embedding }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    // Log error
    await supabaseAdmin
      .from('error_logs')
      .insert({
        message: error.message,
        stack: error.stack,
        severity: 'error',
        context: { path: '/generate-embedding' }
      });

    const status = error instanceof z.ZodError ? 400 : 
                   error.message === 'Invalid authentication' ? 401 :
                   error.message === 'Method not allowed' ? 405 : 500;

    return new Response(
      JSON.stringify({ 
        error: status === 500 ? 'Internal server error' : error.message
      }),
      { 
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});