import { SnackbarProvider } from 'notistack';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Navigate, RouterProvider, createHashRouter } from 'react-router-dom';

import { BarcodesGeneratorPage } from './features/BarcodesGenerator/routes/BarcodesGeneratorPage/BarcodesGeneratorPage';
import { InvoiceConverterPage } from './features/invoiceConverter/routers/InvoiceConverterPage/InvoiceConverterPage';
import { GeneratePriceListPage } from './features/priceList/routes/GeneratePriceListPage/GeneratePriceListPage';
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
  ],
  {
    // NOTE: use only in brower (not hash) router
    // basename: '/shop-tools',
  }
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SnackbarProvider>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </SnackbarProvider>
  </React.StrictMode>
);
