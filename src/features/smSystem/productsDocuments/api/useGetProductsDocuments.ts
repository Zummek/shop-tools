import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { ProductsDocumentListItem } from '../types';

import { getProductsDocumentsGraphqlQuery } from './productsDocumentsGraphql';

interface Payload {
  page: number;
}

interface Response {
  data: {
    productsDocuments: {
      node: ProductsDocumentListItem[];
      pageInfo: {
        totalCount: number;
        hasNextPage: number;
      };
    };
  };
}

export const pageSize = 25;
export const getProductsDocumentsListQueryKeyBase = 'productsDocumentsList';
const getQueryKey = (page: number) => [
  getProductsDocumentsListQueryKeyBase,
  page,
];

export const useGetProductsDocuments = ({ page }: Payload) => {
  const offset = page * pageSize;

  const getProductsDocumentsRequest = async () => {
    const response = await axiosInstance.post<Response>(
      '/graphql',
      getProductsDocumentsGraphqlQuery(offset, pageSize)
    );
    return response.data;
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: getQueryKey(page),
    queryFn: getProductsDocumentsRequest,
    placeholderData: keepPreviousData,
  });

  const productsDocuments: ProductsDocumentListItem[] =
    data?.data.productsDocuments.node || [];
  const hasNextPage = !!data?.data.productsDocuments.pageInfo.hasNextPage;
  const totalCount = data?.data.productsDocuments.pageInfo.totalCount || null;

  return {
    productsDocuments,
    totalCount,
    isLoading: isLoading || isFetching,
    hasNextPage,
  };
};
