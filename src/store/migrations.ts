import { PriceType, Product } from '../features/priceList/types/product';

import { RootState } from './store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Migration = (state: any) => any;
type Migrations = Record<number, Migration>;

interface PreviousProduct extends Omit<Product, 'prices'> {
  price: number | null;
}

export const storeMigrations: Migrations = {
  0: (state: RootState) => state,

  // 1: Replace single price with multiple prices
  1: (state: RootState): RootState => {
    const products = state.priceList.products.map((product) => {
      const previousPrice = (product as unknown as PreviousProduct).price;

      return {
        ...product,
        prices: {
          ewidencyjna: null,
          detaliczna: null,
          hurtowa: null,
          nocna: previousPrice || null,
        },
      };
    });

    return {
      ...state,
      priceList: {
        ...state.priceList,
        priceType: PriceType.nocna,
        products,
      },
    };
  },
};
