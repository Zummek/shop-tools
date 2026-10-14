import { Store } from '@reduxjs/toolkit';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import get from 'lodash/get';
import { ReactNode, useEffect } from 'react';

import { useLogoutUser } from '../features/smSystem/user/hooks';
import { useRefreshToken } from '../features/smSystem/user/hooks/useRefreshToken';
import {
  parsePersistedSession,
  PERSIST_ROOT_KEY,
  shouldAdoptPersistedTokens,
} from '../features/smSystem/user/persistedSession';
import { setTokens } from '../features/smSystem/user/store';
import { useAppSelector, useNotify } from '../hooks';

import { isMarketplaceIntegrationRequest } from './authRequestUtils';
import { axiosInstance } from './axiosInstance';
import { isTransientQueryError, setQueryErrorNotify } from './queryRetry';

interface AxiosInterceptorsProviderProps {
  store: Store;
  children: ReactNode;
}

type APIError = AxiosError & {
  config: AxiosRequestConfig & {
    _retry?: boolean;
    skipSessionLogout?: boolean;
  };
};

const standardErrorMsgKey = 'Wystąpił błąd, spróbuj ponownie';

const isRefreshTokenRequest = (url: string | undefined) =>
  Boolean(url?.endsWith('auth/token/refresh/'));

const getResponseErrorsMessageMsg = (errorRequest: APIError) => {
  switch (errorRequest.code) {
    case AxiosError.ECONNABORTED:
      return null;
    case AxiosError.ETIMEDOUT:
    case AxiosError.ERR_NETWORK:
      return 'Błąd połączenia, spróbuj ponownie';
    default:
      break;
  }

  return standardErrorMsgKey;
};

export const AxiosInterceptorsProvider = ({
  store,
  children,
}: AxiosInterceptorsProviderProps) => {
  const { notify } = useNotify();
  const { logoutUser } = useLogoutUser();
  const accessToken = useAppSelector((state) => state.smSystemUser.accessToken);
  const user = useAppSelector((state) => state.smSystemUser.user);

  const { refreshToken } = useRefreshToken();

  const isCurrentSessionExist = accessToken !== null && user !== null;
  const axiosResponse = axiosInstance.interceptors.response;

  useEffect(() => {
    setQueryErrorNotify((message) => notify('error', message));
    return () => setQueryErrorNotify(null);
  }, [notify]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== PERSIST_ROOT_KEY) return;

      const stored = parsePersistedSession(event.newValue);
      if (!stored) return;

      const current = store.getState().smSystemUser as {
        accessToken: string | null;
        refreshToken: string | null;
        user: unknown;
      };

      if (!stored.accessToken && !stored.refreshToken) {
        if (current.accessToken || current.user) logoutUser(false);
        return;
      }

      if (shouldAdoptPersistedTokens(current.refreshToken, stored)) {
        store.dispatch(
          setTokens({
            accessToken: stored.accessToken,
            refreshToken: stored.refreshToken,
          }),
        );
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [logoutUser, store]);

  useEffect(() => {
    const responseInterceptor = async (response: AxiosResponse) => {
      return response;
    };

    const errorInterceptor = async (error: APIError) => {
      const originalRequest = error.config;
      const httpCode = get(error, 'response.status');

      if (httpCode === 401 && isRefreshTokenRequest(originalRequest?.url)) {
        if (!originalRequest?.skipSessionLogout) logoutUser(isCurrentSessionExist);
        throw error;
      }

      if (
        httpCode === 401 &&
        !originalRequest._retry &&
        originalRequest.url &&
        !isRefreshTokenRequest(originalRequest.url)
      ) {
        originalRequest._retry = true;

        const refreshedAccessToken = await refreshToken();
        if (refreshedAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${refreshedAccessToken}`;
          return axiosInstance(originalRequest);
        }

        logoutUser(isCurrentSessionExist);
        throw error;
      }

      if (
        httpCode === 401 &&
        originalRequest._retry &&
        !isMarketplaceIntegrationRequest(originalRequest.url)
      ) {
        logoutUser(isCurrentSessionExist);
        throw error;
      }

      // Post-retry 401 on marketplace integration endpoints (e.g. Allegro
      // connection expired) is not an SM session failure — do not log out.

      const method = originalRequest?.method?.toLowerCase();
      const isGetRequest = method === 'get' || method === undefined;
      if (isGetRequest && isTransientQueryError(error)) throw error;

      if (httpCode !== 400 && httpCode !== 401) {
        const errorMessage = getResponseErrorsMessageMsg(error);

        if (errorMessage !== null) notify('error', errorMessage);
      }

      throw error;
    };

    const responseInterceptors = axiosResponse.use(
      responseInterceptor,
      errorInterceptor,
    );

    return () => {
      axiosResponse.eject(responseInterceptors);
    };
  }, [
    axiosResponse,
    isCurrentSessionExist,
    logoutUser,
    notify,
    refreshToken,
    store,
  ]);

  return <>{children}</>;
};
