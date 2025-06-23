import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpDown } from 'lucide-react';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

interface SupplierListItem {
  Supplier_ID: string;
  Supplier_Title: string;
  Country_Title: string;
  Source_Title: string;
  Supplier_Category_ID: string;
  Category_Title: string;
  product_count: number;
}

type SortField = 'name' | 'industry' | 'country' | 'source' | 'products';
type SortOrder = 'asc' | 'desc';

export default function SuppliersListPage() {
  const [suppliers, setSuppliers] = useState<SupplierListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchSuppliers() {
      try {
        const { data: suppliersData, error: suppliersError } = await supabase
          .from('Supplier')
          .select(`
            Supplier_ID,
            Supplier_Title,
            Supplier_Category_ID,
            Supplier_Source_ID,
            Supplier_Country_ID,
            Countries!fk_supplier_country (Country_Title)
          `);

        if (suppliersError) throw suppliersError;

        const sourceIds = [...new Set((suppliersData || []).map(s => s.Supplier_Source_ID))];
        const { data: sourcesData } = await supabase
          .from('Sources')
          .select('Source_ID, Source_Title')
          .in('Source_ID', sourceIds);

        const sourcesMap = (sourcesData || []).reduce((acc, source) => {
          acc[source.Source_ID] = source.Source_Title;
          return acc;
        }, {} as Record<string, string>);

        const categoryIds = [...new Set((suppliersData || []).map(s => s.Supplier_Category_ID))];
        const { data: categoriesData } = await supabase
          .from('Categories')
          .select('Category_ID, Category_Title')
          .in('Category_ID', categoryIds);

        const categoriesMap = (categoriesData || []).reduce((acc, category) => {
          acc[category.Category_ID] = category.Category_Title;
          return acc;
        }, {} as Record<string, string>);

        const suppliersWithCount = await Promise.all(
          (suppliersData || []).map(async (supplier) => {
            const { count } = await supabase
              .from('Products')
              .select('*', { count: 'exact', head: true })
              .eq('Product_Supplier_ID', supplier.Supplier_ID);

            return {
              Supplier_ID: supplier.Supplier_ID,
              Supplier_Title: supplier.Supplier_Title,
              Country_Title: supplier.Countries?.Country_Title || 'Unknown',
              Source_Title: sourcesMap[supplier.Supplier_Source_ID] || 'Unknown',
              Supplier_Category_ID: supplier.Supplier_Category_ID,
              Category_Title: categoriesMap[supplier.Supplier_Category_ID] || 'Unknown',
              product_count: count || 0
            };
          })
        );

        setSuppliers(suppliersWithCount);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSuppliers();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedSuppliers = [...suppliers].sort((a, b) => {
    let compareA: string | number;
    let compareB: string | number;

    switch (sortField) {
      case 'name':
        compareA = a.Supplier_Title.toLowerCase();
        compareB = b.Supplier_Title.toLowerCase();
        break;
      case 'industry':
        compareA = a.Category_Title.toLowerCase();
        compareB = b.Category_Title.toLowerCase();
        break;
      case 'country':
        compareA = a.Country_Title.toLowerCase();
        compareB = b.Country_Title.toLowerCase();
        break;
      case 'source':
        compareA = a.Source_Title.toLowerCase();
        compareB = b.Source_Title.toLowerCase();
        break;
      case 'products':
        compareA = a.product_count;
        compareB = b.product_count;
        break;
      default:
        return 0;
    }

    const comparison = compareA < compareB ? -1 : compareA > compareB ? 1 : 0;
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const uniqueCountries = [...new Set(suppliers.map(s => s.Country_Title))];
  const uniqueCategories = [...new Set(suppliers.map(s => s.Category_Title))];

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
        title="Latin American Suppliers Directory"
        description={`Browse our directory of verified Latin American suppliers from ${uniqueCountries.join(', ')}. Find suppliers across ${uniqueCategories.join(', ')} and more.`}
        keywords={`Latin American suppliers, wholesale suppliers, ${uniqueCountries.join(', ')}, ${uniqueCategories.join(', ')}, B2B suppliers`}
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

          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-100">Our Suppliers</h1>
            <div className="flex gap-4">
              {(['name', 'industry', 'country', 'source', 'products'] as const).map((field) => (
                <button
                  key={field}
                  onClick={() => handleSort(field)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                    sortField === field
                      ? 'bg-[#F4A024] text-gray-900'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                  {sortField === field && (
                    <ArrowUpDown className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800/50 text-left">
                  <th className="px-6 py-3 text-gray-300">Name</th>
                  <th className="px-6 py-3 text-gray-300">Industry</th>
                  <th className="px-6 py-3 text-gray-300">Country</th>
                  <th className="px-6 py-3 text-gray-300">Source</th>
                  <th className="px-6 py-3 text-gray-300">Products</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {sortedSuppliers.map((supplier) => (
                  <tr
                    key={supplier.Supplier_ID}
                    onClick={() => navigate(`/supplier/${supplier.Supplier_Title}`)}
                    className="hover:bg-gray-800/30 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-100">{supplier.Supplier_Title}</td>
                    <td className="px-6 py-4 text-gray-300">{supplier.Category_Title}</td>
                    <td className="px-6 py-4 text-gray-300">{supplier.Country_Title}</td>
                    <td className="px-6 py-4 text-gray-300">{supplier.Source_Title}</td>
                    <td className="px-6 py-4 text-gray-300">{supplier.product_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}