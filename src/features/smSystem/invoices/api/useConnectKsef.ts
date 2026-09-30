import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../services';

import { KsefConnection, ksefConnectionQueryKey } from './useGetKsefConnection';

const endpoint = '/api/v1/invoices/ksef/connection/';

interface ConnectKsefPayload {
  nip: string;
  token: string;
}

export const useConnectKsef = () => {
  const queryClient = useQueryClient();

  const connectKsefRequest = async (payload: ConnectKsefPayload) => {
    const response = await axiosInstance.put<
      KsefConnection | { error: string }
    >(endpoint, payload);
    if (response.status < 200 || response.status >= 300)
      throwAxiosErrorFromResponse(response);
    return response.data as KsefConnection;
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: connectKsefRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ksefConnectionQueryKey });
    },
  });

  return {
    connectKsef: mutateAsync,
    isPending,
  };
};
