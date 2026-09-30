import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../services';

import { ksefConnectionQueryKey } from './useGetKsefConnection';

const endpoint = '/api/v1/invoices/ksef/connection/';

export const useDisconnectKsef = () => {
  const queryClient = useQueryClient();

  const disconnectKsefRequest = async () => {
    const response = await axiosInstance.delete(endpoint);
    if (response.status < 200 || response.status >= 300)
      throwAxiosErrorFromResponse(response);
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: disconnectKsefRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ksefConnectionQueryKey });
    },
  });

  return {
    disconnectKsef: mutateAsync,
    isPending,
  };
};
