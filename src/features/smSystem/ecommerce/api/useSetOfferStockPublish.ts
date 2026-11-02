import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../services';
import { getProductDetailsQueryKey } from '../../products/api/useGetProductDetails';
import { ChannelProductLink } from '../types/channelLinks';

import { ecommerceOffersQueryKeyBase } from './useGetEcommerceOffers';
import { getProductChannelLinksQueryKey } from './useGetProductChannelLinks';

export const useSetOfferStockPublish = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      const response = await axiosInstance.patch<ChannelProductLink>(
        `/api/v1/ecommerce/offers/${id}/`,
        { stockPublishEnabled: enabled },
      );
      if (response.status === 400) throwAxiosErrorFromResponse(response);
      return response.data;
    },
    onSuccess: (link) => {
      queryClient.invalidateQueries({ queryKey: [ecommerceOffersQueryKeyBase] });
      queryClient.invalidateQueries({ queryKey: ['product-sales-overview'] });
      if (link.productId) {
        queryClient.invalidateQueries({
          queryKey: getProductChannelLinksQueryKey(link.productId),
        });
        queryClient.invalidateQueries({
          queryKey: getProductDetailsQueryKey(link.productId),
        });
      }
    },
  });

  return { setOfferStockPublish: mutateAsync, isPending };
};
