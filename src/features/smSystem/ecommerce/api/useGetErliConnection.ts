import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

export interface ErliConnection {
  id?: number;
  organizationName?: string;
  shopId: number | null;
  shopName: string | null;
  maskedApiKey: string | null;
  isActive?: boolean;
  isConnected: boolean;
  createdAt?: string;
  updatedAt?: string;
  message?: string;
}

const endpoint = '/api/v1/ecommerce/erli/connection/';
export const erliConnectionQueryKey = ['erli-connection'];

export const useGetErliConnection = () => {
  const { data, isLoading } = useQuery({
    queryKey: erliConnectionQueryKey,
    queryFn: () => axiosInstance.get<ErliConnection>(endpoint),
  });

  const erliConnection = data?.data;

  return { erliConnection, isLoading };
};
