export interface Product {
  id: string;
  name: string;
  Product_Price: string;
  image: string;
  country: string;
  category: string;
  supplier: string;
  Product_MOQ: string;
  sourceUrl: string;
  marketplace: string;
}

export interface Supplier {
  id: string;
  name: string;
  description: string;
  website: string;
  country: string;
  address: string;
  email: string;
  phone: string;
  products: Product[];
}

export type Category = {
  id: string;
  name: string;
  description: string;
}