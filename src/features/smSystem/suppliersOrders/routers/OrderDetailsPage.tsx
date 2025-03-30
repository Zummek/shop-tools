import { Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { OrderDetails } from '../../app/types/index';
import { useGetOrderDetails } from '../api/useGetOrderDetails';
import ProductDetailsInOrderTable from '../tables/ProductDetailsInOrderTable';
import ProductsInOrderTable from '../tables/ProductsInOrderTable';

const generateTxtFile = (content: string, fileName: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export const OrderDetailsPage = () => {
  const getIdFromUrl = () => {
    const url = window.location.hash;
    const match = url.match(/orders\/(\d+)/);

    if (match) {
      const id = parseInt(match[1], 10);
      return Number.isInteger(id) ? id : 0;
    }
    return 0;
  };

  const id = getIdFromUrl();
  const { orderDetails, isLoading, isError } = useGetOrderDetails(id);

  const [editableOrderDetails, setEditableOrderDetails] =
    useState<OrderDetails | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number>(0);

  useEffect(() => {
    if (orderDetails) {
      setEditableOrderDetails(orderDetails);
      const minProductId = Math.min(
        ...orderDetails.products_to_order.map((product) => product.id)
      );
      setSelectedProductId(minProductId);
    }
  }, [orderDetails]);

  if (isLoading) {
    return (
      <Stack width="100%" alignItems="center" paddingTop={8}>
        <CircularProgress />
      </Stack>
    );
  }
  if (isError || !orderDetails) {
    return (
      <Typography
        variant="h6"
        color="error"
        sx={{ textAlign: 'center', marginTop: 2 }}
      >
        {'Błąd pobierania danych'}
      </Typography>
    );
  }
  if (!editableOrderDetails) return null;

  editableOrderDetails.products_to_order.sort((a, b) => a.id - b.id);

  const supplierName = editableOrderDetails.supplier.name;
  const branchesNames = editableOrderDetails.selected_branches
    .map((branch) => branch.name)
    .join(', ');
  const date = new Date(editableOrderDetails.updated_at).toLocaleDateString(
    'pl-PL'
  );

  const handleDownload = () => {
    const content =
      `${supplierName} ${date} ${branchesNames}\n\n` +
      editableOrderDetails.products_to_order
        .map((product) => {
          const totalToOrder = product.orders_per_branch.reduce(
            (sum, order) => sum + order.to_order_amount,
            0
          );

          return `${product.id}. ${product.name}\tx${totalToOrder}`;
        })
        .join('\n');

    const fileName = `${supplierName} ${date} ${branchesNames}.txt`;
    generateTxtFile(content, fileName);
  };

  const productsInOrderTableData = editableOrderDetails.products_to_order.map(
    ({ id, name, orders_per_branch }) => {
      const totalToOrder = orders_per_branch.reduce(
        (sum, order) => sum + order.to_order_amount,
        0
      );

      return {
        id,
        name,
        totalToOrder,
      };
    }
  );

  const selectedProduct = productsInOrderTableData.find(
    (product) => product.id === selectedProductId
  );

  return (
    <Stack spacing={2} width="100%" alignItems="center">
      <Typography
        variant="h5"
        color="primary"
        sx={{ flexGrow: 1, textAlign: 'center' }}
      >
        {supplierName} {' - '} {date} {' - '} {branchesNames}
      </Typography>

      <Stack spacing={4} direction="row">
        <Stack spacing={1} width={379} height={418}>
          <ProductsInOrderTable
            products={productsInOrderTableData}
            selectedProductId={selectedProductId}
            setSelectedProductId={setSelectedProductId}
          />
          <Stack spacing={1} direction="row" justifyContent="center">
            <Button
              variant="outlined"
              color="primary"
              onClick={handleDownload}
              sx={{ width: '80px', height: '40px' }}
            >
              {'Pobierz'}
            </Button>
          </Stack>
        </Stack>

        <Stack spacing={1} width={570}>
          <Stack direction="row" height={148}>
            <Typography
              variant="h5"
              color="primary"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                width: '30%',
                textAlign: 'center',
                whiteSpace: 'pre-line',
              }}
            >
              {selectedProduct && (
                <>
                  {selectedProduct.id}
                  {'\n'}
                  {selectedProduct.name}
                  {'\n'}
                  {'Suma: '}
                  {selectedProduct.totalToOrder}
                </>
              )}
            </Typography>
          </Stack>

          <Stack height={214}>
            <ProductDetailsInOrderTable
              editableOrderDetails={editableOrderDetails}
              selectedProductId={selectedProductId}
              setSelectedProductId={setSelectedProductId}
            />
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};
