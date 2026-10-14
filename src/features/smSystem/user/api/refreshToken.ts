import { AxiosRequestConfig } from 'axios';

import { axiosInstance } from '../../../../services';

interface RefreshTokenPayload {
  refreshToken: string;
}

interface RefreshTokenResponse {
  access: string | undefined;
  refresh: string | undefined;
  accessExpiration: string;
  refreshExpiration: string;
}

interface RefreshTokenProcessedResponse {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  accessExpiration: string;
  refreshExpiration: string;
}

const endpoint = '/api/v1/auth/token/refresh/';

export const skipSessionLogoutOnRefresh = {
  skipSessionLogout: true,
} as AxiosRequestConfig & { skipSessionLogout: true };

export const refreshToken = async ({
  refreshToken,
}: RefreshTokenPayload): Promise<RefreshTokenProcessedResponse> => {
  const response = await axiosInstance.post<RefreshTokenResponse>(
    endpoint,
    { refresh: refreshToken },
    skipSessionLogoutOnRefresh,
  );

  return {
    accessToken: response.data.access,
    refreshToken: response.data.refresh,
    accessExpiration: response.data.accessExpiration,
    refreshExpiration: response.data.refreshExpiration,
  };
};
