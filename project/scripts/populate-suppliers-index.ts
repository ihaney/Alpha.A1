import { MeiliSearch } from 'meilisearch';
import { supabase } from '../src/lib/supabase';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MEILISEARCH_HOST = process.env.VITE_MEILISEARCH_HOST;
const MEILISEARCH_API_KEY = process.env.VITE_MEILISEARCH_API_KEY;

if (!MEILISEARCH_HOST || !MEILISEARCH_API_KEY) {
  console.error('Missing Meilisearch environment variables');
  process.exit(1);
}

const client = new MeiliSearch({
  host: MEILISEARCH_HOST,
  apiKey: MEILISEARCH_API_KEY
});

async function populateSuppliersIndex() {
  try {
    console.log('🔄 Populating suppliers index...');

    // Fetch all suppliers from Supabase
    const { data: suppliers, error } = await supabase
      .from('Supplier')
      .select(`
        Supplier_ID,
        Supplier_Title,
        Supplier_Description,
        Supplier_Website,
        Supplier_Email,
        Supplier_Location,
        Supplier_Whatsapp,
        Supplier_Country_Name,
        Supplier_City_Name,
        Supplier_Source_ID
      `);

    if (error) {
      throw error;
    }

    if (!suppliers || suppliers.length === 0) {
      console.log('⚠️  No suppliers found in database');
      return;
    }

    console.log(`📊 Found ${suppliers.length} suppliers in database`);

    // Fetch all products to create product keywords for suppliers
    const { data: products, error: productsError } = await supabase
      .from('Products')
      .select(`
        Product_Supplier_ID,
        Product_Title,
        Product_Category_Name
      `);

    if (productsError) {
      console.warn('⚠️  Could not fetch products for supplier keywords:', productsError);
    }

    // Create a map of supplier product keywords and counts
    const supplierProductData = new Map();
    
    if (products) {
      console.log(`📦 Processing ${products.length} products for supplier keywords...`);
      
      products.forEach(product => {
        if (product.Product_Supplier_ID) {
          if (!supplierProductData.has(product.Product_Supplier_ID)) {
            supplierProductData.set(product.Product_Supplier_ID, {
              count: 0,
              keywords: new Set()
            });
          }
          
          const data = supplierProductData.get(product.Product_Supplier_ID);
          data.count++;
          
          // Add product title keywords
          if (product.Product_Title) {
            const titleWords = product.Product_Title.toLowerCase().split(/\s+/);
            titleWords.forEach(word => {
              if (word.length > 2) { // Only include words longer than 2 characters
                data.keywords.add(word);
              }
            });
          }
          
          // Add category keywords
          if (product.Product_Category_Name) {
            const categoryWords = product.Product_Category_Name.toLowerCase().split(/\s+/);
            categoryWords.forEach(word => {
              if (word.length > 2) {
                data.keywords.add(word);
              }
            });
          }
        }
      });
    }

    // Prepare suppliers with enhanced data for Meilisearch
    const suppliersWithEnhancedData = suppliers.map(supplier => {
      const productData = supplierProductData.get(supplier.Supplier_ID) || { count: 0, keywords: new Set() };
      
      return {
        ...supplier,
        product_count: productData.count,
        product_keywords: Array.from(productData.keywords).join(' ')
      };
    });

    // Add documents to Meilisearch
    const suppliersIndex = client.index('suppliers');
    
    console.log('📤 Adding suppliers to Meilisearch with enhanced search data...');
    const task = await suppliersIndex.addDocuments(suppliersWithEnhancedData);
    
    console.log(`✅ Added ${suppliersWithEnhancedData.length} suppliers to index`);
    console.log(`Task ID: ${task.taskUid}`);

    // Wait for indexing to complete
    console.log('⏳ Waiting for indexing to complete...');
    await suppliersIndex.waitForTask(task.taskUid);
    
    const stats = await suppliersIndex.getStats();
    console.log(`🎉 Suppliers index now contains ${stats.numberOfDocuments} documents`);
    
    // Show sample of enhanced data
    const sampleSupplier = suppliersWithEnhancedData[0];
    if (sampleSupplier) {
      console.log('📋 Sample enhanced supplier data:');
      console.log(`  - Title: ${sampleSupplier.Supplier_Title}`);
      console.log(`  - Product Count: ${sampleSupplier.product_count}`);
      console.log(`  - Product Keywords: ${sampleSupplier.product_keywords.substring(0, 100)}...`);
    }

  } catch (error) {
    console.error('❌ Error populating suppliers index:', error);
    process.exit(1);
  }
}

// Run the population script
populateSuppliersIndex();