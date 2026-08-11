import { Stack, Tab, Tabs } from '@mui/material';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAppSelector } from '../../../../../hooks';
import { Pages } from '../../../../../utils';

const tabs = [
  {
    label: 'Allegro',
    path: Pages.smSystemEcommerceIntegrationsAllegro,
  },
  {
    label: 'WooCommerce',
    path: Pages.smSystemEcommerceIntegrationsWooCommerce,
  },
  {
    label: 'Erli',
    path: Pages.smSystemEcommerceIntegrationsErli,
  },
] as const;

export const EcommerceIntegrationsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.smSystemUser);

  if (!user?.permissions?.canAccessEcommerce)
    return <Navigate to={Pages.smSystem} replace />;

  const activeTab =
    tabs.findIndex((tab) => location.pathname.startsWith(tab.path)) >= 0
      ? tabs.findIndex((tab) => location.pathname.startsWith(tab.path))
      : 0;

  return (
    <Stack spacing={2}>
      <Tabs
        value={activeTab}
        onChange={(_event, value: number) => navigate(tabs[value].path)}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        {tabs.map((tab) => (
          <Tab key={tab.path} label={tab.label} />
        ))}
      </Tabs>

      <Outlet />
    </Stack>
  );
};
