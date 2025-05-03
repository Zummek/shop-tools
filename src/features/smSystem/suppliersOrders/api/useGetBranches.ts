import { QueryFunctionContext, useInfiniteQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { axiosInstance } from '../../../../services';
import { EMPTY_LIST_RESPONSE, ListResponse, Branch } from '../../app/types/index';

export type GetBranchesResponse = ListResponse<Branch>;

const endpoint = '/api/v1/organizations/branches/'
const pageSize = 5;

export const useGetBranches = () => {

  const getBranchesRequest = useCallback(
    async ({ pageParam = 1, signal }: QueryFunctionContext) => {
      try {
        const response = await axiosInstance.get<GetBranchesResponse>(endpoint, {
          params: {
            page: pageParam,
            page_size: pageSize,
          },
          signal,
        });
        return response.data || EMPTY_LIST_RESPONSE;
      } catch (err) {
        console.error('Error fetching branches:', err);
        throw err;
      }
    },
    []
  );

  const getNextPageParam = useCallback(
    (lastPage: GetBranchesResponse) => {
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
  } = useInfiniteQuery<GetBranchesResponse, Error>({
    queryKey: ['branches'],
    queryFn: getBranchesRequest,
    initialPageParam: 1,
    getNextPageParam,
    refetchOnWindowFocus: true,
    refetchOnMount: false,
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
