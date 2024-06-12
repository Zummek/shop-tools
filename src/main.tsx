import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Navigate, RouterProvider, createHashRouter } from 'react-router-dom';

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
  ],
  {
    // NOTE: use only in brower (not hash) router
    // basename: '/shop-tools',
  }
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);
