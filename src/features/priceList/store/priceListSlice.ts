import { createSlice } from '@reduxjs/toolkit';

import { Product } from '../types/product';

interface PriceListState {
  fileName: string | null;
  products: Product[];
}

const initialState: PriceListState = {
  fileName: null,
  products: [],
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
    setProducts: (state, action: { payload: SetProductsPayload }) => {
      state.fileName = action.payload.fileName;
      state.products = action.payload.products;
    },
    updateProduct: (state, action: { payload: UpdateProductPayload }) => {
      state.products[action.payload.index] = action.payload.product;
    },
  },
});

export const { setProducts, updateProduct } = priceListSlice.actions;
