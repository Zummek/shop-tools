import { isAxiosError } from 'axios';
import { useCallback } from 'react';

import { useAppDispatch } from '../../../../hooks';
import { store } from '../../../../store/store';
import { refreshToken as refreshTokenRequest } from '../api';
import {
  readPersistedSession,
  refreshTokenToSend,
  shouldAdoptPersistedTokens,
  shouldRetryRefresh,
} from '../persistedSession';
import {
  getRefreshInFlight,
  getSessionGeneration,
  setRefreshInFlight,
} from '../sessionLifecycle';
import { setTokens } from '../store';

export const useRefreshToken = () => {
  const dispatch = useAppDispatch();

  const refreshToken = useCallback(async () => {
    const existing = getRefreshInFlight();
    if (existing) return existing;

    const generationAtStart = getSessionGeneration();

    const promise = (async (): Promise<string | undefined> => {
      const stored = readPersistedSession(
        typeof localStorage === 'undefined' ? null : localStorage,
      );
      const memoryRefresh = store.getState().smSystemUser.refreshToken;
      if (shouldAdoptPersistedTokens(memoryRefresh, stored) && stored) {
        dispatch(
          setTokens({
            accessToken: stored.accessToken,
            refreshToken: stored.refreshToken,
          }),
        );
      }

      const refreshTokenValue = refreshTokenToSend(
        memoryRefresh,
        stored?.refreshToken,
      );
      if (!refreshTokenValue) return undefined;

      const applyRefresh = (accessToken?: string, newRefreshToken?: string) => {
        // Logout (or another invalidation) happened while refresh was in flight.
        if (generationAtStart !== getSessionGeneration()) return undefined;

        if (accessToken && newRefreshToken) {
          dispatch(
            setTokens({
              accessToken,
              refreshToken: newRefreshToken,
            }),
          );
          return accessToken;
        }

        dispatch(setTokens({ accessToken: null, refreshToken: null }));
        return undefined;
      };

      const requestRefresh = async (token: string) => {
        const { accessToken, refreshToken: newRefreshToken } =
          await refreshTokenRequest({ refreshToken: token });
        return applyRefresh(accessToken, newRefreshToken);
      };

      try {
        return await requestRefresh(refreshTokenValue);
      } catch (error) {
        const latest = readPersistedSession(
          typeof localStorage === 'undefined' ? null : localStorage,
        );
        if (
          !isAxiosError(error) ||
          error.response?.status !== 401 ||
          !latest?.accessToken ||
          !latest.refreshToken ||
          !shouldRetryRefresh(refreshTokenValue, latest.refreshToken)
        )
          return undefined;

        dispatch(
          setTokens({
            accessToken: latest.accessToken,
            refreshToken: latest.refreshToken,
          }),
        );

        try {
          return await requestRefresh(latest.refreshToken);
        } catch {
          return undefined;
        }
      }
    })();

    setRefreshInFlight(promise);

    try {
      return await promise;
    } finally {
      if (getRefreshInFlight() === promise) setRefreshInFlight(null);
    }
  }, [dispatch]);

  return { refreshToken };
};
