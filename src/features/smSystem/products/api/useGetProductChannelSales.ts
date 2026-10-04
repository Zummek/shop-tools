import { useQuery } from '@tanstack/react-query';

import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../services';
import { ProductChannelSales } from '../types';

const endpoint = (productId: number) =>
  `/api/v1/products/${productId}/channel-sales/`;

export const useGetProductChannelSales = (
  productId: number | undefined,
  startDate: string,
  endDate: string,
  enabled: boolean,
) => {
  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['product-channel-sales', productId, startDate, endDate],
    enabled: enabled && !!productId,
    queryFn: async () => {
      const response = await axiosInstance.get<ProductChannelSales>(
        endpoint(productId!),
        { params: { startDate, endDate } },
      );
      if (response.status >= 400) throwAxiosErrorFromResponse(response);
      return response.data;
    },
  });

  return {
    sales: data,
    isLoading,
    isFetching,
    isError,
  };
};
