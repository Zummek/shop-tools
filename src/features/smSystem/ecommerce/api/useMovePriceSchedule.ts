import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../services';
import { ChannelPriceSchedule } from '../types/priceSchedules';

import { invalidatePriceScheduleQueries } from './useGetPriceSchedules';

const endpoint = (id: number) =>
  `/api/v1/ecommerce/price-schedules/${id}/move/`;

export const useMovePriceSchedule = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({ id, linkId }: { id: number; linkId: number }) => {
      const response = await axiosInstance.post<ChannelPriceSchedule>(
        endpoint(id),
        { linkId },
      );
      if (response.status >= 400) throwAxiosErrorFromResponse(response);
      return response.data;
    },
    onSuccess: () => invalidatePriceScheduleQueries(queryClient),
  });

  return {
    movePriceSchedule: mutateAsync,
    isPending,
  };
};
