import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

import { invalidatePriceScheduleQueries } from './useGetPriceSchedules';

const endpoint = (id: number) => `/api/v1/ecommerce/price-schedules/${id}/`;

export const useDeletePriceSchedule = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (id: number) => {
      await axiosInstance.delete(endpoint(id));
    },
    onSuccess: () => invalidatePriceScheduleQueries(queryClient),
  });

  return {
    deletePriceSchedule: mutateAsync,
    isPending,
  };
};
