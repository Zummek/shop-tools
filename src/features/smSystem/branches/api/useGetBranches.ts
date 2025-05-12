import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { axiosInstance } from '../../../../services';
import { ListResponse } from '../../app/types';
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const getBranchesRequest = async () => {
    const response = await axiosInstance.get<Response>(endpoint, {
      params: { page, pageSize },
    });
    return response.data;
  };

  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches', { page, pageSize }],
    queryFn: getBranchesRequest,
  });

  return { branches, isLoading, page, setPage, pageSize, setPageSize };
};
