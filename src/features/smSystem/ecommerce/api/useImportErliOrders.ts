import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';

import { getEcommerceOrdersQueryKeyBase } from './useGetEcommerceOrders';
import { getEcommerceOrdersStatsQueryKey } from './useGetEcommerceOrdersStats';
import { erliConnectionQueryKey } from './useGetErliConnection';

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

const endpoint = '/api/v1/ecommerce/erli/orders/import/';

export const useImportErliOrders = () => {
  const queryClient = useQueryClient();
  const { notify } = useNotify();

  const {
    mutateAsync: importErliOrders,
    isPending,
    data,
    reset: resetErliOrdersData,
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
          queryKey: erliConnectionQueryKey,
        });
        notify('error', 'Połączenie z Erli wygasło — połącz ponownie konto');
        return;
      }
      notify('error', 'Błąd podczas importowania zamówień z Erli');
    },
  });

  const importErliOrdersData = data?.data;

  return {
    importErliOrders,
    isPending,
    importErliOrdersData,
    resetErliOrdersData,
  };
};
