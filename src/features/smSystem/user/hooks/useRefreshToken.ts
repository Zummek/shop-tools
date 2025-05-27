import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { refreshToken as refreshTokenRequest } from '../api';
import { setTokens } from '../store';

export const useRefreshToken = () => {
  const dispatch = useAppDispatch();

  const { refreshToken: refreshTokenValue } = useAppSelector(
    (state) => state.smSystemUser
  );

  const refreshToken = useCallback(async () => {
    if (!refreshTokenValue) return undefined;

    try {
      const { accessToken, refreshToken } = await refreshTokenRequest({
        refreshToken: refreshTokenValue,
      });

      if (accessToken && refreshToken) {
        dispatch(
          setTokens({
            accessToken,
            refreshToken,
          })
        );
      } else {
        dispatch(setTokens({ accessToken: null, refreshToken: null }));
      }

      return accessToken;
    } catch (error) {
      return undefined;
    }
  }, [dispatch, refreshTokenValue]);

  return { refreshToken };
};
