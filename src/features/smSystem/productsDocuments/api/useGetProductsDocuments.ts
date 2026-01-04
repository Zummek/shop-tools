import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { ListResponse } from '../../app/types';
import { ProductsDocumentListItem } from '../types';

interface Payload {
  page: number;
}

type Response = ListResponse<ProductsDocumentListItem>;

export const pageSize = 25;
export const getProductsDocumentsListQueryKeyBase = 'productsDocumentsList';
const endpoint = '/api/v1/products-documents/';
const getQueryKey = (page: number) => [
  getProductsDocumentsListQueryKeyBase,
  page,
];

export const useGetProductsDocuments = ({ page }: Payload) => {
  const getProductsDocumentsRequest = async () => {
    const response = await axiosInstance.get<Response>(
      `${endpoint}?page=${page + 1}&pageSize=${pageSize}`
    );
    return response.data;
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: getQueryKey(page),
    queryFn: getProductsDocumentsRequest,
    placeholderData: keepPreviousData,
  });

  const productsDocuments: ProductsDocumentListItem[] = data?.results || [];
  const hasNextPage = !!data?.next;
  const totalCount = data?.count || null;

  return {
    productsDocuments,
    totalCount,
    isLoading: isLoading || isFetching,
    hasNextPage,
  };
};
