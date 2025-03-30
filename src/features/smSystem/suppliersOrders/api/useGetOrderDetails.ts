import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { axiosInstance } from '../../../../services';
import { OrderDetails } from '../../app/types/index';

export type GetOrderDetailsResponse = OrderDetails;

export const useGetOrderDetails = (id: number) => {
  const endpoint = `api/v1/suppliers-orders/orders/${id}/`

  const getOrderDetailsRequest = useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const response = await axiosInstance.get<GetOrderDetailsResponse>(endpoint, {
          signal,
        });
        return response.data || null;
      } catch (err) {
        console.error('Error fetching order details:', err);
        throw err;
      }
    },
    [endpoint]
  );

  const { data, isLoading, isError, refetch } = useQuery<GetOrderDetailsResponse, Error>({
    queryKey: ['orderDetails', id],
    queryFn: getOrderDetailsRequest,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  });

  const orderDetails = useMemo(
    () => data || null,
    [data]
  );
  return {
    orderDetails,
    isLoading,
    isError,
    refetch,
  };
};
