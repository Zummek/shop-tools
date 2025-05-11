import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { ListResponse } from '../../app/types';
import { SimpleUser } from '../../user/types';

interface Payload {
  page: number;
  pageSize?: number;
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

const getQueryKey = (page: number) => ['branches', page];
const endpoint = '/api/v1/organizations/branches/';
const defaultPayload: Payload = { page: 1, pageSize: 500 };

export const useGetBranches = ({
  page,
  pageSize,
}: Payload = defaultPayload) => {
  const getBranchesRequest = async () => {
    const response = await axiosInstance.get<Response>(endpoint, {
      params: { page, pageSize },
    });
    return response.data;
  };

  const {
    data: branches,
    isLoading,
    isError,
  } = useQuery({
    queryKey: getQueryKey(page),
    queryFn: getBranchesRequest,
  });

  return { branches, isLoading, isError };
};
