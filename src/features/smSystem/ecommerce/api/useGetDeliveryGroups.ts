import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { DeliveryGroupCatalog } from '../types';

const endpoint = '/api/v1/ecommerce/delivery-groups/';
export const deliveryGroupsQueryKey = ['deliveryGroups'];

export const useGetDeliveryGroups = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: deliveryGroupsQueryKey,
    queryFn: async () => {
      const response = await axiosInstance.get<DeliveryGroupCatalog>(endpoint);
      return (
        response.data ?? {
          groups: [],
          unmapped: [],
        }
      );
    },
  });

  return {
    catalog: data ?? { groups: [], unmapped: [] },
    isLoading,
    isError,
    refetch,
  };
};
