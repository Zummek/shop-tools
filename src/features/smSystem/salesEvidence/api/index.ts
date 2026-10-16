import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useNotify } from '../../../../hooks';
import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../services';
import type {
  AccountingSettings,
  CompanyData,
  EvidenceBlocker,
  OrderEvidenceStatus,
  RecheckResult,
  SalesEvidenceChannel,
  SalesEvidenceDocument,
  SalesEvidencePreview,
  SyncRun,
} from '../types';
import { documentFileName } from '../utils/format';

const base = '/api/v1/reports/sales-evidence';
const LONG_TIMEOUT_MS = 300_000;

// 409 and 502 stay in this feature's handler, so the global interceptor
// does not replace them with a generic toast.
const acceptStatus = (status: number) =>
  (status >= 200 && status < 300) ||
  status === 400 ||
  status === 404 ||
  status === 409 ||
  status === 502;

export const salesEvidenceKeys = {
  all: ['salesEvidence'] as const,
  company: ['salesEvidence', 'company'] as const,
  settings: ['salesEvidence', 'settings'] as const,
  preview: (channel: string, from: string, to: string) =>
    ['salesEvidence', 'preview', channel, from, to] as const,
  documents: (channel: string) =>
    ['salesEvidence', 'documents', channel] as const,
  recheck: (id: number) => ['salesEvidence', 'recheck', id] as const,
  order: (id: number) => ['salesEvidence', 'order', id] as const,
  sync: (channel: string) => ['salesEvidence', 'sync', channel] as const,
};

interface ErrorBody {
  detail?: string;
  blockers?: EvidenceBlocker[];
  [field: string]: unknown;
}

const errorBody = (error: unknown): ErrorBody | null => {
  if (isAxiosError(error)) return (error.response?.data as ErrorBody) ?? null;
  return null;
};

export const errorMessage = (error: unknown, fallback: string): string =>
  errorBody(error)?.detail || fallback;

const fieldErrors = (body: ErrorBody | null): Record<string, string> => {
  if (!body) return {};
  const out: Record<string, string> = {};
  Object.entries(body).forEach(([field, value]) => {
    if (field === 'detail' || field === 'blockers') return;
    if (Array.isArray(value) && value.length) out[field] = String(value[0]);
  });
  return out;
};

// ---------------------------------------------------------------- company & settings

export const useCompanyData = () =>
  useQuery({
    queryKey: salesEvidenceKeys.company,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const response = await axiosInstance.get<CompanyData>(
        '/api/v1/organizations/company/',
      );
      if (response.status >= 400) throwAxiosErrorFromResponse(response);
      return response.data;
    },
  });

export const useAccountingSettings = () =>
  useQuery({
    queryKey: salesEvidenceKeys.settings,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const response = await axiosInstance.get<AccountingSettings>(
        '/api/v1/organizations/accounting-settings/',
      );
      if (response.status >= 400) throwAxiosErrorFromResponse(response);
      return response.data;
    },
  });

interface SaveResult<T> {
  data: T | null;
  errors: Record<string, string>;
}

const useSave = <TBody, TResult>(url: string, successMessage: string) => {
  const { notify } = useNotify();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const save = useCallback(
    async (body: TBody): Promise<SaveResult<TResult>> => {
      setIsPending(true);
      try {
        const response = await axiosInstance.patch<TResult>(url, body);
        if (response.status >= 400) {
          const errors = fieldErrors(response.data as ErrorBody);
          notify('error', 'Popraw zaznaczone pola.');
          return { data: null, errors };
        }
        notify('success', successMessage);
        await queryClient.invalidateQueries({
          queryKey: salesEvidenceKeys.all,
        });
        return { data: response.data, errors: {} };
      } catch (error) {
        notify('error', errorMessage(error, 'Nie udało się zapisać zmian.'));
        return { data: null, errors: {} };
      } finally {
        setIsPending(false);
      }
    },
    [notify, queryClient, successMessage, url],
  );

  return { save, isPending };
};

