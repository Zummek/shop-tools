import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useAppDispatch, useNotify } from '../../../../hooks';
import { appNavigate } from '../../../../services/appNavigation';
import { store } from '../../../../store/store';
import { Pages } from '../../../../utils';
import { invalidateSessionLifecycle } from '../sessionLifecycle';
import { clearSession } from '../store';

let isLoggingOut = false;

export const useLogoutUser = () => {
  const { notify } = useNotify();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const logoutUser = useCallback(
    (showSessionExpiredNotifi = true) => {
      if (isLoggingOut) return;

      const { accessToken, user } = store.getState().smSystemUser;
      if (!accessToken && !user) {
        appNavigate(Pages.smSystemLogin, { replace: true });
        return;
      }

      isLoggingOut = true;
      try {
        invalidateSessionLifecycle();
        dispatch(clearSession());

        queryClient.clear();
        queryClient.removeQueries();

        appNavigate(Pages.smSystemLogin, { replace: true });

        if (showSessionExpiredNotifi) notify('info', 'Twoja sesja wygasła');
      } finally {
        isLoggingOut = false;
      }
    },
    [dispatch, notify, queryClient],
  );

  return {
    logoutUser,
  };
};
