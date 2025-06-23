import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Mail, Phone, MapPin } from 'lucide-react';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ProductCard';
import type { Product, Supplier } from '../types';

export default function SupplierPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSupplierAndProducts() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        // First check if the supplier exists
        const { count, error: countError } = await supabase
          .from('Supplier')
          .select('Supplier_ID', { count: 'exact', head: true })
          .eq('Supplier_Title', id);

        if (countError) {
          console.error('Error checking supplier existence:', countError);
          setLoading(false);
          return;
        }

        if (count === 0) {
          setSupplier(null);
          setLoading(false);
          return;
        }

        const { data: supplierData, error: supplierError } = await supabase
          .from('Supplier')
          .select(`
            Supplier_ID,
            Supplier_Title,
            Supplier_Description,
            Supplier_Website,
            Supplier_Email,
            Supplier_Location,
            Countries (
              Country_Title
            )
          `)
          .eq('Supplier_Title', id)
          .maybeSingle();

        if (supplierError) {
          console.error('Error fetching supplier:', supplierError);
          return;
        }

        if (supplierData) {
          setSupplier({
            id: supplierData.Supplier_ID,
            name: supplierData.Supplier_Title,
            description: supplierData.Supplier_Description || '',
            website: supplierData.Supplier_Website || '#',
            country: supplierData.Countries?.Country_Title || 'Unknown',
            address: supplierData.Supplier_Location || '',
            email: supplierData.Supplier_Email || '',
            phone: '',
            products: []
          });

          const { data: productsData, error: productsError } = await supabase
            .from('Products')
            .select(`
              Product_ID,
              Product_Title,
              Product_Price,
              Product_Image_URL,
              Product_Title_URL,
              Product_MOQ,
              Countries (
                Country_Title
              ),
              Categories (
                Category_Title
              ),
              Supplier (
                Supplier_Title
              ),
              Sources (
                Source_Title
              )
            `)
            .eq('Product_Supplier_ID', supplierData.Supplier_ID);

          if (productsError) {
            console.error('Error fetching products:', productsError);
            return;
          }

          const formattedProducts: Product[] = productsData.map(product => ({
            id: product.Product_ID,
            name: product.Product_Title,
            price: parseFloat(product.Product_Price || '0'),
            image: product.Product_Image_URL || '',
            country: product.Countries?.Country_Title || 'Unknown',
            category: product.Categories?.Category_Title || 'Unknown',
            supplier: product.Supplier?.Supplier_Title || 'Unknown',
            moq: parseInt(product.Product_MOQ || '0'),
            sourceUrl: product.Product_Title_URL || '',
            marketplace: product.Sources?.Source_Title || 'Unknown',
            description: ''
          }));

          setProducts(formattedProducts);
        } else {
          setSupplier(null);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSupplierAndProducts();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#F4A024]">Loading supplier information...</div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <>
        <SEO 
          title="Supplier Not Found"
          description="The requested supplier could not be found. Browse our other Latin American suppliers."
        />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-100">Supplier not found</h2>
            <button
              onClick={() => navigate('/')}
              className="mt-4 inline-flex items-center text-[#F4A024] hover:text-[#F4A024]"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </button>
          </div>
        </div>
      </>
    );
  }

  const currentUrl = window.location.href;
  const emailBody = encodeURIComponent(`I am interested in your products.\n\nThis inquiry came from Paisán\nSupplier Page URL: ${currentUrl}`);

  return (
    <>
      <SEO 
        title={supplier.name}
        description={`${supplier.name} - ${supplier.description || `Latin American supplier from ${supplier.country}`}. Browse their products and get in touch.`}
        keywords={`${supplier.name}, ${supplier.country}, Latin American supplier, wholesale, B2B, ${products.map(p => p.category).join(', ')}`}
        type="profile"
      />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-[#F4A024] hover:text-[#F4A024] mb-8"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>

          <div className="space-y-8">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8">
              <h1 className="text-3xl font-bold text-gray-100 mb-4">{supplier.name}</h1>
              
              <div className="space-y-6">
                <p className="text-gray-300">{supplier.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {supplier.website && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Globe className="w-5 h-5 text-[#F4A024]" />
                        <a 
                          href={supplier.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#F4A024]"
                        >
                          {supplier.website}
                        </a>
                      </div>
                    )}
                    
                    {supplier.address && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="w-5 h-5 text-[#F4A024]" />
                        <span>{supplier.address}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {supplier.email && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Mail className="w-5 h-5 text-[#F4A024]" />
                        <a 
                          href={`mailto:${supplier.email}?body=${emailBody}`}
                          className="hover:text-[#F4A024]"
                        >
                          {supplier.email}
                        </a>
                      </div>
                    )}
                    
                    {supplier.phone && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Phone className="w-5 h-5 text-[#F4A024]" />
                        <a 
                          href={`tel:${supplier.phone}`}
                          className="hover:text-[#F4A024]"
                        >
                          {supplier.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-100">Products by {supplier.name}</h2>
              <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}