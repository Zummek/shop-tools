import { Box, Container } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { Outlet, useMatch, useNavigate } from 'react-router-dom';

import { Page } from '../../../components/layout';
import { useAppSelector } from '../../../hooks';
import { Pages } from '../../../utils';
import { useLogoutUser } from '../user/hooks';

export const SmSystemPageLayout = () => {
  const navigate = useNavigate();

  const { logoutUser } = useLogoutUser();

  const isSessionExist = !!useAppSelector(
    (state) => state.smSystemUser.accessToken
  );
  const isOnLoginPage = !!useMatch(Pages.smSystemLogin.replace('#', ''));
  const isOnTransfersPage = !!useMatch(
    Pages.smSystemTransfers.replace('#', '')
  );

  useEffect(() => {
    if (!isSessionExist) navigate(Pages.smSystemLogin, { replace: true });
    else if (isOnLoginPage)
      navigate(Pages.smSystemTransfers, { replace: true });
  }, [isOnLoginPage, isSessionExist, navigate]);

  const headerTitle = useMemo(() => {
    if (isOnTransfersPage) return 'Transfery';
    return '';
  }, [isOnTransfersPage]);

  return (
    <Page
      headerTitle={headerTitle}
      alignItems={isOnLoginPage ? 'center' : 'flex-start'}
      onButtonClick={() => logoutUser()}
      buttonLabel="Wyloguj"
    >
      <Container maxWidth={isOnLoginPage ? 'xs' : 'lg'}>
        <Box display="flex" flexDirection="column">
          <Outlet />
        </Box>
      </Container>
    </Page>
  );
};
