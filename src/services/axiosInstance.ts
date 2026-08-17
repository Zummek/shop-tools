import { Store } from '@reduxjs/toolkit';
import axios, { AxiosError, AxiosResponse } from 'axios';
import applyCaseMiddleware from 'axios-case-converter';

import { smApiUrl } from '../utils';

/**
 * axiosInstance.validateStatus treats 400/404 as resolved. Call this when
 * those statuses should still reject as AxiosError (so React Query / Sentry
 * can filter expected client errors by status).
 */
export const throwAxiosErrorFromResponse = (response: AxiosResponse): never => {
  throw new AxiosError(
    `Request failed with status code ${response.status}`,
    response.status === 400
      ? AxiosError.ERR_BAD_REQUEST
      : AxiosError.ERR_BAD_RESPONSE,
    response.config,
    response.request,
    response,
  );
};

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
      return (
        (status >= 200 && status < 300) || status === 404 || status === 400
      );
    },
    timeout: 30000, // 30 seconds
  }),
);
