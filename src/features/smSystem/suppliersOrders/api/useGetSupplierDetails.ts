import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { axiosInstance } from '../../../../services';
import { SupplierDetails } from '../types';

export type GetSupplierDetailsResponse = SupplierDetails;

export const useGetSupplierDetails = (id: number) => {
  const endpoint = `api/v1/suppliers-orders/suppliers/${id}/`;

  const getSupplierDetailsRequest = useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      try {
        const response = await axiosInstance.get<GetSupplierDetailsResponse>(
          endpoint,
          {
            signal,
          }
        );
        return response.data || null;
      } catch (err) {
        console.error('Error fetching supplier details:', err);
        throw err;
      }
    },
    [endpoint]
  );

  const { data, isLoading, isError, refetch } = useQuery<
    GetSupplierDetailsResponse,
    Error
  >({
    queryKey: ['supplierDetails', id],
    queryFn: getSupplierDetailsRequest,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  return {
    data,
    isLoading,
    isError,
    refetch,
  };
};
