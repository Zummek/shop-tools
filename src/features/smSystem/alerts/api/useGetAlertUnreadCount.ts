import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../services';
import { AlertUnreadCount } from '../types';

const endpoint = '/api/v1/alerts/unread-count/';
export const getAlertUnreadCountQueryKey = ['alertUnreadCount'];

export const useGetAlertUnreadCount = (enabled = true) => {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: getAlertUnreadCountQueryKey,
    queryFn: async () => {
      const response = await axiosInstance.get<AlertUnreadCount>(endpoint);
      return response.data;
    },
    enabled,
    refetchInterval: enabled ? 60000 : false,
    refetchIntervalInBackground: false,
    // App-wide default disables this; unread alerts should stay fresh when
    // the user returns to the tab.
    refetchOnWindowFocus: true,
    meta: { suppressTransientErrorNotify: true },
  });

  return {
    unreadCount: data,
    isLoading: isLoading || isFetching,
  };
};
