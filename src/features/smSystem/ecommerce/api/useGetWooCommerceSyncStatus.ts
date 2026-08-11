import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { ChannelSyncRun } from '../types/channelLinks';

const endpoint = '/api/v1/ecommerce/woocommerce/sync-status/';
export const wooCommerceSyncStatusQueryKey = ['woocommerce-sync-status'];

type SyncStatusResponse = ChannelSyncRun | { message: string };

export const useGetWooCommerceSyncStatus = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: wooCommerceSyncStatusQueryKey,
    queryFn: () => axiosInstance.get<SyncStatusResponse>(endpoint),
    refetchInterval: (query) => {
      const payload = query.state.data?.data;
      if (payload && 'status' in payload && payload.status === 'running')
        return 3000;
      return false;
    },
  });

  const payload = data?.data;
  const syncRun =
    payload && 'status' in payload ? (payload as ChannelSyncRun) : null;

  return {
    syncRun,
    isLoading,
    refetch,
    hasNeverSynced: !!payload && 'message' in payload,
  };
};
