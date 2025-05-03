import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

interface UpdateSupplierDetailsInput {
  id: number;
  name: string;
  branches_ids: number[];
  products_ids: number[];
}

interface UpdateSupplierResponse {
  success: boolean;
  message?: string;
}

const getSupplierDetailsQueryKey = (id: number) => ['supplierDetails', id];

const getEndpoint = (id: number) => `/api/v1/suppliers-orders/suppliers/${id}/`;

export const useUpdateSupplierDetails = () => {
  const queryClient = useQueryClient();

  const updateSupplierDetailsRequest = async ({ id, name, branches_ids, products_ids }: UpdateSupplierDetailsInput) => {
    const endpoint = getEndpoint(id);

    const payload = {
      name,
      branches_ids,
      products_ids,
    };

    const response = await axiosInstance.patch<UpdateSupplierResponse>(endpoint, payload);
    return response.data;
  };

  const { mutateAsync: updateSupplierDetails, isPending, isError } = useMutation({
    mutationFn: updateSupplierDetailsRequest,
    onSuccess: (response, variables) => {
      queryClient.setQueryData(getSupplierDetailsQueryKey(variables.id), response);
    },
    onError: (error: Error) => {
      console.error('Błąd podczas aktualizacji szczegółów dostawcy:', error);
    },
  });

  return {
    updateSupplierDetails,
    isSaving: isPending,
    isError,
  };
};
