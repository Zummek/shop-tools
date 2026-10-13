import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../services';
import {
  PriceScheduleBulkCreateResponse,
  PriceScheduleWindow,
} from '../types/priceSchedules';

import { invalidatePriceScheduleQueries } from './useGetPriceSchedules';

const endpoint = '/api/v1/ecommerce/price-schedules/bulk-create/';

export interface BulkCreatePriceScheduleDraftsPayload {
  linkIds: number[];
  windows: PriceScheduleWindow[];
}

export const useBulkCreatePriceScheduleDrafts = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (payload: BulkCreatePriceScheduleDraftsPayload) => {
      const response = await axiosInstance.post<PriceScheduleBulkCreateResponse>(
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
    bulkCreatePriceScheduleDrafts: mutateAsync,
    isPending,
  };
};
