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
    if (!refreshTokenValue) return false;

    const { accessToken } = await refreshTokenRequest({
      refreshToken: refreshTokenValue,
    });

    if (accessToken) dispatch(setAccessToken(accessToken));
    else dispatch(setAccessToken(null));

    return accessToken;
  }, [dispatch, refreshTokenValue]);

  return { refreshToken };
};
