import { useQuery } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { useState, useCallback } from 'react';

import { axiosInstance } from '../../../../services';
import {
  emptyListResponse,
  ListResponse,
  PaginationState,
  Supplier,
} from '../../app/types';

export type GetSuppliersResponse = ListResponse<Supplier>;

export const getSuppliersQueryKeyBase = 'suppliers';
const endpoint = '/api/v1/suppliers-orders/suppliers/';

export const useGetSuppliers = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    pageSize: 25,
  });
  const [name, setName] = useState<string | undefined>(undefined);

  const getSuppliersRequest = async () => {
    const response = await axiosInstance.get<GetSuppliersResponse>(endpoint, {
      params: {
        page: pagination.page + 1,
        pageSize: pagination.pageSize,
        name,
      },
    });

    return response.data || emptyListResponse;
  };

  const {
    data: suppliers,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [getSuppliersQueryKeyBase, { pagination, name }],
    queryFn: getSuppliersRequest,
    placeholderData: (previousData) => previousData,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedChangeName = useCallback(
    debounce((value: string) => {
      setName(value);
      setPagination({ page: 0, pageSize: pagination.pageSize });
    }, 300),
    []
  );

  const handleDebouncedChangeName = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    debouncedChangeName(event.target.value);
  };

  return {
    suppliers,
    isLoading,
    refetch,
    pagination,
    setPagination,
    name,
    setName,
    handleDebouncedChangeName,
  };
};
