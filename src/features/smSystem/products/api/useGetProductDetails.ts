import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { Product } from '../types';

const endpoint = (productId: number) => `/api/v1/products/${productId}/`;

export const getProductDetailsQueryKey = (productId: number) => [
  'product-details',
  productId,
];

export const useGetProductDetails = (productId: number | undefined) => {
  const { data, isLoading, isSuccess, refetch } = useQuery({
    queryKey: getProductDetailsQueryKey(productId ?? 0),
    queryFn: () => axiosInstance.get<Product>(endpoint(productId!)),
    enabled: !!productId,
  });

  return {
    product: data?.status === 200 ? data.data : undefined,
    isMissing: !!productId && isSuccess && data?.status === 404,
    isLoading,
    refetch,
  };
};
