import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

import { priceTagGroupsListQueryKeyBase } from './useGetPriceTagGroups';

export const useDeletePriceTagGroup = () => {
  const queryClient = useQueryClient();

  const deletePriceTagGroupRequest = async (groupId: string) => {
    const response = await axiosInstance.delete(
      `/api/v1/products/price-tag-groups/${groupId}/`
    );
    return response.data;
  };

  const { mutateAsync: deletePriceTagGroup, isPending } = useMutation({
    mutationFn: deletePriceTagGroupRequest,
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: [priceTagGroupsListQueryKeyBase],
      });
    },
  });

  return {
    deletePriceTagGroup,
    isPending,
  };
};
