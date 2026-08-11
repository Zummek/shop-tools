import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

import { erliConnectionQueryKey } from './useGetErliConnection';

const endpoint = '/api/v1/ecommerce/erli/connection/';

export const useErliDisconnect = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: disconnectErli, isPending } = useMutation({
    mutationFn: () => axiosInstance.delete(endpoint),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: erliConnectionQueryKey,
      });
    },
  });

  return { disconnectErli, isPending };
};
