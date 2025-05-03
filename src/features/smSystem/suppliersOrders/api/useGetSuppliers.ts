import { QueryFunctionContext, useInfiniteQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useIsPage } from '../../../../hooks';
import { axiosInstance } from '../../../../services';
import { Pages } from '../../../../utils';
import { EMPTY_LIST_RESPONSE, ListResponse, Supplier } from '../../app/types/index';

export type GetSuppliersResponse = ListResponse<Supplier>;

const endpoint = '/api/v1/suppliers-orders/suppliers/';
const pageSize = 5;

type QueryParams = {
  name?: string;
};

export const useGetSuppliers = (name?: string) => {
  const isSuppliersPage = useIsPage([Pages.smSystemSuppliers]);

  const getSuppliersRequest = useCallback(
    async ({ pageParam = 1, signal, queryKey }: QueryFunctionContext) => {
      const [, params] = queryKey as [string, QueryParams];

      try {
        const response = await axiosInstance.get<GetSuppliersResponse>(endpoint, {
          params: {
            page: pageParam,
            page_size: pageSize,
            name: params?.name,
          },
          signal,
        });

        return response.data || EMPTY_LIST_RESPONSE;
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
    refetchOnWindowFocus: true,
    refetchOnMount: isSuppliersPage,
    refetchOnReconnect: true,
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
