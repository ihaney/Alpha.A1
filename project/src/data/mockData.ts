export const mockProducts = [
  {
    id: '1',
    name: 'Handwoven Mexican Blanket',
    description: 'Traditional handwoven blanket from Oaxaca, made with 100% cotton and natural dyes. Each piece is unique and tells a story of Mexican craftsmanship passed down through generations.',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&q=80',
    country: 'Mexico',
    category: 'Home & Living',
    supplier: 'Artesanías del Sur',
    moq: 10,
    sourceUrl: 'https://www.artesaniasdelsur.mx/products/oaxaca-blanket',
    marketplace: 'Mercado Libre'
  },
  {
    id: '2',
    name: 'Colombian Coffee Beans',
    description: 'Premium single-origin coffee beans from the highlands of Colombia. Medium roast with notes of chocolate, caramel, and citrus. Sourced directly from small-scale farmers.',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1587734005433-8a2fb686a4a3?auto=format&fit=crop&q=80',
    country: 'Colombia',
    category: 'Food & Beverages',
    supplier: 'Café Directo',
    moq: 20,
    sourceUrl: 'https://www.cafedirecto.co/products/premium-coffee-beans',
    marketplace: 'Alibaba'
  },
  {
    id: '3',
    name: 'Peruvian Alpaca Scarf',
    description: 'Luxurious hand-knitted alpaca wool scarf made by skilled artisans in Peru. Incredibly soft and warm, perfect for cold weather. Each piece features traditional Andean patterns.',
    price: 59.99,
    image: 'https://images.unsplash.com/photo-1601244005535-a48d21d951ac?auto=format&fit=crop&q=80',
    country: 'Peru',
    category: 'Fashion',
    supplier: 'Alpaca Textiles',
    moq: 15,
    sourceUrl: 'https://www.alpacatextiles.pe/products/handknit-scarf',
    marketplace: 'AliExpress'
  }
];

export const suppliers = [
  {
    id: '1',
    name: 'Artesanías del Sur',
    description: 'Leading manufacturer of traditional Mexican textiles, specializing in handwoven blankets and tapestries. Our artisans use time-honored techniques passed down through generations, creating unique pieces that showcase Mexican culture and craftsmanship.',
    website: 'https://www.artesaniasdelsur.mx',
    country: 'Mexico',
    address: 'Calle Principal 123, Oaxaca Centro, Oaxaca, Mexico',
    email: 'contacto@artesaniasdelsur.mx',
    phone: '+52 951 123 4567',
    products: [mockProducts[0]]
  },
  {
    id: '2',
    name: 'Café Directo',
    description: 'Direct trade coffee producer working with small-scale farmers in Colombia\'s coffee regions. We ensure fair compensation for our farmers while delivering premium quality coffee beans to the global market.',
    website: 'https://www.cafedirecto.co',
    country: 'Colombia',
    address: 'Carrera 15 #87-32, Bogotá, Colombia',
    email: 'info@cafedirecto.co',
    phone: '+57 1 234 5678',
    products: [mockProducts[1]]
  },
  {
    id: '3',
    name: 'Alpaca Textiles',
    description: 'Family-owned business specializing in premium alpaca wool products. Working directly with local communities in the Andes, we create high-quality, sustainable fashion items that combine traditional craftsmanship with modern design.',
    website: 'https://www.alpacatextiles.pe',
    country: 'Peru',
    address: 'Av. Sol 345, Cusco, Peru',
    email: 'contact@alpacatextiles.pe',
    phone: '+51 84 234 567',
    products: [mockProducts[2]]
  }
];