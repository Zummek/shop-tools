import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { Invoice, InvoiceStatus } from '../types';

import { getInvoiceDetailsQueryKey } from './useGetInvoiceDetails';
import { getInvoicesQueryKeyBase } from './useGetInvoices';

const getEndpoint = (id: number) => `/api/v1/invoices/${id}/`;

interface UpdateInvoiceStatusPayload {
  id: number;
  status: InvoiceStatus;
}

export const useUpdateInvoiceStatus = () => {
  const queryClient = useQueryClient();

  const updateStatusRequest = async ({
    id,
    status,
  }: UpdateInvoiceStatusPayload) => {
    const { data } = await axiosInstance.patch<Invoice>(
      getEndpoint(id),
      { status }
    );
    return data;
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: updateStatusRequest,
    onSuccess: (invoice) => {
      queryClient.setQueryData(
        getInvoiceDetailsQueryKey(invoice.id),
        invoice
      );
      queryClient.refetchQueries({
        queryKey: [getInvoicesQueryKeyBase],
      });
    },
  });

  return {
    updateInvoiceStatus: mutateAsync,
    isPending,
  };
};
