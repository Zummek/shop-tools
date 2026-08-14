import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import {
  ChannelPriceSchedule,
  UpdatePriceSchedulePayload,
} from '../types/priceSchedules';

import { priceSchedulesQueryKeyBase } from './useGetPriceSchedules';

const endpoint = (id: number) => `/api/v1/ecommerce/price-schedules/${id}/`;

export const useUpdatePriceSchedule = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, error, reset } = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdatePriceSchedulePayload;
    }) => {
      const response = await axiosInstance.patch<ChannelPriceSchedule>(
        endpoint(id),
        payload,
      );
      if (response.status === 400) 
        throw response.data;
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [priceSchedulesQueryKeyBase] });
      queryClient.invalidateQueries({ queryKey: ['product-channel-links'] });
    },
  });

  return {
    updatePriceSchedule: mutateAsync,
    isPending,
    error,
    reset,
  };
};
