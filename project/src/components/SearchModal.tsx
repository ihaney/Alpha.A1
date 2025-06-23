import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Package, Building2 } from 'lucide-react';
import { productsIndex, suppliersIndex } from '../lib/meilisearch';
import LoadingSpinner from './LoadingSpinner';
import { logError } from '../lib/errorLogging';

function useDebouncedValue(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

interface SearchResult {
  id: string;
  name: string;
  type: 'product' | 'supplier';
  image?: string;
  country?: string;
  category?: string;
  supplier?: string;
  marketplace?: string;
  price?: string;
  moq?: string;
  product_count?: number;
  description?: string;
  location?: string;
  url: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'products' | 'suppliers'>('products');
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    async function performSearch() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let searchResults: SearchResult[] = [];

        if (searchMode === 'products') {
          // Search products
          const productsResults = await productsIndex.search(debouncedQuery, {
            limit: 20,
            attributesToRetrieve: [
              'id',
              'title',
              'price',
              'image',
              'url',
              'moq',
              'country',
              'category',
              'supplier',
              'source'
            ]
          });

          searchResults = productsResults.hits.map(hit => ({
            id: hit.id as string,
            name: hit.title as string,
            type: 'product' as const,
            image: hit.image as string || '',
            country: hit.country as string || 'Unknown',
            category: hit.category as string || 'Unknown',
            supplier: hit.supplier as string || 'Unknown',
            marketplace: hit.source as string || 'Unknown',
            price: hit.price as string,
            moq: hit.moq as string || 'N/A',
            url: `/product/${hit.id}`
          }));
        } else {
          // Search suppliers
          const suppliersResults = await suppliersIndex.search(debouncedQuery, {
            limit: 20,
            attributesToRetrieve: [
              'Supplier_ID',
              'Supplier_Title',
              'Supplier_Description',
              'Supplier_Country_Name',
              'Supplier_City_Name',
              'Supplier_Location',
              'product_count',
              'product_keywords'
            ]
          });

          searchResults = suppliersResults.hits.map(hit => ({
            id: hit.Supplier_ID as string,
            name: hit.Supplier_Title as string,
            type: 'supplier' as const,
            country: hit.Supplier_Country_Name as string || 'Unknown',
            location: hit.Supplier_Location as string || hit.Supplier_City_Name as string || 'Unknown',
            description: hit.Supplier_Description as string || '',
            product_count: hit.product_count as number || 0,
            url: `/supplier/${encodeURIComponent(hit.Supplier_Title as string)}`
          }));
        }

        setResults(searchResults);

        if (!searchResults.length && debouncedQuery.length > 2) {
          logError(new Error('Search returned no results'), {
            type: 'search_no_results',
            query: debouncedQuery,
            mode: searchMode
          }, 'warning');
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to perform search. Please try again.');
        logError(err instanceof Error ? err : new Error('Search failed'), {
          type: 'search_error',
          query: debouncedQuery,
          mode: searchMode
        });
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [debouncedQuery, searchMode]);

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      navigate(result.url);
      onClose();
      setSearchQuery('');
    },
    [navigate, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        if (results.length > 0) {
          // Navigate to the first result
          navigate(results[0].url);
          onClose();
          setSearchQuery('');
        } else if (searchQuery.trim()) {
          // Navigate to general search results
          navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
          onClose();
          setSearchQuery('');
        }
      }
    },
    [searchQuery, results, navigate, onClose]
  );

  const handleClose = () => {
    onClose();
    setSearchQuery('');
    setResults([]);
  };

  if (!isOpen) return null;

  const placeholderText = searchMode === 'products' 
    ? 'Search products, categories, suppliers...' 
    : 'Search suppliers by name, location, capabilities...';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-16 px-4">
      <div className="bg-gray-900 rounded-lg shadow-lg w-full max-w-3xl p-6 relative">
        <button
          onClick={handleClose}
          className="absolute -top-3 -right-3 text-gray-400 hover:text-white transition-colors bg-gray-800 rounded-full p-2"
          aria-label="Close search"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Search Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSearchMode('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              searchMode === 'products'
                ? 'bg-[#F4A024] text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Package className="w-4 h-4" />
            Products
          </button>
          <button
            onClick={() => setSearchMode('suppliers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              searchMode === 'suppliers'
                ? 'bg-[#F4A024] text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Suppliers
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder={placeholderText}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-[#F4A024] focus:ring-1 focus:ring-[#F4A024]"
            autoFocus
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <LoadingSpinner />
            </div>
          )}
        </div>

        {error && (
          <p className="text-red-400 mt-2 text-sm">{error}</p>
        )}

        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          {results.length > 0 ? (
            <>
              <div className="mb-2 text-sm text-gray-400">
                Found {results.length} {searchMode === 'products' ? 'products' : 'suppliers'}
              </div>
              <ul className="space-y-2">
                {results.map((result) => (
                  <li
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="cursor-pointer rounded-lg p-3 hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {result.image && (
                        <img
                          src={result.image}
                          alt={result.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{result.name}</h3>
                        <div className="flex gap-2 text-sm text-gray-400">
                          {result.type === 'product' ? (
                            <>
                              <span>{result.category}</span>
                              <span>•</span>
                              <span>{result.supplier}</span>
                              <span>•</span>
                              <span>{result.marketplace}</span>
                              {result.price && (
                                <>
                                  <span>•</span>
                                  <span className="text-[#F4A024]">{result.price}</span>
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="text-[#F4A024] font-medium">Supplier</span>
                              <span>•</span>
                              <span>{result.country}</span>
                              {result.location && (
                                <>
                                  <span>•</span>
                                  <span>{result.location}</span>
                                </>
                              )}
                              {result.product_count !== undefined && (
                                <>
                                  <span>•</span>
                                  <span>{result.product_count} products</span>
                                </>
                              )}
                            </>
                          )}
                        </div>
                        {result.type === 'supplier' && result.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {result.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : searchQuery && !loading && (
            <p className="text-center text-gray-400 py-4">
              No {searchMode} found. Try different keywords or switch search mode.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}