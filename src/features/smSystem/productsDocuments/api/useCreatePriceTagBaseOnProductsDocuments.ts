import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import {
  getPriceTagGroupDetailsQueryKey,
  priceTagGroupsListQueryKeyBase,
} from '../../priceTags/api';
import { PriceTagGroup } from '../../priceTags/types';

const endpoint = '/api/v1/products-documents/create-price-tag-group/';

interface Payload {
  documentIds: string[];
  customName?: string;
}

type Response = PriceTagGroup;

export const useCreatePriceTagBaseOnProductsDocuments = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (data: Payload) => axiosInstance.post<Response>(endpoint, data),
    onSuccess: (data) => {
      queryClient.setQueryData(
        getPriceTagGroupDetailsQueryKey(data.data.id),
        () => data.data
      );
      queryClient.refetchQueries({
        queryKey: [priceTagGroupsListQueryKeyBase],
      });
    },
  });

  return {
    createPriceTagBaseOnProductsDocuments: mutateAsync,
    isPending,
  };
};
