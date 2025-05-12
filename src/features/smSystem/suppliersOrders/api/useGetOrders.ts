import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { axiosInstance } from '../../../../services';
import { emptyListResponse, ListResponse, Order } from '../../app/types/index';

export type GetOrdersResponse = ListResponse<Order>;

const endpoint = '/api/v1/suppliers-orders/orders/';

export const useGetOrders = () => {
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  const getOrdersRequest = async () => {
    const response = await axiosInstance.get<GetOrdersResponse>(endpoint, {
      params: {
        page,
        pageSize,
      },
    });

    return response.data || emptyListResponse;
  };

  const {
    data: orders,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['orders', { page, pageSize }],
    queryFn: getOrdersRequest,
  });

  return {
    orders,
    isLoading,
    refetch,
    pageSize,
    setPageSize,
    page,
    setPage,
  };
};
