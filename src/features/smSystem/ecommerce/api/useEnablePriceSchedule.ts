import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { ChannelPriceSchedule } from '../types/priceSchedules';

import { priceSchedulesQueryKeyBase } from './useGetPriceSchedules';

const endpoint = (id: number) =>
  `/api/v1/ecommerce/price-schedules/${id}/enable/`;

export const useEnablePriceSchedule = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (id: number) => {
      const response = await axiosInstance.post<
        ChannelPriceSchedule & { applyPending?: boolean; applyError?: string }
      >(endpoint(id));
      if (response.status === 400) throw response.data;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [priceSchedulesQueryKeyBase] });
      queryClient.invalidateQueries({ queryKey: ['product-channel-links'] });
    },
  });

  return {
    enablePriceSchedule: mutateAsync,
    isPending,
  };
};
