import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';
import { logError } from '../lib/errorLogging';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
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
          `);

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        if (!data) {
          throw new Error('No data returned from Supabase');
        }

        return data.map(product => ({
          id: product.Product_ID,
          name: product.Product_Title,
          Product_Price: product.Product_Price,
          image: product.Product_Image_URL || '',
          country: product.Countries?.Country_Title || 'Unknown',
          category: product.Categories?.Category_Title || 'Unknown',
          supplier: product.Supplier?.Supplier_Title || 'Unknown',
          Product_MOQ: product.Product_MOQ,
          sourceUrl: product.Product_Title_URL || '',
          marketplace: product.Sources?.Source_Title || 'Unknown'
        }));
      } catch (error) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          source: 'useProducts'
        });
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
}