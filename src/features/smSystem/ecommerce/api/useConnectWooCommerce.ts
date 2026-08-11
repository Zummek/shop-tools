import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

import {
  WooCommerceConnection,
  wooCommerceConnectionQueryKey,
} from './useGetWooCommerceConnection';

const endpoint = '/api/v1/ecommerce/woocommerce/connection/';

export interface ConnectWooCommercePayload {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

export const useConnectWooCommerce = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, error, reset } = useMutation({
    mutationFn: async (payload: ConnectWooCommercePayload) => {
      const response = await axiosInstance.post<
        WooCommerceConnection | { error: string }
      >(endpoint, payload);

      // axiosInstance treats 400 as resolved (validateStatus) — reject explicitly
      if (response.status < 200 || response.status >= 300) {
        const data = response.data;
        const message =
          typeof data === 'object' &&
          data !== null &&
          'error' in data &&
          typeof data.error === 'string'
            ? data.error
            : 'Nie udało się połączyć ze sklepem WooCommerce';
        throw new Error(message);
      }

      return response.data as WooCommerceConnection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: wooCommerceConnectionQueryKey,
      });
    },
  });

  return {
    connectWooCommerce: mutateAsync,
    isPending,
    error,
    reset,
  };
};
