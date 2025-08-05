import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { PriceTagGroup } from '../types';

import { getPriceTagGroupDetailsQueryKey } from './useGetPriceTagGroupDetails';

interface UpdateProductsPayload {
  name?: string;
  productIds?: number[];
}

interface Params {
  groupId: string | undefined;
}

export const useUpdatePriceTagGroup = ({ groupId }: Params) => {
  const queryClient = useQueryClient();

  const updatePriceTagGroupRequest = async (payload: UpdateProductsPayload) => {
    if (!groupId) throw new Error('GroupId is required');

    const response = await axiosInstance.patch<PriceTagGroup>(
      `/api/v1/products/price-tag-groups/${groupId}/`,
      payload
    );
    return response.data;
  };

  const { mutateAsync: updatePriceTagGroup, isPending } = useMutation({
    mutationFn: updatePriceTagGroupRequest,
    onSuccess: (data) => {
      queryClient.setQueryData(
        getPriceTagGroupDetailsQueryKey(groupId || ''),
        (oldData: PriceTagGroup) => {
          return {
            ...oldData,
            ...data,
          };
        }
      );
    },
  });

  return {
    updatePriceTagGroup,
    isPending,
  };
};
