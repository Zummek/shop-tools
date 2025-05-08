import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { refreshToken as refreshTokenRequest } from '../api';
import { setAccessToken } from '../store';

export const useRefreshToken = () => {
  const dispatch = useAppDispatch();

  const { refreshToken: refreshTokenValue } = useAppSelector(
    (state) => state.smSystemUser
  );

  const refreshToken = useCallback(async () => {
    if (!refreshTokenValue) return undefined;

    try {
      const { accessToken } = await refreshTokenRequest({
        refreshToken: refreshTokenValue,
      });

      if (accessToken) dispatch(setAccessToken(accessToken));
      else dispatch(setAccessToken(null));

      return accessToken;
    } catch (error) {
      return undefined;
    }
  }, [dispatch, refreshTokenValue]);

  return { refreshToken };
};
