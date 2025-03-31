import { createSlice } from '@reduxjs/toolkit';

import { PrepareImportProductsResponse } from '../api';
import { ImportProductPreparedProduct } from '../types';

interface SmImportProductsState {
  productsFile: File | null;
  productsImportTaskId: number | null;
  productsToCreateAmount: number;
  productsToUpdateAmount: number;
  productsNotListedAmount: number;
  productsNotListed: ImportProductPreparedProduct[];
  productIdsToRemove: number[];
}

const initialState: SmImportProductsState = {
  productsFile: null,
  productsImportTaskId: null,
  productsToCreateAmount: 0,
  productsToUpdateAmount: 0,
  productsNotListedAmount: 0,
  productsNotListed: [],
  productIdsToRemove: [],
};

interface SetFilePayload {
  productsFile: File;
}

export const smImportProductsSlice = createSlice({
  name: 'SmImportProducts',
  initialState,
  reducers: {
    clearStateAndSetNewFile: (state, action: { payload: SetFilePayload }) => {
      state.productsFile = action.payload.productsFile;
      state.productsNotListed = [];
      state.productsToCreateAmount = 0;
      state.productsToUpdateAmount = 0;
      state.productsNotListedAmount = 0;
      state.productIdsToRemove = [];
    },
    loadPreparedImport: (
      state,
      action: { payload: PrepareImportProductsResponse }
    ) => {
      state.productsNotListed = action.payload.summary.productsNotListed;
      state.productsToCreateAmount =
        action.payload.summary.productsToCreateAmount;
      state.productsToUpdateAmount =
        action.payload.summary.productsToUpdateAmount;
      state.productsNotListedAmount =
        action.payload.summary.productsNotListedAmount;
      state.productsImportTaskId = action.payload.id;
    },
    setProductsIdsToRemove: (state, action: { payload: number[] }) => {
      state.productIdsToRemove = action.payload;
    },
  },
});

export const {
  clearStateAndSetNewFile,
  loadPreparedImport,
  setProductsIdsToRemove,
} = smImportProductsSlice.actions;
