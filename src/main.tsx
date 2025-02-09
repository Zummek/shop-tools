import { SnackbarProvider } from 'notistack';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Navigate, RouterProvider, createHashRouter } from 'react-router-dom';

import { BarcodesGeneratorPage } from './features/BarcodesGenerator/routes/BarcodesGeneratorPage/BarcodesGeneratorPage';
import { InvoiceConverterPage } from './features/invoiceConverter/routers/InvoiceConverterPage/InvoiceConverterPage';
import { GeneratePriceListPage } from './features/priceList/routes/GeneratePriceListPage/GeneratePriceListPage';
import { SmSystemPageLayout } from './features/smSystem/layouts/SmSystemPageLayout';
import { ProductsDocumentsPage } from './features/smSystem/productsDocuments/routers/ProductsDocumentsPage';
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
      element: <Navigate to="/generate-price-list" />,
    },
    {
      path: '/generate-price-list',
      element: <GeneratePriceListPage />,
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
  <React.StrictMode>
    <SnackbarProvider>
      <Provider store={store}>
        <ReactQueryClientProvider>
          <AxiosInterceptorsProvider store={store}>
            <RouterProvider router={router} />
          </AxiosInterceptorsProvider>
        </ReactQueryClientProvider>
      </Provider>
    </SnackbarProvider>
  </React.StrictMode>
);
