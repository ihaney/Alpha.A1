import React from 'react';
import SEO from '../components/SEO';

export default function AboutPage() {
  return (
    <>
      <SEO 
        title="About Us"
        description="Learn about Paisán's mission to connect Latin American suppliers with global markets. Discover how we're bridging the gap in international trade."
        keywords="About Paisán, Latin American trade, B2B marketplace, supplier network, international trade"
      />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Central Title Section */}
          <div className="text-center">
            <h1
              style={{ color: '#F4A024' }}
              className="text-6xl font-bold mb-4 paisan-text"
            >
              Paisán
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Connecting Latin American Suppliers to global markets
            </p>
          </div>

          {/* Mission and Vision Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6 text-center">
              <h2 style={{ color: '#F4A024' }} className="text-2xl font-bold">
                Our Mission
              </h2>
              <p className="text-gray-300">
                Our goal is to create more visibility for Latin American Suppliers and global markets.
              </p>
            </div>
            <div className="space-y-6 text-center">
              <h2 style={{ color: '#F4A024' }} className="text-2xl font-bold">
                Our Vision
              </h2>
              <p className="text-gray-300">
                To become the leading platform for discovering and sourcing Latin American products, while empowering Supply Chains and optimizing B2B integrations.
              </p>
            </div>
          </div>

          {/* Terms and Services Section */}
          <div className="text-center">
            <h2 style={{ color: '#F4A024' }} className="text-2xl font-bold mb-4">
              Terms and Services
            </h2>
            <p className="text-gray-300 max-w-3xl mx-auto">
              By using Paisán, users agree to use the platform only for lawful purposes and acknowledge that Paisán serves solely as a connector between buyers and Latin American suppliers and their associated marketplaces. Paisán does not purport to own or sell any of these products directly, all ownership and corresponding benefits is attributed to the product's suppliers and respective marketplaces.  All product listings, pricing, and supplier details are provided by third parties, and while we strive for accuracy, Paisán does not guarantee this information. We currently do not handle payments, shipments, or contracts between buyers and suppliers, and are not liable for any losses or issues that may arise from those transactions. We reserve the right to remove any content or suppliers that violate our policies.
            </p>
          </div>

          {/* Contact Section */}
          <div className="text-center">
            <h2 style={{ color: '#F4A024' }} className="text-2xl font-bold mb-2">
              Contact
            </h2>
            <p className="text-gray-300">
              For any inquiries contact:{' '}
              <a 
                href="mailto:paisanpublishing@gmail.com" 
                className="text-[#F4A024] underline"
              >
                paisanpublishing@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}