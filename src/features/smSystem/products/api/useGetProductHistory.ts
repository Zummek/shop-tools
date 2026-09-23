import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { ProductHistory, ProductHistoryDays } from '../types';

const endpoint = (productId: number) =>
  `/api/v1/products/${productId}/history/`;

export const getProductHistoryQueryKey = (
  productId: number,
  days: ProductHistoryDays,
) => ['product-history', productId, days];

export const useGetProductHistory = (
  productId: number | undefined,
  days: ProductHistoryDays,
) => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: getProductHistoryQueryKey(productId ?? 0, days),
    queryFn: () =>
      axiosInstance.get<ProductHistory>(endpoint(productId!), {
        params: { days },
      }),
    enabled: !!productId,
  });

  return {
    history: data?.data,
    isLoading,
    isError,
    refetch,
  };
};
