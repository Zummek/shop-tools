import { Stack, Typography, ButtonGroup, Button, Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';

import { useIsPage } from '../../../../hooks';
import { Pages } from '../../../../utils';


export const SuppliersOrdersPageLayout = () => {
  const isOrdersPage = useIsPage(Pages.smSystemOrders);
  const isOrdersParamPage = useIsPage(Pages.smSystemOrderDetails);
  const isSuppliersPage = useIsPage(Pages.smSystemSuppliers);
  const isSuppliersParamPage = useIsPage(Pages.smSystemSupplierDetails);

  return (
    <Box>
      <Stack spacing={2} direction="row" alignItems="center" mb={3}>
        <Typography variant="h6">{'Zamówienia u dostawców:'}</Typography>
        <ButtonGroup variant="outlined">
          <Button
            href={`#${Pages.smSystemOrders}`}
            variant={isOrdersPage || isOrdersParamPage ? 'contained' : 'outlined'}
          >
            {'Zamówienia'}
          </Button>
          <Button
            href={`#${Pages.smSystemSuppliers}`}
            variant={isSuppliersPage || isSuppliersParamPage ? 'contained' : 'outlined'}
          >
            {'Dostawcy'}
          </Button>
        </ButtonGroup>
      </Stack>
      <Container maxWidth="lg">
        <Box display="flex" flexDirection="column">
          <Outlet />
        </Box>
      </Container>
    </Box>
  );
};
