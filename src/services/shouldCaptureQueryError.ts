import { AxiosError, isAxiosError } from 'axios';

const IGNORED_HTTP_STATUSES = new Set([400, 401, 403, 404, 422]);

const isClientOffline = () =>
  typeof navigator !== 'undefined' && navigator.onLine === false;

/**
 * Whether React Query should report an error to Sentry.
 * Offline ERR_NETWORK is expected client noise; online network failures are kept.
 */
export const shouldCaptureQueryError = (error: unknown) => {
  if (!isAxiosError(error)) return true;

  if (
    error.code === AxiosError.ECONNABORTED ||
    error.code === AxiosError.ERR_CANCELED
  )
    return false;

  if (error.code === AxiosError.ERR_NETWORK && isClientOffline()) return false;

  const status = error.response?.status;
  if (status !== undefined && IGNORED_HTTP_STATUSES.has(status)) return false;

  return true;
};
