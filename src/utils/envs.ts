export const isDev = import.meta.env.DEV;

export const smApiUrl = import.meta.env.VITE_SM_API_URL;

export const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

export const sentryEnvironment =
  import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE;

export const sentryRelease = import.meta.env.VITE_SENTRY_RELEASE;

export const appVersion = import.meta.env.VITE_APP_VERSION || 'dev';
