export const PERSIST_ROOT_KEY = 'persist:root';

export type PersistedTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

const asToken = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value : null;

export const parsePersistedSession = (raw: string | null): PersistedTokens | null => {
  if (!raw) return null;

  try {
    const root = JSON.parse(raw) as { smSystemUser?: unknown };
    if (typeof root?.smSystemUser !== 'string') return null;

    const user = JSON.parse(root.smSystemUser) as {
      accessToken?: unknown;
      refreshToken?: unknown;
    };

    return {
      accessToken: asToken(user.accessToken),
      refreshToken: asToken(user.refreshToken),
    };
  } catch {
    return null;
  }
};

export const readPersistedSession = (
  storage: Pick<Storage, 'getItem'> | null | undefined,
): PersistedTokens | null => {
  if (!storage) return null;
  return parsePersistedSession(storage.getItem(PERSIST_ROOT_KEY));
};

/** Send the in-memory refresh token. Storage can still hold the previous one. */
export const refreshTokenToSend = (
  memoryRefresh: string | null | undefined,
  storedRefresh: string | null | undefined,
): string | null => memoryRefresh || storedRefresh || null;

/** Fill an empty tab from storage. Never replace a token this tab already holds. */
export const shouldAdoptPersistedTokens = (
  memoryRefresh: string | null | undefined,
  stored: PersistedTokens | null,
): stored is PersistedTokens & { accessToken: string; refreshToken: string } =>
  !memoryRefresh && Boolean(stored?.accessToken && stored.refreshToken);

/** One retry when another tab already rotated the refresh token we just sent. */
export const shouldRetryRefresh = (
  sentRefreshToken: string,
  storedRefreshToken: string | null | undefined,
): boolean =>
  Boolean(storedRefreshToken) && storedRefreshToken !== sentRefreshToken;
