import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { Invoice } from '../types';

import { getInvoicesQueryKeyBase } from './useGetInvoices';

const endpoint = '/api/v1/invoices/upload/';

interface UploadInvoicePayload {
  file: File;
}

export const useUploadInvoice = () => {
  const queryClient = useQueryClient();

  const uploadInvoiceRequest = async ({ file }: UploadInvoicePayload) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post<Invoice>(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  };

  const { mutateAsync, isPending, data, error } = useMutation({
    mutationFn: uploadInvoiceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [getInvoicesQueryKeyBase],
      });
    },
  });

  return {
    uploadInvoice: mutateAsync,
    isPending,
    uploadedInvoice: data,
    error,
  };
};
