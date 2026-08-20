import { QueryClient, useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { axiosInstance } from '../../../../services';
import {
  emptyListResponse,
  ListResponse,
  PaginationState,
} from '../../app/types';
import { Order } from '../types';

export type GetOrdersResponse = ListResponse<Order>;

export const getV2OrdersQueryKeyBase = 'v2-orders';
const endpoint = '/api/v1/suppliers-orders/v2/orders/';

export const patchV2OrdersListCache = (
  queryClient: QueryClient,
  orderId: number,
  patch: Partial<Order>,
) => {
  queryClient.setQueriesData<GetOrdersResponse>(
    { queryKey: [getV2OrdersQueryKeyBase] },
    (old) => {
      if (!old?.results) return old;
      return {
        ...old,
        results: old.results.map((order) =>
          order.id === orderId ? { ...order, ...patch } : order,
        ),
      };
    },
  );
};

export const useGetOrders = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    pageSize: 25,
  });

  const getOrdersRequest = useCallback(async () => {
    const response = await axiosInstance.get<GetOrdersResponse>(endpoint, {
      params: {
        page: pagination.page + 1,
        pageSize: pagination.pageSize,
      },
    });

    return response.data || emptyListResponse;
  }, [pagination]);

  const {
    data: orders,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [getV2OrdersQueryKeyBase, pagination],
    queryFn: getOrdersRequest,
    placeholderData: (previousData) => previousData,
  });

  return {
    orders,
    isLoading: isLoading || isFetching,
    refetch,
    pagination,
    setPagination,
  };
};
