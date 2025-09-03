import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';

import { axiosInstance } from '../../../../services';
import { ListResponse, PaginationState } from '../../app/types';
import { SimpleUser } from '../../user/types';

interface Payload {
  defaultPageSize?: number;
}

export interface BranchListItem {
  id: number;
  name: string;
  createdAt: string;
  createdBy: SimpleUser;
  updatedAt: string;
  updatedBy: SimpleUser;
}

type Response = ListResponse<BranchListItem>;

const endpoint = '/api/v1/organizations/branches/';

export const useGetBranches = ({ defaultPageSize = 25 }: Payload = {}) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const pagination = useMemo(() => ({ page, pageSize }), [page, pageSize]);

  const getBranchesRequest = async () => {
    const response = await axiosInstance.get<Response>(endpoint, {
      params: {
        page: page + 1,
        pageSize,
      },
    });
    return response.data;
  };

  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches', page, pageSize],
    queryFn: getBranchesRequest,
    placeholderData: (previousData) => previousData,
  });

  const setPagination = (pagination: PaginationState) => {
    setPage(pagination.page);
    setPageSize(pagination.pageSize);
  };

  return {
    branches,
    isLoading,
    pagination,
    setPagination,
  };
};
