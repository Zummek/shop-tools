import * as Sentry from '@sentry/react';
import { AxiosError, isAxiosError } from 'axios';
import { useEffect } from 'react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';

import {
  isDev,
  sentryDsn,
  sentryEnvironment,
  sentryRelease,
} from '../utils/envs';

export const initSentry = () => {
  if (isDev || !sentryDsn) return;

  Sentry.init({
    dsn: sentryDsn,
    environment: sentryEnvironment,
    release: sentryRelease,
    integrations: [
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    attachStacktrace: true,
  });
};

const toError = (error: unknown): Error => {
  if (error instanceof Error) return error;
  if (typeof error === 'string' && error.length > 0) return new Error(error);
  if (error === undefined || error === null)
    return new Error('Unknown error (empty value)');

  try {
    return new Error(`Non-Error thrown: ${JSON.stringify(error)}`);
  } catch {
    return new Error(`Non-Error thrown: ${String(error)}`);
  }
};

const MAX_RESPONSE_BODY = 500;

const summarizeResponseBody = (data: unknown): string | undefined => {
  if (data == null) return undefined;
  let text: string;
  try {
    text = typeof data === 'string' ? data : JSON.stringify(data);
  } catch {
    return undefined;
  }
  if (!text) return undefined;
  return text.length > MAX_RESPONSE_BODY
    ? `${text.slice(0, MAX_RESPONSE_BODY)}…`
    : text;
};

const getAxiosContext = (error: AxiosError) => ({
  method: error.config?.method,
  url: error.config?.url,
  status: error.response?.status,
  code: error.code,
  message: error.message,
  responseBody: summarizeResponseBody(error.response?.data),
});

export const captureError = (
  error: unknown,
  extra?: Record<string, unknown>,
) => {
  const exception = isAxiosError(error) ? error : toError(error);
  const axiosContext = isAxiosError(error) ? getAxiosContext(error) : undefined;

  if (isDev || !sentryDsn) {
    console.error('Sentry error:', exception, axiosContext, extra);
    return;
  }

  Sentry.captureException(exception, {
    ...(axiosContext ? { contexts: { axios: axiosContext } } : {}),
    ...(extra ? { extra } : {}),
  });
};
