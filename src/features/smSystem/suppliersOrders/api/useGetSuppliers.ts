import { useQuery } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { useState, useCallback } from 'react';

import { axiosInstance } from '../../../../services';
import {
  emptyListResponse,
  ListResponse,
  Supplier,
} from '../../app/types/index';

export type GetSuppliersResponse = ListResponse<Supplier>;

const endpoint = '/api/v1/suppliers-orders/suppliers/';

export const useGetSuppliers = () => {
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [name, setName] = useState<string | undefined>(undefined);

  const getSuppliersRequest = async () => {
    const response = await axiosInstance.get<GetSuppliersResponse>(endpoint, {
      params: {
        page,
        pageSize,
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
    queryKey: ['suppliers', { page, pageSize, name }],
    queryFn: getSuppliersRequest,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedChangeName = useCallback(
    debounce((value: string) => {
      setName(value);
      setPage(1);
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
    pageSize,
    setPageSize,
    page,
    setPage,
    name,
    setName,
    handleDebouncedChangeName,
  };
};
