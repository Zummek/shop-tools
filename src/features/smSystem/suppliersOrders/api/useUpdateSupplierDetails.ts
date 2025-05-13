import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

interface UpdateSupplierDetailsInput {
  id: number;
  name?: string;
  branchesIds: number[];
  productsIds?: number[];
}

interface UpdateSupplierResponse {
  success: boolean;
  message?: string;
}

const getSupplierDetailsQueryKey = (id: number) => ['supplierDetails', id];

const getEndpoint = (id: number) => `/api/v1/suppliers-orders/suppliers/${id}/`;

export const useUpdateSupplierDetails = () => {
  const queryClient = useQueryClient();

  const updateSupplierDetailsRequest = async ({
    id,
    name,
    branchesIds,
    productsIds,
  }: UpdateSupplierDetailsInput) => {
    const response = await axiosInstance.patch<UpdateSupplierResponse>(
      getEndpoint(id),
      {
        name,
        branchesIds,
        productsIds,
      }
    );

    return response.data;
  };

  const {
    mutateAsync: updateSupplierDetails,
    isPending,
    isError,
  } = useMutation({
    mutationFn: updateSupplierDetailsRequest,
    onSuccess: (response, variables) => {
      queryClient.setQueryData(
        getSupplierDetailsQueryKey(variables.id),
        response
      );
      queryClient.refetchQueries({ queryKey: ['suppliers'] });
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
