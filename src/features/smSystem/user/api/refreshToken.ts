import { axiosInstance } from '../../../../services';

interface RefreshTokenPayload {
  refreshToken: string;
}

interface RefreshTokenResponse {
  access: string | undefined;
}

interface RefreshTokenProcessedResponse {
  accessToken: string | undefined;
}

const endpoint = '/api/v1/auth/token/refresh/';

export const refreshToken = async ({
  refreshToken,
}: RefreshTokenPayload): Promise<RefreshTokenProcessedResponse> => {
  const response = await axiosInstance.post<RefreshTokenResponse>(endpoint, {
    refresh: refreshToken,
  });

  return {
    accessToken: response.data.access,
  };
};
