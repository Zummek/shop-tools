import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

interface Response {
  id: number;
  organizationName: string;
  allegroUserId: string;
  allegroUserLogin: string;
  isActive: boolean;
  isConnected: boolean;
  tokenExpiresAt: string;
  createdAt: string;
  updatedAt: string;
}

const endpoint = '/api/v1/ecommerce/allegro/connection/';
export const allegroConnectionQueryKey = ['allegro-connection'];

export const useGetAllegroConnection = () => {
  const { data, isLoading } = useQuery({
    queryKey: allegroConnectionQueryKey,
    queryFn: () => axiosInstance.get<Response>(endpoint),
  });

  const allegroConnection = data?.data;

  return { allegroConnection, isLoading };
};
