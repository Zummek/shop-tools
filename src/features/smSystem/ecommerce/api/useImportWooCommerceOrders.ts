import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';

import { getEcommerceOrdersQueryKeyBase } from './useGetEcommerceOrders';
import { getEcommerceOrdersStatsQueryKey } from './useGetEcommerceOrdersStats';
import { wooCommerceConnectionQueryKey } from './useGetWooCommerceConnection';

interface Payload {
  dateFrom: string;
  dateTo: string;
}

interface Response {
  message: string;
  createdOrdersIds: number[];
  updatedOrdersIds?: number[];
  errors: {
    errorCode: string;
    message: string;
    metadata: {
      orderId?: number;
    };
  }[];
  totalUpdated?: number;
}

const endpoint = '/api/v1/ecommerce/woocommerce/orders/import/';

export const useImportWooCommerceOrders = () => {
  const queryClient = useQueryClient();
  const { notify } = useNotify();

  const {
    mutateAsync: importWooCommerceOrders,
    isPending,
    data,
    reset: resetWooCommerceOrdersData,
  } = useMutation({
    mutationFn: async (payload: Payload) => {
      const response = await axiosInstance.post<Response>(endpoint, payload);
      if (response.status < 200 || response.status >= 300) {
        const errorData = response.data as unknown as { error?: string };
        throw new Error(
          errorData?.error || `Import failed with status ${response.status}`,
        );
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [getEcommerceOrdersQueryKeyBase],
      });
      queryClient.invalidateQueries({
        queryKey: getEcommerceOrdersStatsQueryKey,
      });
    },
    onError: (error: AxiosError | Error) => {
      if (error instanceof AxiosError && error.response?.status === 401) {
        queryClient.invalidateQueries({
          queryKey: wooCommerceConnectionQueryKey,
        });
        notify(
          'error',
          'Połączenie z WooCommerce wygasło — połącz ponownie sklep',
        );
        return;
      }
      notify('error', 'Błąd podczas importowania zamówień z WooCommerce');
    },
  });

  const importWooCommerceOrdersData = data?.data;

  return {
    importWooCommerceOrders,
    isPending,
    importWooCommerceOrdersData,
    resetWooCommerceOrdersData,
  };
};
