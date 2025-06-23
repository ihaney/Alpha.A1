import { createClient } from 'npm:@supabase/supabase-js@2.39.7'
import { MeiliSearch } from 'npm:meilisearch@0.37.0'
import { z } from 'npm:zod@3.22.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'https://paisan.net',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Input validation schema
const PayloadSchema = z.object({
  type: z.enum(['INSERT', 'UPDATE', 'DELETE']),
  record: z.object({
    Product_ID: z.string(),
    Product_Title: z.string(),
    Product_Price: z.string().optional(),
    Product_Image_URL: z.string().optional(),
    Product_Title_URL: z.string().optional(),
    Product_MOQ: z.string().optional(),
    Product_Country_ID: z.string().optional(),
    Product_Category_ID: z.string().optional(),
    Product_Supplier_ID: z.string().optional(),
    Product_Source_ID: z.string().optional(),
  }).optional(),
  old_record: z.object({
    Product_ID: z.string()
  }).optional(),
});

const searchClient = new MeiliSearch({
  host: Deno.env.get('VITE_MEILISEARCH_HOST')!,
  apiKey: Deno.env.get('MEILISEARCH_ADMIN_API_KEY')!
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  {
    auth: {
      persistSession: false
    }
  }
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Parse and validate payload
    const payload = await req.json();
    const { type, record, old_record } = PayloadSchema.parse(payload);

    const productsIndex = searchClient.index('products');

    switch (type) {
      case 'INSERT': {
        if (!record) throw new Error('Record required for INSERT');
        
        // Fetch related data
        const [country, category, supplier, source] = await Promise.all([
          supabase.from('Countries').select('Country_Title').eq('Country_ID', record.Product_Country_ID).single(),
          supabase.from('Categories').select('Category_Title').eq('Category_ID', record.Product_Category_ID).single(),
          supabase.from('Supplier').select('Supplier_Title').eq('Supplier_ID', record.Product_Supplier_ID).single(),
          supabase.from('Sources').select('Source_Title').eq('Source_ID', record.Product_Source_ID).single()
        ]);

        await productsIndex.addDocuments([{
          id: record.Product_ID,
          title: record.Product_Title,
          price: record.Product_Price,
          image: record.Product_Image_URL,
          url: record.Product_Title_URL,
          moq: record.Product_MOQ,
          country: country.data?.Country_Title,
          category: category.data?.Category_Title,
          supplier: supplier.data?.Supplier_Title,
          source: source.data?.Source_Title
        }]);
        break;
      }

      case 'UPDATE': {
        if (!record) throw new Error('Record required for UPDATE');
        
        const [country, category, supplier, source] = await Promise.all([
          record.Product_Country_ID ? supabase.from('Countries').select('Country_Title').eq('Country_ID', record.Product_Country_ID).single() : null,
          record.Product_Category_ID ? supabase.from('Categories').select('Category_Title').eq('Category_ID', record.Product_Category_ID).single() : null,
          record.Product_Supplier_ID ? supabase.from('Supplier').select('Supplier_Title').eq('Supplier_ID', record.Product_Supplier_ID).single() : null,
          record.Product_Source_ID ? supabase.from('Sources').select('Source_Title').eq('Source_ID', record.Product_Source_ID).single() : null
        ]);

        await productsIndex.updateDocuments([{
          id: record.Product_ID,
          title: record.Product_Title,
          price: record.Product_Price,
          image: record.Product_Image_URL,
          url: record.Product_Title_URL,
          moq: record.Product_MOQ,
          country: country?.data?.Country_Title,
          category: category?.data?.Category_Title,
          supplier: supplier?.data?.Supplier_Title,
          source: source?.data?.Source_Title
        }]);
        break;
      }

      case 'DELETE': {
        if (!old_record) throw new Error('Old record required for DELETE');
        await productsIndex.deleteDocument(old_record.Product_ID);
        break;
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    
    // Log error
    await supabase
      .from('error_logs')
      .insert({
        message: error.message,
        stack: error.stack,
        severity: 'error',
        context: { path: '/sync-meilisearch' }
      });

    const status = error instanceof z.ZodError ? 400 : 
                   error.message === 'Invalid authentication' ? 401 : 500;

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