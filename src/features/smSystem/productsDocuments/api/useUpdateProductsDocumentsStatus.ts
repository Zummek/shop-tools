import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { ProductsDocumentStatus } from '../types';

import { getProductsDocumentsListQueryKeyBase } from './useGetProductsDocuments';

interface Payload {
  ids: string[];
  status: ProductsDocumentStatus;
}

const endpoint = `/api/v1/products-documents/status/`;

export const useUpdateProductsDocumentsStatus = () => {
  const queryClient = useQueryClient();

  const updateProductsDocumentStatusRequest = async ({
    ids,
    status,
  }: Payload) =>
    axiosInstance.patch<Response>(endpoint, {
      productsDocumentIds: ids,
      status,
    });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: updateProductsDocumentStatusRequest,
    onSettled: () => {
      queryClient.refetchQueries({
        queryKey: [getProductsDocumentsListQueryKeyBase],
      });
    },
  });

  return {
    updateProductsDocumentsStatus: mutateAsync,
    isPending,
  };
};
