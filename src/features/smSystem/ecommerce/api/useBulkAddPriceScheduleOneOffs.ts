import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../services';
import { PriceScheduleOneOffBulkResponse } from '../types/priceSchedules';

import { invalidatePriceScheduleQueries } from './useGetPriceSchedules';

const endpoint = '/api/v1/ecommerce/price-schedules/one-offs/';

export interface BulkAddPriceScheduleOneOffsPayload {
  /** Schedule ids. They only choose the offers. */
  ids: number[];
  /** Naive Europe/Warsaw wall time, `YYYY-MM-DDTHH:mm:ss`. */
  startsAt: string;
  endsAt: string;
  label?: string;
}

export const useBulkAddPriceScheduleOneOffs = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (payload: BulkAddPriceScheduleOneOffsPayload) => {
      const response = await axiosInstance.post<PriceScheduleOneOffBulkResponse>(
        endpoint,
        payload,
      );
      if (response.status >= 400) throwAxiosErrorFromResponse(response);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.results.length === 0) return;
      return invalidatePriceScheduleQueries(queryClient);
    },
  });

  return {
    bulkAddPriceScheduleOneOffs: mutateAsync,
    isPending,
  };
};
