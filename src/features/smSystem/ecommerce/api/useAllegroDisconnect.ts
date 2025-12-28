import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

import { allegroConnectionQueryKey } from './useGetAllegroConnection';

const endpoint = '/api/v1/ecommerce/allegro/connection/';

export const useAllegroDisconnect = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: disconnectAllegro, isPending } = useMutation({
    mutationFn: () => axiosInstance.delete(endpoint),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: allegroConnectionQueryKey,
      });
    },
  });

  return { disconnectAllegro, isPending };
};
