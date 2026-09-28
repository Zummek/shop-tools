import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../services';
import { DeliveryGroupCatalog } from '../types';

import { deliveryGroupsQueryKey } from './useGetDeliveryGroups';

const endpoint = (id: number) => `/api/v1/ecommerce/delivery-groups/${id}/`;

export const useUpdateDeliveryGroup = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({
      id,
      sellerShippingCostCents,
    }: {
      id: number;
      sellerShippingCostCents: number | null;
    }) => {
      const response = await axiosInstance.patch<DeliveryGroupCatalog>(
        endpoint(id),
        { sellerShippingCostCents },
      );
      if (response.status === 400) throwAxiosErrorFromResponse(response);
      return response.data;
    },
    onSuccess: (catalog) => {
      queryClient.setQueryData(deliveryGroupsQueryKey, catalog);
      queryClient.invalidateQueries({ queryKey: ['allegroPriceSim'] });
    },
  });

  return {
    updateDeliveryGroup: mutateAsync,
    isPending,
  };
};
