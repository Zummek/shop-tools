import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';
import { OrderCondition, ProductConditions } from '../types';

import { getConditionsListQueryKeyBase } from './useGetProductConditionsList';

const getEndpoint = (productId: number) =>
  `/api/v1/suppliers-orders/products/${productId}/conditions/`;

export const getProductConditionsQueryKey = (productId: number) => [
  'v2-product-conditions-detail',
  productId,
];

export const useGetProductConditions = (productId: number | null) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: getProductConditionsQueryKey(productId ?? 0),
    queryFn: async () => {
      const response = await axiosInstance.get<ProductConditions>(
        getEndpoint(productId as number),
      );
      return response.data;
    },
    enabled: !!productId,
  });

  return { productConditions: data, isLoading, refetch };
};

interface UpdatePayload {
  productId: number;
  conditions: {
    branchId: number;
    orderConditions: OrderCondition[];
  }[];
}

export const useUpdateProductConditions = () => {
  const queryClient = useQueryClient();
  const { notify } = useNotify();

  const { mutateAsync: updateConditions, isPending } = useMutation({
    mutationFn: async ({ productId, conditions }: UpdatePayload) => {
      const response = await axiosInstance.put<ProductConditions>(
        getEndpoint(productId),
        conditions,
      );
      return response.data;
    },
    onSuccess: (response, variables) => {
      queryClient.setQueryData(
        getProductConditionsQueryKey(variables.productId),
        response,
      );
      queryClient.invalidateQueries({
        queryKey: [getConditionsListQueryKeyBase],
      });
      notify('success', 'Warunki zamówienia zapisane');
    },
    onError: () => {
      notify('error', 'Błąd podczas zapisu warunków zamówienia');
    },
  });

  return { updateConditions, isSaving: isPending };
};
