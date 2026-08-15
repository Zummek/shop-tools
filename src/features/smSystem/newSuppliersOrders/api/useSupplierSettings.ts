import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useNotify } from '../../../../hooks';
import { axiosInstance } from '../../../../services';
import { Supplier, SupplierSettings } from '../types';

const getEndpoint = (id: number) =>
  `/api/v1/suppliers-orders/v2/suppliers/${id}/settings/`;

export const getV2SupplierSettingsQueryKey = (id: number) => [
  'v2-supplierSettings',
  id,
];

export const useGetSupplierSettings = (id: number) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: getV2SupplierSettingsQueryKey(id),
    queryFn: async () => {
      const response = await axiosInstance.get<Supplier>(getEndpoint(id));
      return response.data;
    },
    enabled: id > 0,
  });

  return { settings: data, isLoading, refetch };
};

export const useUpdateSupplierSettings = () => {
  const queryClient = useQueryClient();
  const { notify } = useNotify();

  const { mutateAsync: updateSettings, isPending } = useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: SupplierSettings & { id: number }) => {
      const response = await axiosInstance.patch<Supplier>(
        getEndpoint(id),
        payload,
      );
      return response.data;
    },
    onSuccess: (response, variables) => {
      queryClient.setQueryData(
        getV2SupplierSettingsQueryKey(variables.id),
        response,
      );
      notify('success', 'Dane dostawcy zapisane');
    },
    onError: () => {
      notify('error', 'Błąd podczas zapisu ustawień dostawcy');
    },
  });

  return { updateSettings, isSaving: isPending };
};
