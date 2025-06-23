import { MeiliSearch } from 'meilisearch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MEILISEARCH_HOST = process.env.VITE_MEILISEARCH_HOST;
const MEILISEARCH_API_KEY = process.env.VITE_MEILISEARCH_API_KEY;

if (!MEILISEARCH_HOST || !MEILISEARCH_API_KEY) {
  console.error('Missing Meilisearch environment variables');
  console.error('Please ensure VITE_MEILISEARCH_HOST and VITE_MEILISEARCH_API_KEY are set in your .env file');
  process.exit(1);
}

const client = new MeiliSearch({
  host: MEILISEARCH_HOST,
  apiKey: MEILISEARCH_API_KEY
});

async function setupMeilisearchIndexes() {
  try {
    console.log('🔧 Setting up Meilisearch indexes...');

    // 1. Create suppliers index
    console.log('\n📦 Creating suppliers index...');
    try {
      await client.createIndex('suppliers', { primaryKey: 'Supplier_ID' });
      console.log('✅ Suppliers index created successfully');
    } catch (error: any) {
      if (error.code === 'index_already_exists') {
        console.log('ℹ️  Suppliers index already exists');
      } else {
        throw error;
      }
    }

    // 2. Configure suppliers index settings
    console.log('\n⚙️  Configuring suppliers index settings...');
    const suppliersIndex = client.index('suppliers');
    
    await suppliersIndex.updateSettings({
      searchableAttributes: [
        'Supplier_Title',
        'Supplier_Description', 
        'Supplier_Location',
        'Supplier_Country_Name',
        'Supplier_City_Name',
        'Supplier_Email',
        'Supplier_Whatsapp',
        'Supplier_ID',
        'product_keywords'
      ],
      sortableAttributes: [
        'Supplier_Title',
        'Supplier_Country_Name',
        'product_count'
      ],
      filterableAttributes: [
        'Supplier_Country_Name',
        'Supplier_Source_ID',
        'product_count'
      ],
      displayedAttributes: [
        'Supplier_ID',
        'Supplier_Title',
        'Supplier_Description',
        'Supplier_Location',
        'Supplier_Country_Name',
        'Supplier_City_Name',
        'Supplier_Email',
        'Supplier_Whatsapp',
        'Supplier_Website',
        'Supplier_Source_ID',
        'product_count',
        'product_keywords'
      ],
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
        'product_count:desc'
      ]
    });
    console.log('✅ Suppliers index settings configured');

    // 3. Verify and update products index settings
    console.log('\n📦 Verifying products index settings...');
    const productsIndex = client.index('products');
    
    // Get current settings
    const currentSettings = await productsIndex.getSettings();
    console.log('Current products searchable attributes:', currentSettings.searchableAttributes);

    // Update products index settings to ensure all required fields are searchable
    await productsIndex.updateSettings({
      searchableAttributes: [
        'title',
        'Product_Title',
        'Product_Category_Name',
        'Product_Country_Name', 
        'Product_Supplier_Name',
        'Product_Source_Name',
        'category',
        'supplier',
        'country',
        'source',
        'id',
        'Product_ID'
      ],
      sortableAttributes: [
        'title',
        'Product_Title',
        'price',
        'Product_Price',
        'Product_Category_Name',
        'Product_Country_Name',
        'Product_Supplier_Name'
      ],
      filterableAttributes: [
        'category',
        'Product_Category_Name',
        'supplier',
        'Product_Supplier_Name',
        'country',
        'Product_Country_Name',
        'source',
        'Product_Source_Name'
      ],
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness'
      ]
    });
    console.log('✅ Products index settings updated');

    // 4. Display index information
    console.log('\n📊 Index Information:');
    
    const suppliersStats = await suppliersIndex.getStats();
    console.log(`Suppliers Index: ${suppliersStats.numberOfDocuments} documents`);
    
    const productsStats = await productsIndex.getStats();
    console.log(`Products Index: ${productsStats.numberOfDocuments} documents`);

    console.log('\n🎉 Meilisearch indexes setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Populate the suppliers index with enhanced data using npm run populate-suppliers');
    console.log('2. Verify the products index has the latest data');
    console.log('3. Test search functionality with the new product/supplier search modes');

  } catch (error) {
    console.error('❌ Error setting up Meilisearch indexes:', error);
    process.exit(1);
  }
}

// Run the setup
setupMeilisearchIndexes();