export const useSaveCompanyData = () =>
  useSave<Partial<CompanyData>, CompanyData>(
    '/api/v1/organizations/company/',
    'Dane firmy zapisane.',
  );

export const useSaveAccountingSettings = () =>
  useSave<Partial<AccountingSettings>, AccountingSettings>(
    '/api/v1/organizations/accounting-settings/',
    'Ustawienia rozliczeń zapisane.',
  );

// ---------------------------------------------------------------- preview & documents

export const useSalesEvidencePreview = (
  channel: SalesEvidenceChannel,
  periodFrom: string,
  periodTo: string,
  enabled: boolean,
) =>
  useQuery({
    queryKey: salesEvidenceKeys.preview(channel, periodFrom, periodTo),
    enabled,
    staleTime: 30_000,
    refetchOnMount: 'always',
    queryFn: async () => {
      const response = await axiosInstance.get<SalesEvidencePreview>(
        `${base}/preview/`,
        {
          params: { channel, periodFrom, periodTo },
          timeout: LONG_TIMEOUT_MS,
        },
      );
      if (response.status >= 400) throwAxiosErrorFromResponse(response);
      return response.data;
    },
  });

export const useSalesEvidenceDocuments = (channel: SalesEvidenceChannel) =>
  useQuery({
    queryKey: salesEvidenceKeys.documents(channel),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const response = await axiosInstance.get<{
        results: SalesEvidenceDocument[];
        canManage: boolean;
      }>(`${base}/documents/`, { params: { channel } });
      if (response.status >= 400) throwAxiosErrorFromResponse(response);
      return response.data;
    },
  });

export const useRecheckDocument = (id: number, enabled: boolean) =>
  useQuery({
    queryKey: salesEvidenceKeys.recheck(id),
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const response = await axiosInstance.get<RecheckResult>(
        `${base}/documents/${id}/recheck/`,
        { timeout: LONG_TIMEOUT_MS },
      );
      if (response.status >= 400) throwAxiosErrorFromResponse(response);
      return response.data;
    },
  });

// ---------------------------------------------------------------- actions

export interface ActionOutcome<T = unknown> {
  ok: boolean;
  data?: T;
  blockers?: EvidenceBlocker[];
}

const invalidateChannel = (
  queryClient: ReturnType<typeof useQueryClient>,
  channel: SalesEvidenceChannel,
) => {
  void queryClient.invalidateQueries({
    queryKey: ['salesEvidence', 'preview', channel],
  });
  void queryClient.invalidateQueries({
    queryKey: salesEvidenceKeys.documents(channel),
  });
  void queryClient.invalidateQueries({ queryKey: ['salesEvidence', 'order'] });
};

