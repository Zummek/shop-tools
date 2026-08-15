import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';
import {
  ConditionsFromOrdersInput,
  ConditionsFromOrdersResult,
} from '../types';

import { getConditionsListQueryKeyBase } from './useGetProductConditionsList';
import { getProductConditionsQueryKey } from './useProductConditions';

const endpoint = '/api/v1/suppliers-orders/v2/conditions/from-orders/';

export const useConditionsFromOrders = () => {
  const queryClient = useQueryClient();
  const { notify } = useNotify();

  const { mutateAsync: suggestFromOrders, isPending } = useMutation({
    mutationFn: async (payload: ConditionsFromOrdersInput) => {
      const response = await axiosInstance.post<ConditionsFromOrdersResult>(
        endpoint,
        payload,
      );
      return response.data;
    },
    onSuccess: (result, variables) => {
      if (!result.applied) return;
      queryClient.invalidateQueries({
        queryKey: [getConditionsListQueryKeyBase],
      });
      if (variables.productId) {
        queryClient.invalidateQueries({
          queryKey: getProductConditionsQueryKey(variables.productId),
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: ['v2-product-conditions-detail'],
        });
      }
      notify(
        'success',
        `Wypełniono warunki dla ${result.productsUpdated} produktów (${result.branchesSuggested} oddziałów)`,
      );
    },
    onError: () => {
      notify('error', 'Nie udało się wyliczyć warunków z historii zamówień');
    },
  });

  return { suggestFromOrders, isSuggesting: isPending };
};
