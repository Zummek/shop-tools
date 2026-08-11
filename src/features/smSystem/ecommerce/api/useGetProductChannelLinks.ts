import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { ChannelProductLink } from '../types/channelLinks';

const endpoint = (productId: number) =>
  `/api/v1/products/${productId}/channel-links/`;

export const getProductChannelLinksQueryKey = (productId: number) => [
  'product-channel-links',
  productId,
];

export const useGetProductChannelLinks = (productId: number | undefined) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: getProductChannelLinksQueryKey(productId ?? 0),
    queryFn: () =>
      axiosInstance.get<ChannelProductLink[]>(endpoint(productId!)),
    enabled: !!productId,
  });

  return {
    channelLinks: data?.data ?? [],
    isLoading,
    refetch,
  };
};
