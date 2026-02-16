import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

import { getInvoicesQueryKeyBase } from './useGetInvoices';

const getEndpoint = (id: number) => `/api/v1/invoices/${id}/`;

interface DeleteInvoicePayload {
  id: number;
}

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  const deleteInvoiceRequest = async ({ id }: DeleteInvoicePayload) => {
    await axiosInstance.delete(getEndpoint(id));
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: deleteInvoiceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [getInvoicesQueryKeyBase],
      });
    },
  });

  return {
    deleteInvoice: mutateAsync,
    isPending,
  };
};
