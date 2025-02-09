import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { ProductsDocumentStatus } from '../types';

import { updateProductsDocumentStatusGraphqlMutation } from './productsDocumentsGraphql';
import { getProductsDocumentsListQueryKeyBase } from './useGetProductsDocuments';

interface Payload {
  ids: string[];
  status: ProductsDocumentStatus;
}

interface Response {
  data: {
    productsDocument: {
      updateStatus: {
        node: Array<{
          id: string;
          status: ProductsDocumentStatus;
        }>;
      };
    };
  };
}

export const useUpdateProductsDocumentsStatus = () => {
  const queryClient = useQueryClient();

  const updateProductsDocumentStatusRequest = async ({
    ids,
    status,
  }: Payload) =>
    axiosInstance.post<Response>(
      '/graphql',
      updateProductsDocumentStatusGraphqlMutation(ids, status)
    );

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
