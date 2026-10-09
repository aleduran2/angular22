import { Product } from '@shop/shared';

export type StockLevel = 'available' | 'low' | 'out';

const LOW_STOCK_THRESHOLD = 3;

export function stockLevel(product: Pick<Product, 'stock'>): StockLevel {
  if (product.stock <= 0) return 'out';
  return product.stock <= LOW_STOCK_THRESHOLD ? 'low' : 'available';
}
