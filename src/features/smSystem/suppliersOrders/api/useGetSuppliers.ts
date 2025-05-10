import { QueryFunctionContext, useInfiniteQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { axiosInstance } from '../../../../services';
import { emptyListResponse, ListResponse, Supplier } from '../../app/types/index';

export type GetSuppliersResponse = ListResponse<Supplier>;

const endpoint = '/api/v1/suppliers-orders/suppliers/';
const pageSize = 25;

type QueryParams = {
  name?: string;
};

export const useGetSuppliers = (name?: string) => {
  const getSuppliersRequest = useCallback(
    async ({ pageParam = 1, signal, queryKey }: QueryFunctionContext) => {
      const [, params] = queryKey as [string, QueryParams];

      try {
        const response = await axiosInstance.get<GetSuppliersResponse>(endpoint, {
          params: {
            page: pageParam,
            pageSize,
            name: params?.name,
          },
          signal,
        });

        return response.data || emptyListResponse;
      } catch (err) {
        console.error('Error fetching suppliers:', err);
        throw err;
      }
    },
    []
  );

  const getNextPageParam = useCallback(
    (lastPage: GetSuppliersResponse) => {
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
  } = useInfiniteQuery<GetSuppliersResponse, Error>({
    queryKey: ['suppliers', { name }],
    queryFn: getSuppliersRequest,
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
    refetch,
    name
  };
};
