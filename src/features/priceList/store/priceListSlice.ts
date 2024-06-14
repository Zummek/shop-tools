import { createSlice } from '@reduxjs/toolkit';

import { PriceType, Product } from '../types/product';
import { calcPricePerFullUnit } from '../utils/price';

interface PriceListState {
  fileName: string | null;
  priceType: PriceType;
  products: Product[];
}

const initialState: PriceListState = {
  fileName: null,
  products: [],
  priceType: PriceType.detaliczna,
};

interface SetProductsPayload {
  fileName: string;
  products: Product[];
}

interface UpdateProductPayload {
  index: number;
  product: Product;
}

export const priceListSlice = createSlice({
  name: 'priceList',
  initialState,
  reducers: {
    setPriceType: (state, action: { payload: PriceType }) => {
      state.priceType = action.payload;
      state.products = state.products.map((product) => ({
        ...product,
        pricePerFullUnit: calcPricePerFullUnit({
          price: product.prices[action.payload],
          productSizeInUnit: product.productSizeInUnit,
          unit: product.unit,
          unitScale: product.unitScale,
        }),
      }));
    },
    setProducts: (state, action: { payload: SetProductsPayload }) => {
      state.fileName = action.payload.fileName;
      state.products = action.payload.products;
    },
    updateProduct: (state, action: { payload: UpdateProductPayload }) => {
      state.products[action.payload.index] = action.payload.product;
    },
  },
});

export const { setProducts, updateProduct, setPriceType } =
  priceListSlice.actions;
