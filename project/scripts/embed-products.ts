import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Load environment variables from CI/CD or cloud function settings
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY
} = process.env;

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
  throw new Error('Missing required environment variables');
}

// Initialize Supabase with Service‑Role key
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

async function embedProducts() {
  // Fetch only the primary key and title
  const { data: products, error: fetchErr } = await supabase
    .from('Products')
    .select('Product_ID, Product_Title');
  if (fetchErr || !products) {
    console.error('Fetch error:', fetchErr);
    return;
  }

  const BATCH_SIZE = 20;
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (prod) => {
        try {
          // Use the title for embedding
          const text = prod.Product_Title;
          const resp = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: text,
          });
          const embedding = resp.data[0].embedding;
          const { error: upErr } = await supabase
            .from('Products')
            .update({ embedding })
            .eq('Product_ID', prod.Product_ID);
          if (upErr) {
            console.error(`Update failed for ${prod.Product_ID}:`, upErr);
          } else {
            console.log(`Embedded ${prod.Product_ID}`);
          }
        } catch (e) {
          console.error(`Error embedding ${prod.Product_ID}:`, e);
        }
      })
    );
    // Pause between batches to respect rate limits
    await new Promise((res) => setTimeout(res, 1000));
  }
}

embedProducts().catch(console.error);