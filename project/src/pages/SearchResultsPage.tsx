import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabase';
import { productsIndex } from '../lib/meilisearch';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Product } from '../types';
import { logError } from '../lib/errorLogging';

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category');
  const source = searchParams.get('source');
  const country = searchParams.get('country');
  const [results, setResults] = useState<Product[]>([]);
  const [categoryTitle, setCategoryTitle] = useState<string>('');
  const [sourceTitle, setSourceTitle] = useState<string>('');
  const [countryTitle, setCountryTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    async function fetchSearchResults() {
      setLoading(true);
      try {
        let filter = '';
        if (category) {
          const { data: categoryData } = await supabase
            .from('Categories')
            .select('Category_Title')
            .eq('Category_ID', category)
            .single();
          if (categoryData) {
            setCategoryTitle(categoryData.Category_Title);
            filter = `category = "${categoryData.Category_Title}"`;
          }
        }

        if (source) {
          const { data: sourceData } = await supabase
            .from('Sources')
            .select('Source_Title')
            .eq('Source_ID', source)
            .single();
          if (sourceData) {
            setSourceTitle(sourceData.Source_Title);
            filter = `source = "${sourceData.Source_Title}"`;
          }
        }

        if (country) {
          const { data: countryData } = await supabase
            .from('Countries')
            .select('Country_Title')
            .eq('Country_ID', country)
            .single();
          if (countryData) {
            setCountryTitle(countryData.Country_Title);
            filter = `country = "${countryData.Country_Title}"`;
          }
        }

        const searchResults = await productsIndex.search(query, {
          filter,
          limit: 100
        });

        setTotalCount(searchResults.estimatedTotalHits || 0);

        const formattedResults = searchResults.hits.map(hit => ({
          id: hit.id as string,
          name: hit.title as string,
          Product_Price: hit.price as string,
          image: hit.image as string || '',
          country: hit.country as string || 'Unknown',
          category: hit.category as string || 'Unknown',
          supplier: hit.supplier as string || 'Unknown',
          Product_MOQ: hit.moq as string,
          sourceUrl: hit.url as string || '',
          marketplace: hit.source as string || 'Unknown'
        }));

        setResults(formattedResults);

        if (!formattedResults.length && query.length > 2) {
          logError(new Error('Search returned no results'), {
            type: 'search_no_results',
            query,
            category,
            source,
            country
          }, 'warning');
        }
      } catch (err) {
        console.error('Search error:', err);
        logError(err instanceof Error ? err : new Error('Search failed'), {
          type: 'search_error',
          query,
          category,
          source,
          country
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSearchResults();
  }, [query, category, source, country]);

  const getPageTitle = () => {
    if (category && categoryTitle) {
      return `Products in ${categoryTitle}`;
    }
    if (source && sourceTitle) {
      return `${totalCount.toLocaleString()} Products from ${sourceTitle}`;
    }
    if (country && countryTitle) {
      return `Products from ${countryTitle}`;
    }
    return query ? `Search Results for "${query}"` : 'All Products';
  };

  const getMetaDescription = () => {
    if (category && categoryTitle) {
      return `Browse ${categoryTitle} products from Latin American suppliers. Find wholesale ${categoryTitle.toLowerCase()} products for your business.`;
    }
    if (source && sourceTitle) {
      return `Discover Latin American products from ${sourceTitle}. Browse our collection of wholesale products from trusted suppliers.`;
    }
    if (country && countryTitle) {
      return `Explore products from ${countryTitle}. Find authentic Latin American wholesale products from verified suppliers.`;
    }
    return query 
      ? `Search results for "${query}". Browse Latin American wholesale products matching your search.`
      : 'Browse our complete collection of Latin American wholesale products from trusted suppliers.';
  };

  return (
    <>
      <SEO 
        title={getPageTitle()}
        description={getMetaDescription()}
        keywords={`${query}, ${categoryTitle}, ${countryTitle}, ${sourceTitle}, Latin American products, wholesale, B2B`}
      />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-[#F4A024] hover:text-[#F4A024]/80 mb-8"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>

          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-100 mb-2">
                {getPageTitle()}
              </h1>
              {!source && (
                <p className="text-gray-300">
                  {results.length} {results.length === 1 ? 'result' : 'results'} found
                </p>
              )}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <LoadingSpinner />
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                {results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-300">
                  No products found {category ? 'in this category' : source ? 'from this source' : country ? 'from this country' : query ? `for "${query}"` : ''}
                </p>
                <p className="text-gray-400 mt-2">
                  Try {category ? 'another category' : source ? 'another source' : country ? 'another country' : 'searching with different keywords'} or browse our categories
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}