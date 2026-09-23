import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { ProductDaySales } from '../types';

const endpoint = (productId: number) =>
  `/api/v1/products/${productId}/history/sales/`;

export const getProductDaySalesQueryKey = (
  productId: number,
  date: string,
  branchId: number,
) => ['product-day-sales', productId, date, branchId];

export const useGetProductDaySales = (
  productId: number | undefined,
  date: string | undefined,
  branchId: number | undefined,
  enabled: boolean,
) => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: getProductDaySalesQueryKey(
      productId ?? 0,
      date ?? '',
      branchId ?? 0,
    ),
    queryFn: () =>
      axiosInstance.get<ProductDaySales>(endpoint(productId!), {
        params: { date, branchId },
      }),
    enabled: enabled && !!productId && !!date && !!branchId,
  });

  return {
    daySales: data?.data,
    isLoading,
    isError,
    refetch,
  };
};
