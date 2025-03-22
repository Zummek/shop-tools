import { Store } from '@reduxjs/toolkit';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import get from 'lodash/get';
import { ReactNode, useEffect } from 'react';

import { useLogoutUser } from '../features/smSystem/user/hooks';
import { useAppSelector, useNotify } from '../hooks';

import { axiosInstance } from './axiosInstance';

interface AxiosInterceptorsProviderProps {
  store: Store;
  children: ReactNode;
}

type APIError = AxiosError & {
  config: AxiosRequestConfig & {
    _retry?: boolean;
  };
};

const standardErrorMsgKey = 'Wystąpił błąd, spróbuj ponownie';

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

  const isCurrentSessionExist = accessToken !== null;
  const axiosResponse = axiosInstance.interceptors.response;

  useEffect(() => {
    const responseInterceptor = async (response: AxiosResponse) => {
      return response;
    };

    const errorInterceptor = async (error: APIError) => {
      const originalRequest = error.config;
      const httpCode = get(error, 'response.status');

      if (
        httpCode === 401 &&
        !originalRequest._retry &&
        originalRequest.url &&
        !originalRequest.url.endsWith('auth/token/refresh/')
      ) {
        originalRequest._retry = true;

        // Not implemented on BE
        // const accessToken = await refreshToken();
        // if (accessToken) {
        //   originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        //   return axiosInstance(originalRequest);
        // }

        logoutUser(isCurrentSessionExist);
        throw error;
      } else if (httpCode === 401) {
        logoutUser(isCurrentSessionExist);
        throw error;
      }

      if (httpCode !== 400) {
        const errorMessage = getResponseErrorsMessageMsg(error);

        if (errorMessage === null) return;

        notify('error', errorMessage);

        // if (standardErrorMsgKey === errorKey) {
        // captureError({
        //   httpCode,
        //   errorCode: error.code,
        //   errorMessage: error.message,
        //   errorStack: error.stack,
        //   requestBody: JSON.stringify(error.config.data),
        //   response: JSON.stringify(error.response?.data),
        // });
        // }
      }

      throw error;
    };

    const responseInterceptors = axiosResponse.use(
      responseInterceptor,
      errorInterceptor
    );

    return () => {
      axiosResponse.eject(responseInterceptors);
    };
  }, [axiosResponse, isCurrentSessionExist, logoutUser, notify, store]);

  return <>{children}</>;
};
