import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';

import { getEcommerceOrdersQueryKeyBase } from './useGetEcommerceOrders';

interface Payload {
  file: File;
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

const endpoint = '/api/v1/ecommerce/orders/import/';

export const useImportEcommerceOrders = () => {
  const queryClient = useQueryClient();
  const { notify } = useNotify();

  const request = async ({ file }: Payload) => {
    const response = await axiosInstance.post<Response>(
      endpoint,
      { csvFile: file },
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  };

  const {
    mutateAsync: importEcommerceOrders,
    isPending,
    isError,
  } = useMutation({
    mutationFn: request,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [getEcommerceOrdersQueryKeyBase],
      });
    },
    onError: () => {
      notify('error', 'Błąd podczas importowania zamówień');
    },
  });

  return {
    importEcommerceOrders,
    isPending,
    isError,
  };
};
