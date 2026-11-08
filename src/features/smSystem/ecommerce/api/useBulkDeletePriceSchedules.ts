import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { axiosInstance } from '../../../../services';

import { invalidatePriceScheduleQueries } from './useGetPriceSchedules';

const endpoint = (id: number) => `/api/v1/ecommerce/price-schedules/${id}/`;

const CHUNK = 8;

export interface BulkDeletePriceSchedulesResult {
  deleted: number;
  blocked: number;
  failed: number;
}

const deleteOne = async (
  id: number,
): Promise<keyof BulkDeletePriceSchedulesResult> => {
  try {
    await axiosInstance.delete(endpoint(id));
    return 'deleted';
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 409)
      return 'blocked';
    return 'failed';
  }
};

export const useBulkDeletePriceSchedules = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (
      ids: number[],
    ): Promise<BulkDeletePriceSchedulesResult> => {
      const uniqueIds = [...new Set(ids)];
      const totals: BulkDeletePriceSchedulesResult = {
        deleted: 0,
        blocked: 0,
        failed: 0,
      };

      for (let i = 0; i < uniqueIds.length; i += CHUNK) {
        const chunk = uniqueIds.slice(i, i + CHUNK);
        const outcomes = await Promise.all(chunk.map(deleteOne));
        for (const outcome of outcomes) totals[outcome] += 1;
      }

      return totals;
    },
    onSettled: () => invalidatePriceScheduleQueries(queryClient),
  });

  return {
    bulkDeletePriceSchedules: mutateAsync,
    isPending,
  };
};
