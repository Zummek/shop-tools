import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import * as Sentry from '@sentry/react';
import { SnackbarProvider } from 'notistack';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Navigate, RouterProvider, createHashRouter } from 'react-router-dom';

import { BarcodesGeneratorPage } from './features/BarcodesGenerator/routes/BarcodesGeneratorPage/BarcodesGeneratorPage';
import { InvoiceConverterPage } from './features/invoiceConverter/routers/InvoiceConverterPage/InvoiceConverterPage';
import { AlertsListPage } from './features/smSystem/alerts/routers/AlertsListPage/AlertsListPage';
import { EcommerceOrderDetailsPage } from './features/smSystem/ecommerce/routers/EcommerceOrderDetailsPage';
import { EcommerceOrdersListPage } from './features/smSystem/ecommerce/routers/EcommerceOrdersListPage';
import { PriceSchedulesPage } from './features/smSystem/ecommerce/routers/PriceSchedulesPage';
import { EcommerceIntegrationsPage } from './features/smSystem/ecommerce/routers/integrations/EcommerceIntegrationsPage';
import { IntegrationsAllegroPanel } from './features/smSystem/ecommerce/routers/integrations/IntegrationsAllegroPanel';
import { IntegrationsErliPanel } from './features/smSystem/ecommerce/routers/integrations/IntegrationsErliPanel';
import { IntegrationsWooCommercePanel } from './features/smSystem/ecommerce/routers/integrations/IntegrationsWooCommercePanel';
import { InvoiceDetailsPage } from './features/smSystem/invoices/routers/InvoiceDetailsPage';
import { InvoicesListPage } from './features/smSystem/invoices/routers/InvoicesListPage';
import { SmSystemPageLayout } from './features/smSystem/layouts/SmSystemPageLayout';
import { NewSuppliersOrdersPageLayout } from './features/smSystem/newSuppliersOrders/layout/SuppliersOrdersPageLayout';
import { ConditionsPage as V2ConditionsPage } from './features/smSystem/newSuppliersOrders/routers/ConditionsPage';
import { OrderDetailsPage as V2OrderDetailsPage } from './features/smSystem/newSuppliersOrders/routers/OrderDetailsPage';
import { OrdersPage as V2OrdersPage } from './features/smSystem/newSuppliersOrders/routers/OrdersPage';
import { SupplierDetailsPage as V2SupplierDetailsPage } from './features/smSystem/newSuppliersOrders/routers/SupplierDetailsPage';
import { SuppliersPage as V2SuppliersPage } from './features/smSystem/newSuppliersOrders/routers/SuppliersPage';
import { PriceTagsGroupDetailsPage } from './features/smSystem/priceTags/routers/PriceTagsGroupDetailsPage';
import { PriceTagsGroupsPage } from './features/smSystem/priceTags/routers/PriceTagsGroupsPage';
import { ImportProductsPage } from './features/smSystem/products/routers/ImportProductsPage/ImportProductsPage';
import { ProductDetailsPage } from './features/smSystem/products/routers/ProductDetailsPage/ProductDetailsPage';
import { ProductsListPage } from './features/smSystem/products/routers/ProductsListPage/ProductsListPage';
import { ProductsDocumentsPage } from './features/smSystem/productsDocuments/routers/ProductsDocumentsPage';
import { ReportsPage } from './features/smSystem/reports/routers/ReportsPage';
import { UnfulfilledOrdersByTransfersReportPage } from './features/smSystem/reports/routers/UnfulfilledOrdersByTransfersReportPage';
import { SuppliersOrdersPageLayout } from './features/smSystem/suppliersOrders/layout/SuppliersOrdersPageLayout';
import { OrderDetailsPage } from './features/smSystem/suppliersOrders/routers/OrderDetailsPage';
import { OrdersPage } from './features/smSystem/suppliersOrders/routers/OrdersPage';
import { SupplierDetailsPage } from './features/smSystem/suppliersOrders/routers/SupplierDetailsPage';
import { SuppliersPage } from './features/smSystem/suppliersOrders/routers/SuppliersPage';
import { TransfersPage } from './features/smSystem/transfers/routers/TransfersPage';
import { LoginPage } from './features/smSystem/user/routes/LoginPage';
import {
  ReactQueryClientProvider,
  SentryContext,
  initSentry,
  setReduxStoreForAxios,
} from './services';
import { AxiosInterceptorsProvider } from './services/AxiosInterceptorsProvider';
import { store } from './store/store';

initSentry();

