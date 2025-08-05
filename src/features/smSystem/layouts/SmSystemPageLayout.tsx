import { Box } from '@mui/material';
import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import { Page } from '../../../components/layout';
import { useAppSelector, useIsPage } from '../../../hooks';
import { Pages } from '../../../utils';
import { useLogoutUser } from '../user/hooks';

export const SmSystemPageLayout = () => {
  const navigate = useNavigate();

  const { logoutUser } = useLogoutUser();

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
      onButtonClick={() => logoutUser()}
      buttonLabel="Wyloguj"
    >
      <Box width="100%" flex={1}>
        <Outlet />
      </Box>
    </Page>
  );
};
