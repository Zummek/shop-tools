import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import {
  ChannelPriceSchedule,
  PriceScheduleDisableMode,
} from '../types/priceSchedules';

import { priceSchedulesQueryKeyBase } from './useGetPriceSchedules';

const endpoint = (id: number) =>
  `/api/v1/ecommerce/price-schedules/${id}/disable/`;

export const useDisablePriceSchedule = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({
      id,
      mode,
      force,
    }: {
      id: number;
      mode: PriceScheduleDisableMode;
      force?: boolean;
    }) => {
      const response = await axiosInstance.post<
        ChannelPriceSchedule & { revertPending?: boolean; revertError?: string }
      >(endpoint(id), { mode, force });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [priceSchedulesQueryKeyBase] });
      queryClient.invalidateQueries({ queryKey: ['product-channel-links'] });
    },
  });

  return {
    disablePriceSchedule: mutateAsync,
    isPending,
  };
};
