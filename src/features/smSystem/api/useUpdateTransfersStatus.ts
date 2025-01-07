import { useMutation, useQueryClient } from '@tanstack/react-query';

import { axiosInstance } from '../../../services';
import { TransferStatus } from '../types';

import { updateTransfersStatusGraphqlMutation } from './transfersGraphql';

interface Payload {
  ids: string[];
  status: TransferStatus;
}

interface Response {
  data: {
    transfer: {
      updateStatus: {
        node: Array<{
          id: string;
          status: TransferStatus;
        }>;
      };
    };
  };
}

export const useUpdateTransfersStatus = () => {
  const queryClient = useQueryClient();

  const updateTransfersStatusRequest = async ({ ids, status }: Payload) =>
    axiosInstance.post<Response>(
      '/graphql',
      updateTransfersStatusGraphqlMutation(ids, status)
    );

  const { mutateAsync, isPending } = useMutation({
    mutationFn: updateTransfersStatusRequest,
    onSettled: () => {
      queryClient.refetchQueries({ queryKey: ['transfers'] });
    },
  });

  return {
    updateTransfersStatus: mutateAsync,
    isPending,
  };
};
