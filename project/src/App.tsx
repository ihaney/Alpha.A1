import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import Navbar from './components/Navbar';
import TourGuide from './components/TourGuide';
import { useAnalytics } from './lib/analytics';

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('./pages/HomePage'));
const ProductPage = React.lazy(() => import('./pages/ProductPage'));
const SupplierPage = React.lazy(() => import('./pages/SupplierPage'));
const CategoriesPage = React.lazy(() => import('./pages/CategoriesPage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
const SearchResultsPage = React.lazy(() => import('./pages/SearchResultsPage'));
const SuppliersListPage = React.lazy(() => import('./pages/SuppliersListPage'));
const SourcesListPage = React.lazy(() => import('./pages/SourcesListPage'));
const CountriesListPage = React.lazy(() => import('./pages/CountriesListPage'));

// Analytics wrapper component
function AnalyticsWrapper({ children }: { children: React.ReactNode }) {
  useAnalytics('app');
  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AnalyticsWrapper>
          <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
            <div className="fixed inset-0 pointer-events-none gradient-overlay"></div>
            <Navbar />
            
            <Suspense fallback={
              <div className="flex justify-center items-center min-h-screen">
                <LoadingSpinner />
              </div>
            }>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/supplier/:id" element={<SupplierPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/search" element={<SearchResultsPage />} />
                <Route path="/suppliers" element={<SuppliersListPage />} />
                <Route path="/sources" element={<SourcesListPage />} />
                <Route path="/countries" element={<CountriesListPage />} />
              </Routes>
            </Suspense>
            <TourGuide />
          </div>
        </AnalyticsWrapper>
      </Router>
    </ErrorBoundary>
  );
}

export default App;