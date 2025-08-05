import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { PriceTagGroup } from '../types';

export const getPriceTagGroupDetailsQueryKeyBase = 'priceTagGroupDetails';
const endpoint = (id: string) => `/api/v1/products/price-tag-groups/${id}/`;
export const getPriceTagGroupDetailsQueryKey = (id: string) => [
  getPriceTagGroupDetailsQueryKeyBase,
  id,
];

export const useGetPriceTagGroupDetails = (id: string | undefined) => {
  const getPriceTagGroupDetailsRequest = async () => {
    if (!id) throw new Error('Id is required');

    const response = await axiosInstance.get<PriceTagGroup>(endpoint(id));
    return response.data;
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: getPriceTagGroupDetailsQueryKey(id || ''),
    queryFn: getPriceTagGroupDetailsRequest,
    placeholderData: keepPreviousData,
  });

  return {
    priceTagGroupDetails: data,
    isLoading: isLoading || isFetching,
  };
};
