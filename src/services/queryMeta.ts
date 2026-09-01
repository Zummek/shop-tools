export type AppQueryMeta = {
  suppressTransientErrorNotify?: boolean;
};

export const isTransientErrorNotifySuppressed = (meta: unknown) =>
  typeof meta === 'object' &&
  meta !== null &&
  'suppressTransientErrorNotify' in meta &&
  (meta as AppQueryMeta).suppressTransientErrorNotify === true;
