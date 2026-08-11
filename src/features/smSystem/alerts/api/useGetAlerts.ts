import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
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

const parsePageFromSearchParams = (searchParams: URLSearchParams): number => {
  const pageParam = searchParams.get('page');
  if (!pageParam) return 0;
  const parsed = Number(pageParam) - 1;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

export const useGetAlerts = () => {
  const { user } = useAppSelector((state) => state.smSystemUser);
  const canViewAlerts = !!user?.permissions?.canViewAlerts;
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePageFromSearchParams(searchParams);

  const statusParam = searchParams.get('status');
  const typeParam = searchParams.get('type') as AlertType | null;
  const severityParam = searchParams.get('severity');
  const channelParam = searchParams.get('channel');

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

  const [status, setStatusState] = useState<AlertStatus | ''>(initialStatus);
  const [type, setTypeState] = useState<AlertType | ''>(typeParam || '');
  const [severity, setSeverityState] = useState<AlertSeverity | ''>(
    initialSeverity,
  );
  const [channel, setChannelState] = useState<AlertChannelFilter | ''>(
    initialChannel,
  );

  const setPage = (nextPage: number) => {
    const normalized = Math.max(0, nextPage);
    setSearchParams(
      (prev) => {
        const currentPage = parsePageFromSearchParams(prev);
        if (currentPage === normalized) return prev;

        const params = new URLSearchParams(prev);
        if (normalized <= 0) params.delete('page');
        else params.set('page', String(normalized + 1));
        return params;
      },
      { replace: true },
    );
  };

  const setStatus = (value: AlertStatus | '') => {
    if (value === status) return;
    setStatusState(value);
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (value) params.set('status', value);
        else params.delete('status');
        params.delete('page');
        return params;
      },
      { replace: true },
    );
  };

  const setType = (value: AlertType | '') => {
    if (value === type) return;
    setTypeState(value);
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (value) params.set('type', value);
        else params.delete('type');
        params.delete('page');
        return params;
      },
      { replace: true },
    );
  };

  const setSeverity = (value: AlertSeverity | '') => {
    if (value === severity) return;
    setSeverityState(value);
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (value) params.set('severity', value);
        else params.delete('severity');
        params.delete('page');
        return params;
      },
      { replace: true },
    );
  };

  const setChannel = (value: AlertChannelFilter | '') => {
    if (value === channel) return;
    setChannelState(value);
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (value) params.set('channel', value);
        else params.delete('channel');
        params.delete('page');
        return params;
      },
      { replace: true },
    );
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
