import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

import { getPriceTagGroupDetailsQueryKey } from './useGetPriceTagGroupDetails';
import { priceTagGroupsListQueryKeyBase } from './useGetPriceTagGroups';

type Payload = {
  name: string;
};

type Response = {
  id: string;
  name: string;
  products: string[];
};

const endpoint = '/api/v1/products/price-tag-groups/';

export const useCreatePriceTagGroup = () => {
  const queryClient = useQueryClient();

  const createPriceTagGroupRequest = async ({ name }: Payload) =>
    axiosInstance.post<Response>(endpoint, {
      name,
    });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createPriceTagGroupRequest,
    onSettled: (data) => {
      if (!data?.data) return;

      queryClient.setQueryData(
        getPriceTagGroupDetailsQueryKey(data.data.id),
        () => data.data
      );
      queryClient.invalidateQueries({
        queryKey: [priceTagGroupsListQueryKeyBase],
        exact: false,
      });
    },
  });

  return {
    createPriceTagGroup: mutateAsync,
    isPending,
  };
};
