import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { analytics } from '../lib/analytics';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    analytics.trackEvent('product_click', {
      props: {
        product_id: product.id,
        product_name: product.name,
        product_category: product.category,
        product_country: product.country,
        product_supplier: product.supplier,
        product_source: product.marketplace,
        product_price: product.Product_Price
      }
    });
    navigate(`/product/${product.id}`);
  };

  return (
    <div 
      className="group cursor-pointer"
      onClick={handleClick}
    >
      <div className="aspect-square overflow-hidden rounded-lg bg-gray-800/50 backdrop-blur-sm">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity"
        />
      </div>
      <div className="mt-4 space-y-1">
        <h3 className="text-sm text-gray-100">{product.name}</h3>
        <p className="text-sm text-gray-300">{product.country}</p>
        <div className="flex items-center justify-between">
          <p className="text-lg font-medium text-[#F4A024]">{product.Product_Price}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-gray-800 rounded-full text-gray-300">
              {product.marketplace} • {product.country}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}