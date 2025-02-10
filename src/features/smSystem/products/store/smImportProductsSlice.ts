import { createSlice } from '@reduxjs/toolkit';

import { ImportCategory, ImportProduct } from '../types';

interface SmImportProductsState {
  productsFile: File | null;
  notListedProducts: ImportProduct[];
  notListedCategories: ImportCategory[];
  listedProductsAmount: number;
  listedCategoriesAmount: number;
  productIdsToRemove: string[];
  categoryIdsToRemove: string[];
}

const initialState: SmImportProductsState = {
  productsFile: null,
  notListedProducts: [],
  notListedCategories: [],
  listedProductsAmount: 0,
  listedCategoriesAmount: 0,
  productIdsToRemove: [],
  categoryIdsToRemove: [],
};

interface SetFilePayload {
  productsFile: File;
}

interface LoadPreparedImportPayload {
  notListedProducts: ImportProduct[];
  notListedCategories: ImportCategory[];
  listedProductsAmount: number;
  listedCategoriesAmount: number;
}

export const smImportProductsSlice = createSlice({
  name: 'SmImportProducts',
  initialState,
  reducers: {
    clearStateAndSetNewFile: (state, action: { payload: SetFilePayload }) => {
      state.productsFile = action.payload.productsFile;
      state.notListedProducts = [];
      state.notListedCategories = [];
      state.listedProductsAmount = 0;
      state.listedCategoriesAmount = 0;
      state.productIdsToRemove = [];
      state.categoryIdsToRemove = [];
    },
    loadPreparedImport: (
      state,
      action: { payload: LoadPreparedImportPayload }
    ) => {
      state.notListedProducts = action.payload.notListedProducts;
      state.notListedCategories = action.payload.notListedCategories;
      state.listedProductsAmount = action.payload.listedProductsAmount;
      state.listedCategoriesAmount = action.payload.listedCategoriesAmount;
    },
    setProductsIdsToRemove: (state, action: { payload: string[] }) => {
      state.productIdsToRemove = action.payload;
    },
    setCategoriesIdsToRemove: (state, action: { payload: string[] }) => {
      state.categoryIdsToRemove = action.payload;
    },
  },
});

export const {
  clearStateAndSetNewFile,
  loadPreparedImport,
  setCategoriesIdsToRemove,
  setProductsIdsToRemove,
} = smImportProductsSlice.actions;
