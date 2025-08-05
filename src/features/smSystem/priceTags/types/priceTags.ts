import { Product } from '../../products/types';

export interface PriceTagGroup {
  id: string;
  name: string;
  products: Product[];
}

export interface PriceTagGroupListItem {
  id: string;
  name: string;
  productsCount: number;
}
