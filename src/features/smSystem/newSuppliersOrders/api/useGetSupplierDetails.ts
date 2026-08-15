import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { axiosInstance } from '../../../../services';
import { SupplierDetails } from '../types';

export type GetSupplierDetailsResponse = SupplierDetails;

export const getV2SupplierDetailsQueryKey = (id: number) => [
  'v2-supplierDetails',
  id,
];

export const useGetSupplierDetails = (id: number) => {
  const endpoint = `api/v1/suppliers-orders/suppliers/${id}/`;

  const getSupplierDetailsRequest = useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      const response = await axiosInstance.get<GetSupplierDetailsResponse>(
        endpoint,
        { signal },
      );
      return response.data || null;
    },
    [endpoint],
  );

  const { data, isLoading, isError, refetch } = useQuery<
    GetSupplierDetailsResponse,
    Error
  >({
    queryKey: getV2SupplierDetailsQueryKey(id),
    queryFn: getSupplierDetailsRequest,
    enabled: id > 0,
    refetchOnWindowFocus: false,
  });

  return {
    data,
    isLoading,
    isError,
    refetch,
  };
};
