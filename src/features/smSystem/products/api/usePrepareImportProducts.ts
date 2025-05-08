import { useMutation } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { ImportProductPreparedProduct, ImportProductsStatus } from '../types';

interface Payload {
  productsFile: File;
}

export interface PrepareImportProductsResponse {
  id: number;
  status: ImportProductsStatus;
  summary: {
    productsToCreateAmount: number;
    productsToUpdateAmount: number;
    productsNotListedAmount: number;
    productsNotListed: ImportProductPreparedProduct[];
  };
}

export const usePrepareImportProducts = () => {
  const prepareImportProductsRequest = async ({ productsFile }: Payload) => {
    const formData = new FormData();
    formData.append('file', productsFile);

    return axiosInstance.post<PrepareImportProductsResponse>(
      '/api/v1/products/import/prepare/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: prepareImportProductsRequest,
  });

  return {
    prepareImportProducts: mutateAsync,
    isPending,
  };
};
