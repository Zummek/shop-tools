import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';
import { Invoice, InvoiceItem } from '../types';

import { getInvoiceDetailsQueryKey } from './useGetInvoiceDetails';

export interface UpdateInvoiceItemPayload {
  invoiceId: number;
  itemId: number;
  productId: number;
}

interface AssignProductResponse {
  message: string;
  item: InvoiceItem;
  mappingCreated: boolean;
}

const getEndpoint = (invoiceId: number, itemId: number) =>
  `/api/v1/invoices/${invoiceId}/items/${itemId}/assign-product/`;

export const useUpdateInvoiceItem = () => {
  const queryClient = useQueryClient();
  const { notify } = useNotify();

  const request = async ({
    invoiceId,
    itemId,
    productId,
  }: UpdateInvoiceItemPayload) => {
    const response = await axiosInstance.patch<AssignProductResponse>(
      getEndpoint(invoiceId, itemId),
      { productId },
    );
    return response.data;
  };

  const {
    mutateAsync: updateInvoiceItem,
    isPending,
    isError,
  } = useMutation({
    mutationFn: request,
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        getInvoiceDetailsQueryKey(variables.invoiceId),
        (old: Invoice | undefined) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === variables.itemId ? data.item : item,
            ),
          };
        },
      );
    },
    onError: () => {
      notify('error', 'Błąd podczas aktualizacji pozycji faktury');
    },
  });

  return {
    updateInvoiceItem,
    isPending,
    isError,
  };
};
