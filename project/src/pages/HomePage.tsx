import React, { useState } from 'react';
import SEO from '../components/SEO';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import SortControls from '../components/SortControls';
import LoadingSpinner from '../components/LoadingSpinner';
import { useProducts } from '../hooks/useProducts';

export default function HomePage() {
  const { data: products = [], isLoading, error } = useProducts();
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const sortedProducts = [...products].sort((a, b) => {
    if (!sortBy) return 0;

    let compareA, compareB;

    switch (sortBy) {
      case 'price':
        compareA = parseFloat(a.Product_Price.replace(/[^0-9.-]+/g, ''));
        compareB = parseFloat(b.Product_Price.replace(/[^0-9.-]+/g, ''));
        break;
      case 'country':
        compareA = a.country.toLowerCase();
        compareB = b.country.toLowerCase();
        break;
      case 'category':
        compareA = a.category.toLowerCase();
        compareB = b.category.toLowerCase();
        break;
      case 'marketplace':
        compareA = a.marketplace.toLowerCase();
        compareB = b.marketplace.toLowerCase();
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return compareA > compareB ? 1 : -1;
    } else {
      return compareA < compareB ? 1 : -1;
    }
  });

  return (
    <>
      <SEO 
        title="Latin American Products Marketplace"
        description="Discover authentic Latin American products and connect with trusted suppliers. Find wholesale products from Mexico, Colombia, Peru, Brazil and more."
        keywords="Latin American marketplace, wholesale products, B2B marketplace, Mexican products, Colombian products, Peruvian products, Brazilian products"
      />
      <Hero />
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-100">Featured Products</h2>
              <p className="text-gray-300">Discover authentic Latin American products</p>
            </div>
            <SortControls
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
            />
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              Error loading products. Please try again later.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-100 mb-4">Countries We Source From</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-gray-300">
            <div className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors backdrop-blur-sm">
              <p className="font-medium">Mexico</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors backdrop-blur-sm">
              <p className="font-medium">Colombia</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors backdrop-blur-sm">
              <p className="font-medium">Peru</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors backdrop-blur-sm">
              <p className="font-medium">Brazil</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}