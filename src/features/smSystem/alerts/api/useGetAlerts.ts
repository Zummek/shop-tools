import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAppSelector } from '../../../../hooks';
import { axiosInstance } from '../../../../services';
import { ListResponse } from '../../app/types';
import {
  AlertChannelFilter,
  AlertListItem,
  AlertSeverity,
  AlertStatus,
  AlertType,
} from '../types';

const pageSize = 25;
const endpoint = '/api/v1/alerts/';
export const getAlertsQueryKeyBase = 'alerts';

type Response = ListResponse<AlertListItem>;

const isAlertStatus = (value: string | null): value is AlertStatus =>
  value === 'active' || value === 'acknowledged' || value === 'resolved';

const isAlertSeverity = (value: string | null): value is AlertSeverity =>
  value === 'info' || value === 'warning' || value === 'critical';

const isAlertChannelFilter = (
  value: string | null,
): value is AlertChannelFilter =>
  value === 'allegro' || value === 'woocommerce' || value === 'erli';

export const useGetAlerts = () => {
  const { user } = useAppSelector((state) => state.smSystemUser);
  const canViewAlerts = !!user?.permissions?.canViewAlerts;
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = searchParams.get('page');
  const statusParam = searchParams.get('status');
  const typeParam = searchParams.get('type') as AlertType | null;
  const severityParam = searchParams.get('severity');
  const channelParam = searchParams.get('channel');

  const initialPage = pageParam ? Number(pageParam) - 1 : 0;
  const initialStatus: AlertStatus | '' = isAlertStatus(statusParam)
    ? statusParam
    : 'active';
  const initialSeverity: AlertSeverity | '' = isAlertSeverity(severityParam)
    ? severityParam
    : '';
  const initialChannel: AlertChannelFilter | '' = isAlertChannelFilter(
    channelParam,
  )
    ? channelParam
    : '';

  const [page, setPage] = useState(initialPage);
  const [status, setStatusState] = useState<AlertStatus | ''>(initialStatus);
  const [type, setTypeState] = useState<AlertType | ''>(typeParam || '');
  const [severity, setSeverityState] = useState<AlertSeverity | ''>(
    initialSeverity,
  );
  const [channel, setChannelState] = useState<AlertChannelFilter | ''>(
    initialChannel,
  );

  useEffect(() => {
    const pageParam = searchParams.get('page');
    const newPage = pageParam ? Number(pageParam) - 1 : 0;
    if (newPage !== page && newPage >= 0) setPage(newPage);
  }, [searchParams, page]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (page > 0) params.page = (page + 1).toString();
    if (status) params.status = status;
    if (type) params.type = type;
    if (severity) params.severity = severity;
    if (channel) params.channel = channel;
    setSearchParams(params, { replace: true });
  }, [page, status, type, severity, channel, setSearchParams]);

  const setStatus = (value: AlertStatus | '') => {
    setStatusState(value);
    setPage(0);
  };

  const setType = (value: AlertType | '') => {
    setTypeState(value);
    setPage(0);
  };

  const setSeverity = (value: AlertSeverity | '') => {
    setSeverityState(value);
    setPage(0);
  };

  const setChannel = (value: AlertChannelFilter | '') => {
    setChannelState(value);
    setPage(0);
  };

  const getAlertsRequest = async () => {
    const response = await axiosInstance.get<Response>(endpoint, {
      params: {
        page: page + 1,
        pageSize,
        ...(status ? { status } : {}),
        ...(type ? { type } : {}),
        ...(severity ? { severity } : {}),
        ...(channel ? { channel } : {}),
      },
    });
    return response.data;
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [getAlertsQueryKeyBase, page, status, type, severity, channel],
    queryFn: getAlertsRequest,
    placeholderData: keepPreviousData,
    enabled: canViewAlerts,
  });

  const hasNextPage = !!data?.next;
  const totalCount = data?.count || null;
  const alerts = data?.results || [];

  return {
    alerts,
    totalCount,
    isLoading: isLoading || isFetching,
    hasNextPage,
    page,
    pageSize,
    setPage,
    status,
    setStatus,
    type,
    setType,
    severity,
    setSeverity,
    channel,
    setChannel,
  };
};
