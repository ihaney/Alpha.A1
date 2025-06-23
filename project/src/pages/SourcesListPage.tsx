import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

interface SourceListItem {
  Source_ID: string;
  Source_Title: string;
  Source_Image: string | null;
  product_count: number;
  supplier_count: number;
  country_count: number;
}

export default function SourcesListPage() {
  const [sources, setSources] = useState<SourceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchSources() {
      try {
        const { data: sourcesData, error: sourcesError } = await supabase
          .from('Sources')
          .select('Source_ID, Source_Title, Source_Image');

        if (sourcesError) throw sourcesError;

        const sourcesWithCounts = await Promise.all(
          (sourcesData || []).map(async (source) => {
            const { count: productCount } = await supabase
              .from('Products')
              .select('*', { count: 'exact', head: true })
              .eq('Product_Source_ID', source.Source_ID);

            const { data: suppliersData } = await supabase
              .from('Products')
              .select('Product_Supplier_ID')
              .eq('Product_Source_ID', source.Source_ID);
            
            const uniqueSuppliers = new Set(suppliersData?.map(p => p.Product_Supplier_ID));
            
            const { data: countriesData } = await supabase
              .from('Products')
              .select('Product_Country_ID')
              .eq('Product_Source_ID', source.Source_ID);
            
            const uniqueCountries = new Set(countriesData?.map(p => p.Product_Country_ID));

            return {
              ...source,
              product_count: productCount || 0,
              supplier_count: uniqueSuppliers.size,
              country_count: uniqueCountries.size
            };
          })
        );

        setSources(sourcesWithCounts);
      } catch (error) {
        console.error('Error fetching sources:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSources();
  }, []);

  const handleSourceClick = (sourceId: string) => {
    navigate(`/search?source=${sourceId}`);
  };

  const totalProducts = sources.reduce((sum, source) => sum + source.product_count, 0);
  const totalSuppliers = sources.reduce((sum, source) => sum + source.supplier_count, 0);
  const totalCountries = sources.reduce((sum, source) => sum + source.country_count, 0);

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
        title="Product Sources"
        description={`Browse Latin American products from ${sources.length} trusted sources. Access ${totalProducts.toLocaleString()} products from ${totalSuppliers.toLocaleString()} suppliers across ${totalCountries} countries.`}
        keywords={`Latin American marketplaces, ${sources.map(s => s.Source_Title).join(', ')}, B2B sources, wholesale sources`}
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

          <h1 className="text-3xl font-bold text-gray-100 mb-8">Product Sources</h1>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sources.map((source) => (
              <div
                key={source.Source_ID}
                onClick={() => handleSourceClick(source.Source_ID)}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 cursor-pointer hover:bg-gray-700/50 transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  {source.Source_Image && (
                    <img
                      src={source.Source_Image}
                      alt={source.Source_Title}
                      className="w-12 h-12 object-contain"
                    />
                  )}
                  <h2 className="text-xl font-semibold text-gray-100">
                    {source.Source_Title}
                  </h2>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">
                    {source.product_count.toLocaleString()} {source.product_count === 1 ? 'product' : 'products'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {source.supplier_count.toLocaleString()} {source.supplier_count === 1 ? 'supplier' : 'suppliers'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {source.country_count.toLocaleString()} {source.country_count === 1 ? 'country' : 'countries'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}