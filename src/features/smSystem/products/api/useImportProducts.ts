import { useMutation } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { ImportProductsStatus } from '../types';

interface Payload {
  productsImportTaskId: number;
  notListedProductIdsToRemove: number[];
}

interface Response {
  id: number;
  status: ImportProductsStatus;
  error_message: string | null;
}

export const useImportProducts = () => {
  const importProductsRequest = async ({
    productsImportTaskId,
    notListedProductIdsToRemove,
  }: Payload) => {
    const res = await axiosInstance.post<Response>(
      `/api/v1/products/import/${productsImportTaskId}/`,
      {
        notListedProductIdsToRemove,
      }
    );

    return {
      processId: res.data.id,
    };
  };

  const { mutateAsync, isPending, isError, isSuccess } = useMutation({
    mutationFn: importProductsRequest,
  });

  return {
    importProducts: mutateAsync,
    isPending,
    isError,
    isSuccess,
  };
};
