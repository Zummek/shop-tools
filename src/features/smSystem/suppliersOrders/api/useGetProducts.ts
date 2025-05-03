import { useInfiniteQuery, QueryFunctionContext } from '@tanstack/react-query';
import { useCallback } from 'react';

import { axiosInstance } from '../../../../services';
import { EMPTY_LIST_RESPONSE, ListResponse, Product } from '../../app/types/index';

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
            page_size: pageSize,
          },
          signal,
        });

        return response.data || EMPTY_LIST_RESPONSE;
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
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
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
