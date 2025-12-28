import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { SnackbarProvider } from 'notistack';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Navigate, RouterProvider, createHashRouter } from 'react-router-dom';

import { BarcodesGeneratorPage } from './features/BarcodesGenerator/routes/BarcodesGeneratorPage/BarcodesGeneratorPage';
import { InvoiceConverterPage } from './features/invoiceConverter/routers/InvoiceConverterPage/InvoiceConverterPage';
import { EcommerceAllegroIntegrationPage } from './features/smSystem/ecommerce/routers/EcommerceAllegroIntegrationPage';
import { EcommerceOrderDetailsPage } from './features/smSystem/ecommerce/routers/EcommerceOrderDetailsPage';
import { EcommerceOrdersListPage } from './features/smSystem/ecommerce/routers/EcommerceOrdersListPage';
import { SmSystemPageLayout } from './features/smSystem/layouts/SmSystemPageLayout';
import { PriceTagsGroupDetailsPage } from './features/smSystem/priceTags/routers/PriceTagsGroupDetailsPage';
import { PriceTagsGroupsPage } from './features/smSystem/priceTags/routers/PriceTagsGroupsPage';
import { ImportProductsPage } from './features/smSystem/products/routers/ImportProductsPage/ImportProductsPage';
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
import { ReactQueryClientProvider, setReduxStoreForAxios } from './services';
import { AxiosInterceptorsProvider } from './services/AxiosInterceptorsProvider';
import { store } from './store/store';

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
              path: 'allegro',
              element: <EcommerceAllegroIntegrationPage />,
            },
          ],
        },
      ],
    },
    {
      path: '*',
      element: <Navigate to="/generate-price-list" />,
    },
  ],
  {
    // NOTE: use only in brower (not hash) router
    // basename: '/shop-tools',
  }
);

setReduxStoreForAxios(store);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <SnackbarProvider>
    <Provider store={store}>
      <ReactQueryClientProvider>
        <AxiosInterceptorsProvider store={store}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <RouterProvider router={router} />
          </LocalizationProvider>
        </AxiosInterceptorsProvider>
      </ReactQueryClientProvider>
    </Provider>
  </SnackbarProvider>
);
