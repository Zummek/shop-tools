import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import CableOutlinedIcon from '@mui/icons-material/CableOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import { ReactNode } from 'react';
import { matchPath } from 'react-router-dom';

import { Pages } from './pages';

export type NavPermission =
  | 'canAccessEcommerce'
  | 'canViewPurchasePrices'
  | 'canViewAlerts';

export interface NavItem {
  label: string;
  path: Pages;
  icon: ReactNode;
  permission?: NavPermission;
  activePaths?: Pages[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface AppSwitcherItem {
  label: string;
  path: Pages;
}

export const appSwitcherItems: AppSwitcherItem[] = [
  { label: 'Generuj kody kreskowe', path: Pages.barcodesGenerator },
  { label: 'Konwerter faktur', path: Pages.invoiceConverter },
  { label: 'SM System', path: Pages.smSystem },
];

export const navSections: NavSection[] = [
  {
    title: 'Magazyn',
    items: [
      {
        label: 'Transfery',
        path: Pages.smSystemTransfers,
        icon: <SwapHorizOutlinedIcon />,
      },
      {
        label: 'Dokumenty',
        path: Pages.smSystemProductsDocuments,
        icon: <ArticleOutlinedIcon />,
      },
      {
        label: 'Etykiety cenowe',
        path: Pages.smSystemPriceTagsGroups,
        icon: <SellOutlinedIcon />,
        activePaths: [Pages.smSystemPriceTagsGroupDetails],
      },
      {
        label: 'Produkty',
        path: Pages.smSystemProducts,
        icon: <Inventory2OutlinedIcon />,
        permission: 'canAccessEcommerce',
        activePaths: [Pages.smSystemProductDetails],
      },
    ],
  },
  {
    title: 'Zakupy',
    items: [
      {
        label: 'Zamówienia u dostawców',
        path: Pages.smSystemOrders,
        icon: <LocalShippingOutlinedIcon />,
        activePaths: [
          Pages.smSystemSuppliers,
          Pages.smSystemSupplierDetails,
          Pages.smSystemOrderDetails,
        ],
      },
      {
        label: 'Faktury',
        path: Pages.smSystemInvoices,
        icon: <ReceiptLongOutlinedIcon />,
        permission: 'canViewPurchasePrices',
        activePaths: [Pages.smSystemInvoiceDetails],
      },
    ],
  },
  {
    title: 'E-commerce',
    items: [
      {
        label: 'Zamówienia',
        path: Pages.smSystemEcommerceOrders,
        icon: <ShoppingCartOutlinedIcon />,
        permission: 'canAccessEcommerce',
        activePaths: [Pages.smSystemEcommerceOrderDetails],
      },
      {
        label: 'Integracje',
        path: Pages.smSystemEcommerceIntegrations,
        icon: <CableOutlinedIcon />,
        permission: 'canAccessEcommerce',
        activePaths: [
          Pages.smSystemEcommerceIntegrationsAllegro,
          Pages.smSystemEcommerceIntegrationsWooCommerce,
          Pages.smSystemEcommerceIntegrationsErli,
        ],
      },
    ],
  },
  {
    title: 'Analizy',
    items: [
      {
        label: 'Raporty',
        path: Pages.smSystemReports,
        icon: <BarChartOutlinedIcon />,
        activePaths: [Pages.smSystemUnfulfilledOrdersByTransfersReport],
      },
    ],
  },
  {
    title: 'Alerty',
    items: [
      {
        label: 'Alerty',
        path: Pages.smSystemAlerts,
        icon: <NotificationsOutlinedIcon />,
        permission: 'canViewAlerts',
      },
    ],
  },
];

export const isNavItemActive = (item: NavItem, pathname: string): boolean => {
  const paths = [item.path, ...(item.activePaths ?? [])];
  return paths.some((path) => matchPath(path, pathname));
};

export const getActiveNavItem = (pathname: string): NavItem | undefined =>
  navSections
    .flatMap((section) => section.items)
    .find((item) => isNavItemActive(item, pathname));

export const filterNavSectionsByPermissions = (
  permissions?: Partial<Record<NavPermission, boolean>>,
): NavSection[] =>
  navSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.permission || !!permissions?.[item.permission],
      ),
    }))
    .filter((section) => section.items.length > 0);
