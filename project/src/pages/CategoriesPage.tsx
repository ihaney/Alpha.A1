import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

interface Category {
  Category_ID: string;
  Category_Title: string;
  product_count: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('Categories')
          .select('Category_ID, Category_Title');

        if (categoriesError) throw categoriesError;

        const categoriesWithCount = await Promise.all(
          (categoriesData || []).map(async (category) => {
            const { count, error: countError } = await supabase
              .from('Products')
              .select('*', { count: 'exact', head: true })
              .eq('Product_Category_ID', category.Category_ID);

            if (countError) throw countError;

            return {
              Category_ID: category.Category_ID,
              Category_Title: category.Category_Title,
              product_count: count || 0
            };
          })
        );

        setCategories(categoriesWithCount);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/search?category=${categoryId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Product Categories"
        description="Browse our Latin American product categories. Find wholesale products across various industries and categories."
        keywords="Latin American categories, product categories, wholesale categories, B2B categories"
      />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-100 mb-8">Product Categories</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <button
                key={category.Category_ID}
                onClick={() => handleCategoryClick(category.Category_ID)}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 hover:bg-gray-700/50 transition-colors text-left"
              >
                <h2 className="text-xl font-semibold text-gray-100 mb-2">
                  {category.Category_Title}
                </h2>
                <p className="text-gray-300">
                  {category.product_count} {category.product_count === 1 ? 'product' : 'products'}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}