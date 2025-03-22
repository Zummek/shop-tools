import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { axiosInstance } from '../../../../services';
import { EMPTY_LIST_RESPONSE, ListResponse, Supplier } from '../../app/types/index';

export type GetSuppliersResponse = ListResponse<Supplier>;

const endpoint = '/api/v1/suppliers-orders/suppliers/';

export const useGetSuppliers = () => {

  const getSuppliersRequest = useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const response = await axiosInstance.get<GetSuppliersResponse>(endpoint, {
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

  const { data, isLoading, isError, refetch } = useQuery<GetSuppliersResponse, Error>({
    queryKey: ['suppliers'],
    queryFn: getSuppliersRequest,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  });

  const suppliers = useMemo(
    () => data?.results || [],
    [data]
  );
  return {
    suppliers,
    isLoadingS: isLoading,
    isErrorS: isError,
    refetch,
  };
};