export const useSalesEvidenceActions = (channel: SalesEvidenceChannel) => {
  const { notify } = useNotify();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set());

  const run = useCallback(
    async <T>(
      name: string,
      url: string,
      body: object,
      successMessage: string | ((data: T) => string),
      fallbackError: string,
    ): Promise<ActionOutcome<T>> => {
      setPending((current) => new Set(current).add(name));
      try {
        const response = await axiosInstance.post<T & ErrorBody>(url, body, {
          timeout: LONG_TIMEOUT_MS,
          validateStatus: acceptStatus,
        });
        if (response.status >= 400) {
          const data = response.data as ErrorBody;
          notify('error', data?.detail || fallbackError);
          return { ok: false, blockers: data?.blockers };
        }
        const message =
          typeof successMessage === 'function'
            ? successMessage(response.data)
            : successMessage;
        if (message) notify('success', message);
        invalidateChannel(queryClient, channel);
        return { ok: true, data: response.data };
      } catch (error) {
        notify('error', errorMessage(error, fallbackError));
        return { ok: false, blockers: errorBody(error)?.blockers };
      } finally {
        setPending((current) => {
          const next = new Set(current);
          next.delete(name);
          return next;
        });
      }
    },
    [channel, notify, queryClient],
  );

  const period = (periodFrom: string, periodTo: string) => ({
    channel,
    periodFrom,
    periodTo,
  });

  return {
    pending,
    issue: (from: string, to: string) =>
      run<SalesEvidenceDocument>(
        'issue',
        `${base}/issue/`,
        period(from, to),
        (doc) =>
          `Wystawiono dowód ${doc.number}. Pobierz PDF i XLSX dla księgowej.`,
        'Nie udało się wystawić dowodu.',
      ),
    cancel: (id: number, reason: string) =>
      run<SalesEvidenceDocument>(
        `cancel-${id}`,
        `${base}/documents/${id}/cancel/`,
        { reason },
        (doc) => `Dowód ${doc.number} anulowany. Numer zostaje w historii.`,
        'Nie udało się anulować dowodu.',
      ),
    handOver: (id: number) =>
      run<SalesEvidenceDocument>(
        `hand-over-${id}`,
        `${base}/documents/${id}/hand-over/`,
        {},
        (doc) =>
          `Dowód ${doc.number} oznaczony jako przekazany do księgowości.`,
        'Nie udało się zmienić statusu.',
      ),
    correction: (id: number, reason: string) =>
      run<SalesEvidenceDocument>(
        `correction-${id}`,
        `${base}/documents/${id}/correction/`,
        { reason },
        (doc) => `Wystawiono dowód korygujący ${doc.number}.`,
        'Nie udało się wystawić korekty.',
      ),
    action: (name: string, body: object) =>
      run<{ ok: boolean; message: string }>(
        `action-${name}-${JSON.stringify(body)}`,
        `${base}/actions/${name}/`,
        body,
        (data) => data.message,
        'Nie udało się zapisać.',
      ),
  };
};

const syncActive = (status: SyncRun['status'] | undefined) =>
  status === 'queued' || status === 'running';

export const useSalesEvidenceSync = (channel: SalesEvidenceChannel) => {
  const { notify } = useNotify();
  const queryClient = useQueryClient();
  const previous = useRef<{ channel: string; status: string | null }>({
    channel,
    status: null,
  });

  const query = useQuery({
    queryKey: salesEvidenceKeys.sync(channel),
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const response = await axiosInstance.get<{ run: SyncRun | null }>(
        `${base}/sync/status/`,
        { params: { channel } },
      );
      if (response.status >= 400) throwAxiosErrorFromResponse(response);
      return response.data;
    },
    refetchInterval: (current) =>
      syncActive(current.state.data?.run?.status) ? 3000 : false,
  });

  useEffect(() => {
    const status = query.data?.run?.status ?? null;
    if (previous.current.channel !== channel) {
      previous.current = { channel, status };
      return;
    }
    const wasActive = syncActive(
      previous.current.status as SyncRun['status'] | undefined,
    );
    if (wasActive && (status === 'done' || status === 'failed')) {
      invalidateChannel(queryClient, channel);
      if (status === 'done') {
        const orders = query.data?.run?.result?.orders ?? 0;
        const refunds = query.data?.run?.result?.refunds ?? 0;
        notify(
          'success',
          `Dane pobrane: ${orders} zamówień, ${refunds} zwrotów. Podgląd jest aktualny.`,
        );
      } else {
        notify(
          'error',
          query.data?.run?.error ||
            'Nie udało się pobrać danych z kanału. Sprawdź połączenie w ustawieniach integracji.',
        );
      }
    }
    previous.current = { channel, status };
  }, [channel, notify, query.data, queryClient]);

  const start = useCallback(
    async (periodFrom: string, periodTo: string) => {
      try {
        const response = await axiosInstance.post<SyncRun & ErrorBody>(
          `${base}/sync/`,
          { channel, periodFrom, periodTo },
          { timeout: LONG_TIMEOUT_MS, validateStatus: acceptStatus },
        );
        if (response.status === 409) {
          const run = (response.data as { run?: SyncRun }).run ?? null;
          queryClient.setQueryData(salesEvidenceKeys.sync(channel), { run });
          notify(
            'info',
            response.data.detail || 'Pobieranie dla tego kanału już trwa.',
          );
          return;
        }
        if (response.status >= 400) {
          notify(
            'error',
            response.data.detail ||
              'Nie udało się uruchomić pobierania. Sprawdź połączenie z kanałem w ustawieniach integracji.',
          );
          return;
        }
        queryClient.setQueryData(salesEvidenceKeys.sync(channel), {
          run: response.data,
        });
      } catch (error) {
        notify(
          'error',
          errorMessage(error, 'Nie udało się uruchomić pobierania.'),
        );
      }
    },
    [channel, notify, queryClient],
  );

  const run = query.data?.run ?? null;
  return {
    start,
    run,
    active: syncActive(run?.status),
  };
};

