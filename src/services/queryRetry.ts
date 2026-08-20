import { AxiosError, isAxiosError } from 'axios';

const TRANSIENT_HTTP_STATUSES = new Set([502, 503, 504]);
const QUERY_RETRY_COUNT = 3;
const TRANSIENT_QUERY_ERROR_MESSAGE = 'Błąd połączenia, spróbuj ponownie';

export const queryRetryDelay = (attemptIndex: number) =>
  Math.min(1000 * 2 ** attemptIndex, 30000);

export const isTransientQueryError = (error: unknown) => {
  if (!isAxiosError(error)) return false;

  if (
    error.code === AxiosError.ECONNABORTED ||
    error.code === AxiosError.ERR_CANCELED
  )
    return false;

  const status = error.response?.status;
  if (status === undefined) return true;

  return TRANSIENT_HTTP_STATUSES.has(status);
};

export const shouldRetryQuery = (failureCount: number, error: unknown) => {
  if (failureCount >= QUERY_RETRY_COUNT) return false;
  return isTransientQueryError(error);
};

let notifyQueryError: ((message: string) => void) | null = null;

export const setQueryErrorNotify = (
  notify: ((message: string) => void) | null,
) => {
  notifyQueryError = notify;
};

export const notifyTransientQueryError = () => {
  notifyQueryError?.(TRANSIENT_QUERY_ERROR_MESSAGE);
};
