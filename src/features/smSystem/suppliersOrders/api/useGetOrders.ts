import { useInfiniteQuery, QueryFunctionContext } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { axiosInstance } from '../../../../services';
import { EMPTY_LIST_RESPONSE, ListResponse, Order } from '../../app/types/index';

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
            page_size: pageSize,
          },
          signal,
        });
  
        return response.data || EMPTY_LIST_RESPONSE;
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
      const nextPageMatch = lastPage.next.match(/page=(\d+)/);
      return nextPageMatch ? Number(nextPageMatch[1]) : undefined;
    },
    []
  );
  
  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch
  } = useInfiniteQuery<GetOrdersResponse, Error>({
    queryKey: ['orders'],
    queryFn: getOrdersRequest,
    initialPageParam: 1,
    getNextPageParam,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  });

  const orders = useMemo(
    () => data?.pages?.flatMap((page) => page?.results || []) || [],
    [data]
  );

  return {
    orders,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch
  };
};
