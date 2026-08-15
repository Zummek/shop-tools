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
    Pages.smSystemOrdersV2,
    Pages.smSystemOrderDetailsV2,
  ]);
  const isSuppliersPage = useIsPage([
    Pages.smSystemSuppliersV2,
    Pages.smSystemSupplierDetailsV2,
  ]);
  const isConditionsPage = useIsPage([Pages.smSystemOrderConditionsV2]);

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
          to={Pages.smSystemOrdersV2}
          variant={isOrdersPage ? 'contained' : 'outlined'}
        >
          {'Zamówienia'}
        </Button>
        <Button
          component={Link}
          to={Pages.smSystemSuppliersV2}
          variant={isSuppliersPage ? 'contained' : 'outlined'}
        >
          {'Dostawcy'}
        </Button>
        <Button
          component={Link}
          to={Pages.smSystemOrderConditionsV2}
          variant={isConditionsPage ? 'contained' : 'outlined'}
        >
          {'Warunki'}
        </Button>
      </ButtonGroup>
      {actions}
    </Box>
  );
};
