import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Share2 } from 'lucide-react';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabase';
import { analytics } from '../lib/analytics';
import type { Product } from '../types';

interface ExtendedProduct extends Product {
  supplierEmail?: string;
  supplierWhatsapp?: string;
}

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ExtendedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile] = useState(() => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

  useEffect(() => {
    async function fetchProduct() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        // First check if the product exists
        const { count, error: countError } = await supabase
          .from('Products')
          .select('Product_ID', { count: 'exact', head: true })
          .eq('Product_ID', id);

        if (countError) {
          console.error('Error checking product existence:', countError);
          setLoading(false);
          return;
        }

        if (count === 0) {
          setProduct(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
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
              Supplier_Title,
              Supplier_Email,
              Supplier_Whatsapp
            ),
            Sources (
              Source_Title
            )
          `)
          .eq('Product_ID', id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching product:', error);
          return;
        }

        if (data) {
          const productData = {
            id: data.Product_ID,
            name: data.Product_Title,
            Product_Price: data.Product_Price,
            image: data.Product_Image_URL || '',
            country: data.Countries?.Country_Title || 'Unknown',
            category: data.Categories?.Category_Title || 'Unknown',
            supplier: data.Supplier?.Supplier_Title || 'Unknown',
            supplierEmail: data.Supplier?.Supplier_Email || '',
            supplierWhatsapp: data.Supplier?.Supplier_Whatsapp || '',
            Product_MOQ: data.Product_MOQ,
            sourceUrl: data.Product_Title_URL || '',
            marketplace: data.Sources?.Source_Title || 'Unknown'
          };

          setProduct(productData);

          analytics.trackEvent('product_view', {
            props: {
              product_id: productData.id,
              product_name: productData.name,
              product_category: productData.category,
              product_country: productData.country
            }
          });
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  const handleShare = () => {
    if (!product) return;

    const shareUrl = window.location.href;
    const shareText = `I found this product on Paisán.\n\n${product.name}\n\n${shareUrl}`;

    if (isMobile) {
      // Use SMS sharing on mobile
      window.location.href = `sms:?body=${encodeURIComponent(shareText)}`;
    } else {
      // Use email sharing on desktop
      const subject = encodeURIComponent(`Check out this product on Paisán`);
      window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(shareText)}`;
    }

    analytics.trackEvent('product_share', {
      props: {
        product_id: product.id,
        product_name: product.name,
        share_method: isMobile ? 'sms' : 'email'
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#F4A024]">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <>
        <SEO 
          title="Product Not Found"
          description="The requested product could not be found. Browse our other Latin American products."
        />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-100">Product not found</h2>
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
  const emailSubject = encodeURIComponent(product.name);
  const emailBody = encodeURIComponent(`Hello, I am interested in this product that you offer. I found the listing from Paisán:\n\n${product.name}\n${currentUrl}`);
  const whatsappMessage = encodeURIComponent(`Hello, I am interested in this product that you offer. I found the listing from Paisán:\n\n${product.name}\n${currentUrl}`);

  const getContactLink = () => {
    if (product.supplierEmail) {
      return `mailto:${product.supplierEmail}?subject=${emailSubject}&body=${emailBody}`;
    } else if (product.supplierWhatsapp) {
      const whatsappNumber = product.supplierWhatsapp.replace(/\D/g, '');
      return `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
    }
    return '#';
  };

  const getContactText = () => {
    if (product.supplierEmail) {
      return 'Contact Supplier via Email';
    } else if (product.supplierWhatsapp) {
      return 'Contact Supplier via WhatsApp';
    }
    return 'Contact Supplier';
  };

  return (
    <>
      <SEO 
        title={product.name}
        description={`Buy ${product.name} from ${product.supplier}. ${product.category} products from ${product.country}. MOQ: ${product.Product_MOQ} units.`}
        keywords={`${product.name}, ${product.category}, ${product.country}, ${product.supplier}, wholesale, B2B, Latin American products`}
        image={product.image}
        type="product"
      />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center text-[#F4A024] hover:text-[#F4A024]"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Products
            </button>
            
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 text-[#F4A024] hover:text-[#F4A024]/80"
              title={`Share via ${isMobile ? 'SMS' : 'email'}`}
            >
              <Share2 className="w-5 h-5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div 
              className="aspect-square overflow-hidden rounded-lg bg-gray-800/50"
              data-tour="product-details"
            >
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover object-center"
              />
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-100">{product.name}</h1>
                <div className="mt-2 flex items-center gap-3">
                  <p className="text-xl text-[#F4A024]">{product.Product_Price}</p>
                  <span className="px-2 py-1 bg-gray-800 rounded-full text-sm text-gray-300">
                    {product.marketplace}
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-gray-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-100">Country</h3>
                    <p className="mt-1">{product.country}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-100">Category</h3>
                    <p className="mt-1">{product.category}</p>
                  </div>
                  <div>
                    <p className="mt-1">{product.Product_MOQ} units</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-100">Supplier</h3>
                    <button
                      onClick={() => navigate(`/supplier/${product.supplier}`)}
                      className="mt-1 text-left text-[#F4A024] hover:text-[#F4A024]"
                    >
                      {product.supplier}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-100">Original Source</h3>
                  <a
                    href={product.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center text-[#F4A024] hover:text-[#F4A024]"
                    onClick={() => {
                      analytics.trackEvent('source_link_click', {
                        props: {
                          product_id: product.id,
                          product_name: product.name,
                          marketplace: product.marketplace
                        }
                      });
                    }}
                  >
                    View on {product.marketplace}
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </div>
              </div>

              {(product.supplierEmail || product.supplierWhatsapp) && (
                <a
                  href={getContactLink()}
                  className="btn-primary w-full py-3 text-center block"
                  data-tour="contact-supplier"
                  onClick={() => {
                    analytics.trackEvent('contact_supplier_click', {
                      props: {
                        product_id: product.id,
                        product_name: product.name,
                        supplier: product.supplier,
                        contact_method: product.supplierEmail ? 'email' : 'whatsapp'
                      }
                    });
                  }}
                  target={product.supplierWhatsapp ? "_blank" : undefined}
                  rel={product.supplierWhatsapp ? "noopener noreferrer" : undefined}
                >
                  {getContactText()}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}