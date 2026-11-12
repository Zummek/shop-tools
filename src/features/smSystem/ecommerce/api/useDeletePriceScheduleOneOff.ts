import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../services';

import { invalidatePriceScheduleQueries } from './useGetPriceSchedules';

const endpoint = (id: number) =>
  `/api/v1/ecommerce/price-schedules/one-offs/${id}/`;

export const useDeletePriceScheduleOneOff = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (id: number) => {
      const response = await axiosInstance.delete(endpoint(id));
      if (response.status >= 400) throwAxiosErrorFromResponse(response);
    },
    onSuccess: () => invalidatePriceScheduleQueries(queryClient),
  });

  return {
    deletePriceScheduleOneOff: mutateAsync,
    isPending,
  };
};
