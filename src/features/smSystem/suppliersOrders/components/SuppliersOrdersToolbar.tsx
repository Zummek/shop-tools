import { Box, Button, ButtonGroup } from '@mui/material';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { useIsPage } from '../../../../hooks';
import { Pages } from '../../../../utils';

interface Props {
  actions?: ReactNode;
}

export const SuppliersOrdersToolbar = ({ actions }: Props) => {
  const isOrdersPage = useIsPage([
    Pages.smSystemOrders,
    Pages.smSystemOrderDetails,
  ]);
  const isSuppliersPage = useIsPage([
    Pages.smSystemSuppliers,
    Pages.smSystemSupplierDetails,
  ]);

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      gap={2}
    >
      <ButtonGroup variant="outlined" size="small">
        <Button
          component={Link}
          to={Pages.smSystemOrders}
          variant={isOrdersPage ? 'contained' : 'outlined'}
        >
          {'Zamówienia'}
        </Button>
        <Button
          component={Link}
          to={Pages.smSystemSuppliers}
          variant={isSuppliersPage ? 'contained' : 'outlined'}
        >
          {'Dostawcy'}
        </Button>
      </ButtonGroup>
      {actions}
    </Box>
  );
};
