import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

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
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    pageSize: defaultPageSize,
  });

  const getBranchesRequest = async () => {
    const response = await axiosInstance.get<Response>(endpoint, {
      params: {
        page: pagination.page + 1,
        pageSize: pagination.pageSize,
      },
    });
    return response.data;
  };

  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches', { pagination }],
    queryFn: getBranchesRequest,
    placeholderData: (previousData) => previousData,
  });

  return { branches, isLoading, pagination, setPagination };
};
