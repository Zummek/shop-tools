import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { EcommerceOrderDetails } from '../types';

interface Payload {
  id: number;
}

const getEndpoint = (id: number) => `/api/v1/ecommerce/orders/${id}/`;
export const getEcommerceOrderDetailsQueryKey = (id: number) => [
  'ecommerceOrderDetails',
  id,
];

export const useGetEcommerceOrderDetails = ({ id }: Payload) => {
  const getEcommerceOrderDetailsRequest = async () => {
    const response = await axiosInstance.get<EcommerceOrderDetails>(
      getEndpoint(id)
    );
    return response.data || null;
  };

  const {
    data: ecommerceOrder,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: getEcommerceOrderDetailsQueryKey(id),
    queryFn: getEcommerceOrderDetailsRequest,
  });

  return { ecommerceOrder, isLoading, isError, refetch };
};
