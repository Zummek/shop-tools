import { useEffect, useRef, useState } from 'react';

import { useAppSelector } from '../../../../hooks';

import { useLogoutUser } from './useLogoutUser';
import { useRefreshToken } from './useRefreshToken';

export const useRestoreSession = () => {
  const [isRestoringSession, setIsRestoringSession] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const restoreStartedRef = useRef(false);

  const accessToken = useAppSelector((state) => state.smSystemUser.accessToken);
  const refreshTokenFromStore = useAppSelector(
    (state) => state.smSystemUser.refreshToken,
  );

  const { refreshToken } = useRefreshToken();
  const { logoutUser } = useLogoutUser();

  const hasTokens = Boolean(accessToken && refreshTokenFromStore);

  useEffect(() => {
    if (restoreStartedRef.current) return;

    if (!hasTokens) {
      setSessionChecked(true);
      return;
    }

    restoreStartedRef.current = true;
    setIsRestoringSession(true);
    setSessionChecked(true);

    void (async () => {
      try {
        const refreshedAccessToken = await refreshToken();
        if (!refreshedAccessToken) logoutUser();
      } finally {
        setIsRestoringSession(false);
      }
    })();
  }, [hasTokens, logoutUser, refreshToken]);

  return {
    isRestoringSession,
    sessionChecked,
  };
};
