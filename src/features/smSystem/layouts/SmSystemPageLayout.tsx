import { Box } from '@mui/material';
import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import { Page } from '../../../components/layout';
import { useAppSelector, useIsPage } from '../../../hooks';
import { Pages } from '../../../utils';

export const SmSystemPageLayout = () => {
  const navigate = useNavigate();

  const isSessionExist = !!useAppSelector(
    (state) => state.smSystemUser.accessToken
  );
  const isOnLoginPage = useIsPage(Pages.smSystemLogin);

  useEffect(() => {
    if (!isSessionExist) navigate(Pages.smSystemLogin, { replace: true });
    else if (isOnLoginPage)
      navigate(Pages.smSystemTransfers, { replace: true });
  }, [isOnLoginPage, isSessionExist, navigate]);

  return (
    <Page
      alignItems={isOnLoginPage ? 'center' : 'flex-start'}
    >
      <Box width="100%" flex={1}>
        <Outlet />
      </Box>
    </Page>
  );
};
