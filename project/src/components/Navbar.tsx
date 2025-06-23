import React, { useState, useEffect } from 'react';
import { Search, Menu, ChevronDown, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { analytics } from '../lib/analytics';
import PaisanLogo from '../assets/paisan-logo.svg';
import SearchModal from './SearchModal';

interface Category {
  Category_ID: string;
  Category_Title: string;
}

export default function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('Categories')
        .select('Category_ID, Category_Title')
        .order('Category_Title');
      
      if (data) {
        setCategories(data);
      }
    }

    fetchCategories();
  }, []);

  const trackNavigation = (type: string, name: string) => {
    analytics.trackEvent('navigation_click', {
      props: {
        nav_type: type,
        item_name: name
      }
    });
  };

  const handleMouseEnter = (dropdown: string) => {
    if (window.innerWidth >= 768) {
      setActiveDropdown(dropdown);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth >= 768) {
      setActiveDropdown(null);
    }
  };

  const toggleMobileDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  return (
    <>
      <nav className="fixed top-0 w-full bg-gray-900 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link 
                to="/" 
                className="flex items-center" 
                onClick={() => trackNavigation('logo', 'home')}
              >
                <img src={PaisanLogo} alt="Paisán" className="h-16" />
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <div 
                className="relative"
                onMouseEnter={() => handleMouseEnter('discover')}
                onMouseLeave={handleMouseLeave}
              >
                <button className="flex items-center text-gray-300 hover:text-gray-100 transition-colors py-4 px-2">
                  Discover
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                
                {activeDropdown === 'discover' && (
                  <div className="absolute left-0 mt-0 w-48 rounded-md shadow-lg bg-gray-900 ring-1 ring-black ring-opacity-5">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <Link
                        to="/suppliers"
                        className="block px-4 py-2 text-sm text-gray-300 hover:text-[#F4A024] hover:bg-gray-800"
                        role="menuitem"
                        onClick={() => {
                          closeMobileMenu();
                          trackNavigation('menu', 'suppliers');
                        }}
                      >
                        Suppliers
                      </Link>
                      <Link
                        to="/sources"
                        className="block px-4 py-2 text-sm text-gray-300 hover:text-[#F4A024] hover:bg-gray-800"
                        role="menuitem"
                        onClick={() => {
                          closeMobileMenu();
                          trackNavigation('menu', 'sources');
                        }}
                      >
                        Sources
                      </Link>
                      <Link
                        to="/countries"
                        className="block px-4 py-2 text-sm text-gray-300 hover:text-[#F4A024] hover:bg-gray-800"
                        role="menuitem"
                        onClick={() => {
                          closeMobileMenu();
                          trackNavigation('menu', 'countries');
                        }}
                      >
                        Countries
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div 
                className="relative"
                onMouseEnter={() => handleMouseEnter('categories')}
                onMouseLeave={handleMouseLeave}
              >
                <button className="flex items-center text-gray-300 hover:text-gray-100 transition-colors py-4 px-2">
                  Categories
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>

                {activeDropdown === 'categories' && (
                  <div className="absolute left-0 mt-0 w-56 rounded-md shadow-lg bg-gray-900 ring-1 ring-black ring-opacity-5">
                    <div className="py-1 max-h-96 overflow-y-auto" role="menu" aria-orientation="vertical">
                      {categories.map((category) => (
                        <Link
                          key={category.Category_ID}
                          to={`/search?category=${category.Category_ID}`}
                          className="block px-4 py-2 text-sm text-gray-300 hover:text-[#F4A024] hover:bg-gray-800"
                          role="menuitem"
                          onClick={() => {
                            closeMobileMenu();
                            trackNavigation('category', category.Category_Title);
                          }}
                        >
                          {category.Category_Title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link 
                to="/about" 
                className="text-gray-300 hover:text-gray-100 transition-colors py-4 px-2"
                onClick={() => {
                  closeMobileMenu();
                  trackNavigation('menu', 'about');
                }}
              >
                About
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={() => {
                  setIsSearchOpen(true);
                  analytics.trackEvent('search_open');
                }}
                className="text-gray-300 hover:text-gray-100 p-2 rounded-full"
                aria-label="Search"
                data-tour="search-button"
              >
                <Search className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-gray-300 hover:text-gray-100 p-2 rounded-full z-50"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-16 bg-gray-900 z-40">
            <div className="px-4 pt-2 pb-3 space-y-1">
              <div>
                <button
                  onClick={() => toggleMobileDropdown('discover')}
                  className="w-full flex items-center justify-between text-gray-300 hover:text-gray-100 px-3 py-2 rounded-md text-base font-medium"
                >
                  Discover
                  <ChevronDown className={`w-4 h-4 transform transition-transform ${activeDropdown === 'discover' ? 'rotate-180' : ''}`} />
                </button>
                {activeDropdown === 'discover' && (
                  <div className="pl-4 space-y-2">
                    <Link
                      to="/suppliers"
                      className="block px-3 py-2 text-gray-300 hover:text-[#F4A024]"
                      onClick={() => {
                        closeMobileMenu();
                        trackNavigation('mobile_menu', 'suppliers');
                      }}
                    >
                      Suppliers
                    </Link>
                    <Link
                      to="/sources"
                      className="block px-3 py-2 text-gray-300 hover:text-[#F4A024]"
                      onClick={() => {
                        closeMobileMenu();
                        trackNavigation('mobile_menu', 'sources');
                      }}
                    >
                      Sources
                    </Link>
                    <Link
                      to="/countries"
                      className="block px-3 py-2 text-gray-300 hover:text-[#F4A024]"
                      onClick={() => {
                        closeMobileMenu();
                        trackNavigation('mobile_menu', 'countries');
                      }}
                    >
                      Countries
                    </Link>
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={() => toggleMobileDropdown('categories')}
                  className="w-full flex items-center justify-between text-gray-300 hover:text-gray-100 px-3 py-2 rounded-md text-base font-medium"
                >
                  Categories
                  <ChevronDown className={`w-4 h-4 transform transition-transform ${activeDropdown === 'categories' ? 'rotate-180' : ''}`} />
                </button>
                {activeDropdown === 'categories' && (
                  <div className="pl-4 space-y-2 max-h-60 overflow-y-auto">
                    {categories.map((category) => (
                      <Link
                        key={category.Category_ID}
                        to={`/search?category=${category.Category_ID}`}
                        className="block px-3 py-2 text-gray-300 hover:text-[#F4A024]"
                        onClick={() => {
                          closeMobileMenu();
                          trackNavigation('mobile_category', category.Category_Title);
                        }}
                      >
                        {category.Category_Title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                to="/about"
                className="block px-3 py-2 text-gray-300 hover:text-gray-100 rounded-md text-base font-medium"
                onClick={() => {
                  closeMobileMenu();
                  trackNavigation('mobile_menu', 'about');
                }}
              >
                About
              </Link>
            </div>
          </div>
        )}
      </nav>

      <SearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}