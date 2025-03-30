import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { axiosInstance } from '../../../../services';
import { EMPTY_LIST_RESPONSE, ListResponse, Branch } from '../../app/types/index';

export type GetBranchesResponse = ListResponse<Branch>;

const endpoint = '/api/v1/organizations/branches/'

export const useGetBranches = () => {

  const getBranchesRequest = useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const response = await axiosInstance.get<GetBranchesResponse>(endpoint, {
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

  const { data, isLoading, isError, refetch } = useQuery<GetBranchesResponse, Error>({
    queryKey: ['branches'],
    queryFn: getBranchesRequest,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  });

  const branches = useMemo(
    () => data?.results || [],
    [data]
  );
  return {
    branches,
    isLoadingB: isLoading,
    isErrorB: isError,
    refetch,
  };
};
