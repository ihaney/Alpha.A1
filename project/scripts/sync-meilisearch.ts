import { MeiliSearch } from 'meilisearch';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from CI/CD or cloud function settings
const {
  MEILISEARCH_HOST,
  MEILISEARCH_ADMIN_API_KEY,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
} = process.env;

// Validate required environment variables
if (!MEILISEARCH_HOST || !MEILISEARCH_ADMIN_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables');
}

const searchClient = new MeiliSearch({
  host: MEILISEARCH_HOST,
  apiKey: MEILISEARCH_ADMIN_API_KEY
});

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

const BATCH_SIZE = 1000;

async function getProductsCount() {
  const { count, error } = await supabase
    .from('Products')
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  return count || 0;
}

async function fetchProductBatch(from: number, to: number) {
  const { data, error } = await supabase
    .from('Products')
    .select(`
      Product_ID,
      Product_Title,
      Product_Price,
      Product_Image_URL,
      Product_Title_URL,
      Product_MOQ,
      Countries (Country_Title),
      Categories (Category_Title),
      Supplier (Supplier_Title),
      Sources (Source_Title)
    `)
    .range(from, to);

  if (error) throw error;
  return data;
}

async function syncProducts() {
  try {
    console.log('Starting sync process...');

    const productsIndex = searchClient.index('products');
    
    await productsIndex.updateSettings({
      searchableAttributes: [
        'title',
        'category',
        'supplier',
        'country'
      ],
      filterableAttributes: [
        'category',
        'country',
        'source',
        'supplier'
      ],
      sortableAttributes: [
        'price'
      ],
      typoTolerance: {
        enabled: true,
        minWordSizeForTypos: {
          oneTypo: 4,
          twoTypos: 8
        }
      },
      pagination: {
        maxTotalHits: 100000
      }
    });

    console.log('Clearing existing index...');
    await productsIndex.deleteAllDocuments();

    const totalProducts = await getProductsCount();
    console.log(`Total products to sync: ${totalProducts}`);

    let processedCount = 0;
    while (processedCount < totalProducts) {
      const batchEnd = Math.min(processedCount + BATCH_SIZE - 1, totalProducts - 1);
      console.log(`Processing batch: ${processedCount} to ${batchEnd}`);

      const products = await fetchProductBatch(processedCount, batchEnd);

      const documents = products.map(product => ({
        id: product.Product_ID,
        title: product.Product_Title,
        price: product.Product_Price,
        image: product.Product_Image_URL,
        url: product.Product_Title_URL,
        moq: product.Product_MOQ,
        country: product.Countries?.Country_Title,
        category: product.Categories?.Category_Title,
        supplier: product.Supplier?.Supplier_Title,
        source: product.Sources?.Source_Title
      }));

      await productsIndex.addDocuments(documents);
      
      processedCount += products.length;
      console.log(`Progress: ${processedCount}/${totalProducts} products synced`);

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`Successfully synced ${processedCount} products to Meilisearch`);
  } catch (error) {
    console.error('Error syncing products:', error);
    process.exit(1);
  }
}

syncProducts();