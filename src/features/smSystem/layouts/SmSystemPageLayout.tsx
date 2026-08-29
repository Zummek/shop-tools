import { Box } from '@mui/material';
import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import { AppLayout } from '../../../components/layout';
import { useAppDispatch, useAppSelector, useIsPage } from '../../../hooks';
import { Pages } from '../../../utils';
import { invalidateSessionLifecycle } from '../user/sessionLifecycle';
import { clearSession } from '../user/store';

export const SmSystemPageLayout = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const accessToken = useAppSelector((state) => state.smSystemUser.accessToken);
  const user = useAppSelector((state) => state.smSystemUser.user);
  const isSessionExist = !!accessToken && !!user;
  const isOnLoginPage = useIsPage(Pages.smSystemLogin);

  useEffect(() => {
    // Tokens without user = zombie session from a refresh/logout race.
    if (accessToken && !user) {
      invalidateSessionLifecycle();
      dispatch(clearSession());
      navigate(Pages.smSystemLogin, { replace: true });
      return;
    }

    if (!isSessionExist) navigate(Pages.smSystemLogin, { replace: true });
    else if (isOnLoginPage)
      navigate(Pages.smSystemTransfers, { replace: true });
  }, [accessToken, dispatch, isOnLoginPage, isSessionExist, navigate, user]);

  if (isOnLoginPage || !isSessionExist) {
    return (
      <Box
        minHeight="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={2}
      >
        <Outlet />
      </Box>
    );
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
};
