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

interface UpdatePricesAndAddMissingProductsPayload {
  products: Product[];
}

interface OverwriteProductsPayload {
  products: Product[];
}

export const priceListSlice = createSlice({
  name: 'priceList',
  initialState,
  reducers: {
    setPriceListData: (state, action: { payload: PriceListState }) => {
      state.products = initialState.products;
      state.fileName = action.payload.fileName;
      state.products = action.payload.products;
      state.priceType = action.payload.priceType;
    },
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
    updatePricesAndAddMissingProducts: (
      state,
      action: { payload: UpdatePricesAndAddMissingProductsPayload }
    ) => {
      // update prices of existing products by id
      // ignore products that are not in the list
      // Add missing products
      const products = action.payload.products;
      const existingProducts = state.products;
      const newProducts: Product[] = [];
      products.forEach((product) => {
        const existingProduct = existingProducts.find(
          (existingProduct) => existingProduct.id === product.id
        );
        if (existingProduct) {
          existingProduct.prices = product.prices;
          existingProduct.pricePerFullUnit = calcPricePerFullUnit({
            price: product.prices[state.priceType],
            productSizeInUnit: existingProduct.productSizeInUnit,
            unit: existingProduct.unit,
            unitScale: existingProduct.unitScale,
          });
        } else {
          newProducts.push({
            ...product,
            pricePerFullUnit: calcPricePerFullUnit({
              price: product.prices[state.priceType],
              productSizeInUnit: product.productSizeInUnit,
              unit: product.unit,
              unitScale: product.unitScale,
            }),
          });
        }
      });
      state.products = [...existingProducts, ...newProducts];
    },
    setProducts: (state, action: { payload: SetProductsPayload }) => {
      state.fileName = action.payload.fileName;
      state.products = action.payload.products;
    },
    updateProduct: (state, action: { payload: UpdateProductPayload }) => {
      state.products[action.payload.index] = action.payload.product;
    },
    overwriteProducts: (
      state,
      action: { payload: OverwriteProductsPayload }
    ) => {
      state.products = action.payload.products;
    },
  },
});

export const {
  setPriceListData,
  setProducts,
  updateProduct,
  setPriceType,
  updatePricesAndAddMissingProducts,
  overwriteProducts,
} = priceListSlice.actions;
