import { Store } from '@reduxjs/toolkit';
import axios from 'axios';
import applyCaseMiddleware from 'axios-case-converter';

import { smApiUrl } from '../utils';

let store: Store;

export const setReduxStoreForAxios = (reduxStore: Store) => {
  store = reduxStore;

  store.subscribe(() => {
    updateTokenInterceptor();
  });

  updateTokenInterceptor();
};

export const updateTokenInterceptor = () => {
  return new Promise<void>((resolve) => {
    const accessToken = store.getState().smSystemUser.accessToken;
    axiosInstance.defaults.headers.common.Authorization = accessToken
      ? `Bearer ${accessToken}`
      : undefined;
    resolve();
  });
};

export const axiosInstance = applyCaseMiddleware(
  axios.create({
    baseURL: smApiUrl,
    headers: {},
    validateStatus: (status: number) => {
      return (status >= 200 && status < 300) || status === 404;
    },
    timeout: 30000, // 30 seconds
  })
);
