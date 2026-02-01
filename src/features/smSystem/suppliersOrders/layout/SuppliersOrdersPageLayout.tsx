import { Stack, Typography, ButtonGroup, Button, Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

import { useIsPage } from '../../../../hooks';
import { Pages } from '../../../../utils';

export const SuppliersOrdersPageLayout = () => {
  const isOrdersPage = useIsPage([
    Pages.smSystemOrders,
    Pages.smSystemOrderDetails,
  ]);
  const isSuppliersPage = useIsPage([
    Pages.smSystemSuppliers,
    Pages.smSystemSupplierDetails,
  ]);

  const isDetailsPage = useIsPage([
    Pages.smSystemOrderDetails,
    Pages.smSystemSupplierDetails,
  ]);

  return (
    <Box width="100%" flex={1}>
      {!isDetailsPage && (
        <Stack spacing={2} direction="row" alignItems="center" mb={2}>
          <Typography variant="h6">{'Zamówienia u dostawców:'}</Typography>
          <ButtonGroup variant="outlined">
            <Button
              href={`#${Pages.smSystemOrders}`}
              variant={isOrdersPage ? 'contained' : 'outlined'}
            >
              {'Zamówienia'}
            </Button>
            <Button
              href={`#${Pages.smSystemSuppliers}`}
              variant={isSuppliersPage ? 'contained' : 'outlined'}
            >
              {'Dostawcy'}
            </Button>
          </ButtonGroup>
        </Stack>
      )}
      <Outlet />
    </Box>
  );
};
