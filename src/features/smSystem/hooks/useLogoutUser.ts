import { useQueryClient } from '@tanstack/react-query';

import { useAppDispatch, useNotify } from '../../../hooks';
import { clearSession } from '../store';

export const useLogoutUser = () => {
  const { notify } = useNotify();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const logoutUser = (showSessionExpiredNotifi = true) => {
    dispatch(clearSession());

    queryClient.clear();
    queryClient.removeQueries();

    if (showSessionExpiredNotifi) notify('info', 'Twoja sesja wygasła');
  };

  return {
    logoutUser,
  };
};
