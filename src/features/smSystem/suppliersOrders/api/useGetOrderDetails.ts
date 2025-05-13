import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { OrderDetails } from '../../app/types/index';

export const useGetOrderDetails = (id: number) => {
  const endpoint = `api/v1/suppliers-orders/orders/${id}/`;

  const getOrderDetailsRequest = async () => {
    const response = await axiosInstance.get<OrderDetails>(endpoint);
    return response.data || null;
  };

  const {
    data: orderDetails,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['orderDetails', id],
    queryFn: getOrderDetailsRequest,
  });

  return {
    orderDetails,
    isLoading,
    refetch,
  };
};
