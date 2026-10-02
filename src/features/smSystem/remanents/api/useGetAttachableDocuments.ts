import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { ListResponse } from '../../app/types';
import { ProductsDocumentListItem } from '../../productsDocuments/types';

export const useGetAttachableDocuments = (remanentId: number, enabled: boolean) => {
  const { data, isLoading } = useQuery({
    queryKey: ['remanentAttachableDocuments', remanentId],
    queryFn: async () => {
      const response = await axiosInstance.get<
        ListResponse<ProductsDocumentListItem>
      >(`/api/v1/remanents/${remanentId}/attachable-documents/`, {
        params: { page: 1, pageSize: 100 },
      });
      return response.data;
    },
    enabled,
  });

  return {
    documents: data?.results || [],
    isLoading,
  };
};
