import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

import { wooCommerceConnectionQueryKey } from './useGetWooCommerceConnection';

const endpoint = '/api/v1/ecommerce/woocommerce/connection/';

export const useWooCommerceDisconnect = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: disconnectWooCommerce, isPending } = useMutation({
    mutationFn: () => axiosInstance.delete(endpoint),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: wooCommerceConnectionQueryKey,
      });
    },
  });

  return { disconnectWooCommerce, isPending };
};
