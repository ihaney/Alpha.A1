import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock Supabase responses
export const handlers = [
  http.get('*/rest/v1/Products*', () => {
    return HttpResponse.json([
      {
        Product_ID: '1',
        Product_Title: 'Test Product',
        Product_Price: '$99.99',
        Product_Image_URL: 'https://example.com/image.jpg',
        Product_Title_URL: 'https://example.com/product',
        Product_MOQ: '10',
        Countries: { Country_Title: 'Mexico' },
        Categories: { Category_Title: 'Test Category' },
        Supplier: { Supplier_Title: 'Test Supplier' },
        Sources: { Source_Title: 'Test Source' }
      }
    ]);
  })
];

const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

//  Close server after all tests
afterAll(() => server.close());

// Reset handlers after each test
afterEach(() => server.resetHandlers());