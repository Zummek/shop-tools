import { Box } from '@mui/material';
import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import { AppLayout } from '../../../components/layout';
import { useAppSelector, useIsPage } from '../../../hooks';
import { Pages } from '../../../utils';

export const SmSystemPageLayout = () => {
  const navigate = useNavigate();

  const isSessionExist = !!useAppSelector(
    (state) => state.smSystemUser.accessToken,
  );
  const isOnLoginPage = useIsPage(Pages.smSystemLogin);

  useEffect(() => {
    if (!isSessionExist) navigate(Pages.smSystemLogin, { replace: true });
    else if (isOnLoginPage)
      navigate(Pages.smSystemTransfers, { replace: true });
  }, [isOnLoginPage, isSessionExist, navigate]);

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
