import { AxiosError, isAxiosError } from 'axios';

const IGNORED_HTTP_STATUSES = new Set([400, 401, 403, 404, 422]);

/**
 * Whether React Query should report an error to Sentry.
 * ERR_NETWORK is typical offline/flaky-link noise; not actionable server errors.
 */
export const shouldCaptureQueryError = (error: unknown) => {
  if (!isAxiosError(error)) return true;

  if (
    error.code === AxiosError.ECONNABORTED ||
    error.code === AxiosError.ERR_CANCELED ||
    error.code === AxiosError.ERR_NETWORK
  )
    return false;

  const status = error.response?.status;
  if (status !== undefined && IGNORED_HTTP_STATUSES.has(status)) return false;

  return true;
};
