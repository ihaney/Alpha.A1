import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { analytics } from '../lib/analytics';
import { supabase } from '../lib/supabase';

interface TourStep {
  path: string;
  element: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface TourData {
  productId: string;
  supplierId: string;
}

export default function TourGuide() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourData, setTourData] = useState<TourData | null>(null);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('tourDismissed') === 'true';
  });
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch a sample product and its supplier for the tour
  const fetchTourData = async () => {
    try {
      const { data: product } = await supabase
        .from('Products')
        .select(`
          Product_ID,
          Supplier (Supplier_Title)
        `)
        .limit(1)
        .single();

      if (product) {
        setTourData({
          productId: product.Product_ID,
          supplierId: product.Supplier.Supplier_Title
        });
        return { productId: product.Product_ID, supplierId: product.Supplier.Supplier_Title };
      }
    } catch (error) {
      console.error('Error fetching tour data:', error);
    }
    return null;
  };

  const getTourSteps = (data: TourData | null): TourStep[] => [
    {
      path: '/',
      element: '',
      title: 'Take a Tour',
      description: 'Learn how to navigate and find our products',
      position: 'bottom'
    },
    // ... other steps unchanged ...
  ];

  useEffect(() => {
    if (isVisible) {
      const steps = getTourSteps(tourData);
      const step = steps[currentStep];
      if (step.element) {
        const element = document.querySelector(step.element);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('tour-highlight');
        }
      }
      return () => {
        document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
      };
    }
  }, [currentStep, isVisible, tourData]);

  const startTour = async () => {
    const data = await fetchTourData();
    setTourData(data);
    setIsVisible(true);
    setCurrentStep(0);
    navigate('/');
    analytics.trackEvent('tour_started');
  };

  const nextStep = () => {
    const steps = getTourSteps(tourData);
    if (currentStep < steps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      navigate(steps[next].path);
      analytics.trackEvent('tour_step_viewed', {
        props: { step: next + 1, total_steps: steps.length }
      });
    } else {
      endTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      navigate(getTourSteps(tourData)[prev].path);
    }
  };

  const endTour = () => {
    setIsVisible(false);
    setTourData(null);
    analytics.trackEvent('tour_completed');
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
  };

  const dismissTour = () => {
    setIsDismissed(true);
    localStorage.setItem('tourDismissed', 'true');
    analytics.trackEvent('tour_dismissed');
  };

  // When dismissed or not visible, show the trigger with overlay X
  if (isDismissed || !isVisible) {
    return isDismissed ? null : (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="relative inline-block">
          <button
            onClick={startTour}
            className="bg-[#F4A024] text-gray-900 px-4 py-2 rounded-full shadow-lg hover:bg-[#F4A024]/90 transition-colors"
          >
            Take a Tour
          </button>
          <button
            onClick={dismissTour}
            className="absolute -top-2 -right-2 bg-gray-800 text-gray-300 p-1 rounded-full shadow-lg hover:bg-gray-700 focus:outline-none"
            aria-label="Dismiss tour button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const steps = getTourSteps(tourData);
  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-black/50" />
      <div className="pointer-events-auto fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <button
          onClick={endTour}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
          aria-label="Close tour modal"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">{step.title}</h3>
          <p className="text-gray-300">{step.description}</p>
          <div className="flex items-center justify-between pt-4">
            <div className="flex gap-2">
              {Array.from({ length: steps.length }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full ${idx === currentStep ? 'bg-[#F4A024]' : 'bg-gray-600'}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={prevStep}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Previous
                </button>
              )}
              <button
                onClick={nextStep}
                className="bg-[#F4A024] text-gray-900 px-4 py-2 rounded-md hover:bg-[#F4A024]/90 transition-colors"
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
