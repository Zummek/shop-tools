import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

const endpoint = '/api/v1/ecommerce/orders/sync/';

export interface EcommerceOrderSyncChannel {
  channel: string;
  lastSuccessAt: string | null;
}

export const useGetEcommerceOrderSync = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['ecommerceOrderSync'],
    queryFn: async () => {
      const response = await axiosInstance.get<{
        channels: EcommerceOrderSyncChannel[];
      }>(endpoint);
      return response.data.channels;
    },
    refetchInterval: 60 * 1000,
  });

  return { channels: data ?? [], isLoading };
};
