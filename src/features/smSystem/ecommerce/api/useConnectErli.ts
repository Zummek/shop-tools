import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

import { ErliConnection, erliConnectionQueryKey } from './useGetErliConnection';

const endpoint = '/api/v1/ecommerce/erli/connection/';

export interface ConnectErliPayload {
  apiKey: string;
}

export const useConnectErli = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, error, reset } = useMutation({
    mutationFn: async (payload: ConnectErliPayload) => {
      const response = await axiosInstance.post<
        ErliConnection | { error: string }
      >(endpoint, payload);

      if (response.status < 200 || response.status >= 300) {
        const data = response.data;
        const message =
          typeof data === 'object' &&
          data !== null &&
          'error' in data &&
          typeof data.error === 'string'
            ? data.error
            : 'Nie udało się połączyć z Erli';
        throw new Error(message);
      }

      return response.data as ErliConnection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: erliConnectionQueryKey,
      });
    },
  });

  return {
    connectErli: mutateAsync,
    isPending,
    error,
    reset,
  };
};