const router = createHashRouter(
  [
    {
      path: '/',
      index: true,
      element: <Navigate to="/barcodes-generator" />,
    },
    {
      path: '/barcodes-generator',
      element: <BarcodesGeneratorPage />,
    },
    {
      path: '/invoice-converter',
      element: <InvoiceConverterPage />,
    },
    {
      path: '/sm-system',
      element: <SmSystemPageLayout />,
      children: [
        {
          index: true,
          element: <Navigate to="/sm-system/login" />,
        },
        {
          path: 'login',
          element: <LoginPage />,
        },
        {
          path: 'transfers',
          element: <TransfersPage />,
        },
        {
          path: 'products-documents',
          element: <ProductsDocumentsPage />,
        },
        {
          path: 'import-products',
          element: <ImportProductsPage />,
        },
        {
          path: 'products',
          element: <ProductsListPage />,
        },
        {
          path: 'products/:productId',
          element: <ProductDetailsPage />,
        },
        {
          path: 'reports',
          element: <ReportsPage />,
        },
        {
          path: 'unfulfilled-orders-by-transfers',
          element: <UnfulfilledOrdersByTransfersReportPage />,
        },
        {
          path: 'suppliers-orders',
          element: <SuppliersOrdersPageLayout />,
          children: [
            {
              path: 'suppliers',
              element: <SuppliersPage />,
            },
            {
              path: 'suppliers/:supplierId',
              element: <SupplierDetailsPage />,
            },
            {
              path: 'orders',
              index: true,
              element: <OrdersPage />,
            },
            {
              path: 'orders/:orderId',
              element: <OrderDetailsPage />,
            },
          ],
        },
        {
          path: 'suppliers-orders-v2',
          element: <NewSuppliersOrdersPageLayout />,
          children: [
            {
              index: true,
              element: <Navigate to="/sm-system/suppliers-orders-v2/orders" />,
            },
            {
              path: 'suppliers',
              element: <V2SuppliersPage />,
            },
            {
              path: 'suppliers/:supplierId',
              element: <V2SupplierDetailsPage />,
            },
            {
              path: 'orders',
              element: <V2OrdersPage />,
            },
            {
              path: 'orders/:orderId',
              element: <V2OrderDetailsPage />,
            },
            {
              path: 'conditions',
              element: <V2ConditionsPage />,
            },
          ],
        },
        {
          path: 'price-tags',
          children: [
            {
              path: 'groups',
              element: <PriceTagsGroupsPage />,
            },
            {
              path: 'groups/:groupId',
              element: <PriceTagsGroupDetailsPage />,
            },
          ],
        },
        {
          path: 'ecommerce',
          children: [
            {
              path: 'orders',
              element: <EcommerceOrdersListPage />,
            },
            {
              path: 'orders/:orderId',
              element: <EcommerceOrderDetailsPage />,
            },
            {
              path: 'price-schedules',
              element: <PriceSchedulesPage />,
            },
            {
              path: 'integrations',
              element: <EcommerceIntegrationsPage />,
              children: [
                {
                  index: true,
                  element: (
                    <Navigate
                      to="/sm-system/ecommerce/integrations/allegro"
                      replace
                    />
                  ),
                },
                {
                  path: 'allegro',
                  element: <IntegrationsAllegroPanel />,
                },
                {
                  path: 'woocommerce',
                  element: <IntegrationsWooCommercePanel />,
                },
                {
                  path: 'erli',
                  element: <IntegrationsErliPanel />,
                },
              ],
            },
            {
              path: 'allegro',
              element: (
                <Navigate
                  to="/sm-system/ecommerce/integrations/allegro"
                  replace
                />
              ),
            },
          ],
        },
        {
          path: 'invoices',
          element: <InvoicesListPage />,
        },
        {
          path: 'invoices/:invoiceId',
          element: <InvoiceDetailsPage />,
        },
        {
          path: 'alerts',
          element: <AlertsListPage />,
        },
      ],
    },
    {
      path: '*',
      element: <Navigate to="/sm-system" />,
    },
  ],
  {
    // NOTE: use only in brower (not hash) router
    // basename: '/shop-tools',
  },
);

setReduxStoreForAxios(store);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Sentry.ErrorBoundary
    fallback={<p>Wystąpił nieoczekiwany błąd. Odśwież stronę.</p>}
  >
    <SnackbarProvider>
      <Provider store={store}>
        <SentryContext>
          <ReactQueryClientProvider>
            <AxiosInterceptorsProvider store={store}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <RouterProvider router={router} />
              </LocalizationProvider>
            </AxiosInterceptorsProvider>
          </ReactQueryClientProvider>
        </SentryContext>
      </Provider>
    </SnackbarProvider>
  </Sentry.ErrorBoundary>,
);