// ---------------------------------------------------------------- downloads

const saveBlob = (data: Blob, fileName: string) => {
  const element = document.createElement('a');
  element.href = URL.createObjectURL(data);
  element.download = fileName;
  document.body.appendChild(element);
  element.click();
  element.remove();
  URL.revokeObjectURL(element.href);
};

export const useSalesEvidenceDownload = () => {
  const { notify } = useNotify();
  const [pending, setPending] = useState<string | null>(null);

  const download = useCallback(
    async (key: string, url: string, fileName: string) => {
      setPending(key);
      try {
        const response = await axiosInstance.get(url, {
          responseType: 'blob',
          timeout: LONG_TIMEOUT_MS,
        });
        if (response.status >= 400) {
          notify('error', 'Nie udało się pobrać pliku.');
          return;
        }
        saveBlob(response.data as Blob, fileName);
      } catch {
        notify('error', 'Nie udało się pobrać pliku.');
      } finally {
        setPending(null);
      }
    },
    [notify],
  );

  return {
    pending,
    downloadDocument: (doc: SalesEvidenceDocument, extension: 'pdf' | 'xlsx') =>
      download(
        `${doc.id}-${extension}`,
        `${base}/documents/${doc.id}/${extension}/`,
        documentFileName(doc.number, extension),
      ),
    downloadMonthlySummary: (year: number, month: number) =>
      download(
        `monthly-${year}-${month}`,
        `${base}/monthly-summary/?year=${year}&month=${month}`,
        `Zestawienie_DW_${year}_${String(month).padStart(2, '0')}.xlsx`,
      ),
  };
};

// ---------------------------------------------------------------- order screen

export const useOrderEvidenceStatus = (orderId: number) =>
  useQuery({
    queryKey: salesEvidenceKeys.order(orderId),
    enabled: Number.isFinite(orderId) && orderId > 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const response = await axiosInstance.get<OrderEvidenceStatus>(
        `${base}/orders/${orderId}/status/`,
      );
      if (response.status >= 400) throwAxiosErrorFromResponse(response);
      return response.data;
    },
  });

export const useSaveOrderMarks = (orderId: number) => {
  const { notify } = useNotify();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const save = useCallback(
    async (marks: {
      fiscalReceiptIssued?: boolean;
      invoiceIssuedManually?: boolean;
      invoiceNumber?: string;
      invoiceNotIssued?: boolean;
      buyerTaxId?: string;
    }) => {
      setIsPending(true);
      try {
        const response = await axiosInstance.post<{
          warning: string;
          detail?: string;
        }>(`${base}/orders/${orderId}/marks/`, marks);
        if (response.status >= 400) {
          notify(
            'error',
            response.data?.detail || 'Nie udało się zapisać znacznika.',
          );
          return { ok: false as const, warning: '' };
        }
        notify('success', 'Zapisano.');
        void queryClient.invalidateQueries({
          queryKey: salesEvidenceKeys.order(orderId),
        });
        void queryClient.invalidateQueries({
          queryKey: ['salesEvidence', 'preview'],
        });
        return { ok: true as const, warning: response.data.warning };
      } catch (error) {
        notify(
          'error',
          errorMessage(error, 'Nie udało się zapisać znacznika.'),
        );
        return { ok: false as const, warning: '' };
      } finally {
        setIsPending(false);
      }
    },
    [notify, orderId, queryClient],
  );

  return { save, isPending };
};
