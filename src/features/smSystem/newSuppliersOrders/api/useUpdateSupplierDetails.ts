import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';

import { getV2SupplierDetailsQueryKey } from './useGetSupplierDetails';
import { getV2SuppliersQueryKeyBase } from './useGetSuppliers';

interface UpdateSupplierDetailsInput {
  id: number;
  name?: string;
  branchesIds: number[];
  productsIds?: number[];
}

const getEndpoint = (id: number) => `/api/v1/suppliers-orders/suppliers/${id}/`;

export const useUpdateSupplierDetails = () => {
  const queryClient = useQueryClient();

  const updateSupplierDetailsRequest = async ({
    id,
    name,
    branchesIds,
    productsIds,
  }: UpdateSupplierDetailsInput) => {
    const response = await axiosInstance.patch(getEndpoint(id), {
      name,
      branchesIds,
      productsIds,
    });

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
        getV2SupplierDetailsQueryKey(variables.id),
        response,
      );
      queryClient.refetchQueries({ queryKey: [getV2SuppliersQueryKeyBase] });
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
