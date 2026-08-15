import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { OrderDetails } from '../types';

export const getV2OrderDetailsQueryKey = (id: number) => [
  'v2-orderDetails',
  id,
];

export const useGetOrderDetails = (id: number) => {
  const endpoint = `api/v1/suppliers-orders/v2/orders/${id}/`;

  const getOrderDetailsRequest = async () => {
    const response = await axiosInstance.get<OrderDetails>(endpoint);
    return response.data || null;
  };

  const {
    data: orderDetails,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: getV2OrderDetailsQueryKey(id),
    queryFn: getOrderDetailsRequest,
    enabled: Number.isFinite(id) && id > 0,
  });

  return {
    orderDetails,
    isLoading,
    refetch,
  };
};
