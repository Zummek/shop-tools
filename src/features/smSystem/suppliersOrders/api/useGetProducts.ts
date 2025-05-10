import { useInfiniteQuery, QueryFunctionContext } from '@tanstack/react-query';
import { useCallback } from 'react';

import { axiosInstance } from '../../../../services';
import { emptyListResponse, ListResponse, Product } from '../../app/types/index';

export type GetProductsResponse = ListResponse<Product>;

const endpoint = '/api/v1/products/';
const pageSize = 5;

export const useGetProducts = () => {
  const getProductsRequest = useCallback(
    async ({ pageParam = 1, signal }: QueryFunctionContext) => {
      try {
        const response = await axiosInstance.get<GetProductsResponse>(endpoint, {
          params: {
            page: pageParam,
            pageSize,
          },
          signal,
        });

        return response.data || emptyListResponse;
      } catch (err) {
        console.error('Error fetching products:', err);
        throw err;
      }
    },
    []
  );

  const getNextPageParam = useCallback(
    (lastPage: GetProductsResponse) => {
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
  } = useInfiniteQuery<GetProductsResponse, Error>({
    queryKey: ['products'],
    queryFn: getProductsRequest,
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
