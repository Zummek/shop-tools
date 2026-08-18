import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { DeliveryFilterOption } from '../types';

const endpoint = '/api/v1/ecommerce/delivery-methods/';
export const deliveryMethodsQueryKey = ['deliveryMethods'];

export const useGetDeliveryMethods = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: deliveryMethodsQueryKey,
    queryFn: async () => {
      const response =
        await axiosInstance.get<DeliveryFilterOption[]>(endpoint);
      return response.data ?? [];
    },
  });

  return {
    deliveryMethods: data ?? [],
    isLoading,
    isError,
    refetch,
  };
};
