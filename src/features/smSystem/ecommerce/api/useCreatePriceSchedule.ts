import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../services';
import {
  ChannelPriceSchedule,
  PriceSchedulePayload,
} from '../types/priceSchedules';

import { invalidatePriceScheduleQueries } from './useGetPriceSchedules';

const endpoint = '/api/v1/ecommerce/price-schedules/';

export const useCreatePriceSchedule = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, error, reset } = useMutation({
    mutationFn: async (payload: PriceSchedulePayload) => {
      const response = await axiosInstance.post<ChannelPriceSchedule>(
        endpoint,
        payload,
      );
      if (response.status === 400) throwAxiosErrorFromResponse(response);

      return response.data;
    },
    onSuccess: () => invalidatePriceScheduleQueries(queryClient),
  });

  return {
    createPriceSchedule: mutateAsync,
    isPending,
    error,
    reset,
  };
};
