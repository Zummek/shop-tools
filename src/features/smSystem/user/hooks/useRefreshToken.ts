import { useCallback } from 'react';

import { useAppDispatch } from '../../../../hooks';
import { store } from '../../../../store/store';
import { refreshToken as refreshTokenRequest } from '../api';
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
      const refreshTokenValue = store.getState().smSystemUser.refreshToken;
      if (!refreshTokenValue) return undefined;

      try {
        const { accessToken, refreshToken: newRefreshToken } =
          await refreshTokenRequest({
            refreshToken: refreshTokenValue,
          });

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
      } catch {
        return undefined;
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
