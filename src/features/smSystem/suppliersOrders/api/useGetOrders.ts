import { useInfiniteQuery, QueryFunctionContext } from '@tanstack/react-query';
import { useCallback } from 'react';

import { axiosInstance } from '../../../../services';
import { emptyListResponse, ListResponse, Order } from '../../app/types/index';

export type GetOrdersResponse = ListResponse<Order>;

const endpoint = '/api/v1/suppliers-orders/orders/';
const pageSize = 5;

export const useGetOrders = () => {
  const getOrdersRequest = useCallback(
    async ({ pageParam = 1, signal }: QueryFunctionContext) => {
      try {
        const response = await axiosInstance.get<GetOrdersResponse>(endpoint, {
          params: {
            page: pageParam,
            pageSize,
          },
          signal,
        });

        return response.data || emptyListResponse;
      } catch (err) {
        console.error('Error fetching orders:', err);
        throw err;
      }
    },
    []
  );

  const getNextPageParam = useCallback(
    (lastPage: GetOrdersResponse) => {
      if (!lastPage?.next) return undefined;
      const url = new URL(lastPage.next);
      const nextPage = url.searchParams.get('page');
      return nextPage ? parseInt(nextPage, 10) : undefined;
    },
    []
  );

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    fetchNextPage,
    refetch
  } = useInfiniteQuery<GetOrdersResponse, Error>({
    queryKey: ['orders'],
    queryFn: getOrdersRequest,
    initialPageParam: 1,
    getNextPageParam,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  return {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    isError,
    refetch
  };
};
