import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { Invoice } from '../types';

interface Payload {
  id: number;
}

const getEndpoint = (id: number) => `/api/v1/invoices/${id}/`;
export const getInvoiceDetailsQueryKey = (id: number) => ['invoiceDetails', id];

export const useGetInvoiceDetails = ({ id }: Payload) => {
  const getInvoiceDetailsRequest = async () => {
    const response = await axiosInstance.get<Invoice>(getEndpoint(id));
    return response.data || null;
  };

  const {
    data: invoice,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: getInvoiceDetailsQueryKey(id),
    queryFn: getInvoiceDetailsRequest,
  });

  return { invoice, isLoading, isError, refetch };
};
