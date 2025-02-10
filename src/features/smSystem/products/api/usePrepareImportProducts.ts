import { useMutation } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { ImportCategory, ImportProduct } from '../types';

interface Payload {
  productsFile: File;
}

interface Response {
  message: string;
  data: {
    notListedProducts: ImportProduct[];
    notListedCategories: ImportCategory[];
    listedProductsAmount: number;
    listedCategoriesAmount: number;
  };
}

export const usePrepareImportProducts = () => {
  const prepareImportProductsRequest = async ({ productsFile }: Payload) => {
    const formData = new FormData();
    formData.append('TXTData', productsFile);

    return axiosInstance.post<Response>(
      '/api/v1/products/prepareImport',
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
