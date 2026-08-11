import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

export interface WooCommerceConnection {
  id?: number;
  organizationName?: string;
  storeUrl: string | null;
  storeHost: string | null;
  maskedConsumerKey: string | null;
  isActive?: boolean;
  isConnected: boolean;
  createdAt?: string;
  updatedAt?: string;
  message?: string;
}

const endpoint = '/api/v1/ecommerce/woocommerce/connection/';
export const wooCommerceConnectionQueryKey = ['woocommerce-connection'];

export const useGetWooCommerceConnection = () => {
  const { data, isLoading } = useQuery({
    queryKey: wooCommerceConnectionQueryKey,
    queryFn: () => axiosInstance.get<WooCommerceConnection>(endpoint),
  });

  const wooCommerceConnection = data?.data;

  return { wooCommerceConnection, isLoading };
};
