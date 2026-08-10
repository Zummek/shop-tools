import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';

import { allegroConnectionQueryKey } from './useGetAllegroConnection';
import { getEcommerceOrdersQueryKeyBase } from './useGetEcommerceOrders';

interface Payload {
  dateFrom: string;
  dateTo: string;
}

interface Response {
  message: string;
  createdOrdersIds: number[];
  errors: {
    errorCode: string;
    message: string;
    metadata: {
      orderId?: number;
    };
  }[];
}

const endpoint = '/api/v1/ecommerce/allegro/orders/import/';

export const useImportAllegroOrders = () => {
  const queryClient = useQueryClient();
  const { notify } = useNotify();

  const {
    mutateAsync: importAllegroOrders,
    isPending,
    data,
    reset: resetAllegroOrdersData,
  } = useMutation({
    mutationFn: (payload: Payload) =>
      axiosInstance.post<Response>(endpoint, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [getEcommerceOrdersQueryKeyBase],
      });
    },
    onError: (error: AxiosError) => {
      if (error.response?.status === 401) {
        queryClient.invalidateQueries({
          queryKey: allegroConnectionQueryKey,
        });
        notify(
          'error',
          'Połączenie z Allegro wygasło — połącz ponownie konto Allegro',
        );
        return;
      }
      notify('error', 'Błąd podczas importowania zamówień z Allegro');
    },
  });

  const importAllegroOrdersData = data?.data;

  return {
    importAllegroOrders,
    isPending,
    importAllegroOrdersData,
    resetAllegroOrdersData,
  };
};
