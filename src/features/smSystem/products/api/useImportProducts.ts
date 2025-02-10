import { useMutation } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

interface Payload {
  productsFile: File;
  productIdsToRemove: string[];
  categoryIdsToRemove: string[];
}

interface Response {
  data: {
    id: string;
  };
}

export const useImportProducts = () => {
  const importProductsRequest = async ({
    productsFile,
    productIdsToRemove,
    categoryIdsToRemove,
  }: Payload) => {
    const formData = new FormData();
    formData.append('TXTData', productsFile);
    formData.append('productIdsToRemove', JSON.stringify(productIdsToRemove));
    formData.append('categoryIdsToRemove', JSON.stringify(categoryIdsToRemove));

    const res = await axiosInstance.post<Response>(
      '/api/v1/products/import',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return {
      processId: res.data.data.id,
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
