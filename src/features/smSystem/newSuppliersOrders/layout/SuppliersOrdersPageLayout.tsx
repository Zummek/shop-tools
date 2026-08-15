import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

export const NewSuppliersOrdersPageLayout = () => (
  <Box width="100%" flex={1}>
    <Outlet />
  </Box>
);
