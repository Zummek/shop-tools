import { Button, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';

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
  const { data, isLoading, isError } = useGetOrderDetails(id);

  const [selectedProductId, setSelectedProductId] = useState<number>(0);

  const [filterText, setFilterText] = useState('');

  const productsInOrderTableData = data?.products_to_order.map(
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
  
  const filteredProductsInOrderTableData = productsInOrderTableData?.filter((product) =>
    product.name.toLowerCase().includes(filterText.toLowerCase())
  );
  


  if (isLoading) {
    return (
      <Stack width="100%" alignItems="center" paddingTop={8}>
        <CircularProgress />
      </Stack>
    );
  }
  
  if (isError || !data) {
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

  if (!data) {
    return (
      <Typography
        variant="h6"
        color="error"
        sx={{ textAlign: 'center', marginTop: 2 }}
      >
        {'Brak danych'}
      </Typography>
    );
  }
  
  if (data.detail === 'No SupplierOrder matches the given query.') {
    return (
      <Typography
        variant="h6"
        color="error"
        sx={{ textAlign: 'center', marginTop: 2, whiteSpace: 'pre-line' }}
      >
        {'Nie znaleziono zamówienia o podanym ID. \n Upewnij się, że wybrany dostawca ma podpięte wszystkie wybrane sklepy'}
      </Typography>
    );
  }

  const productsToOrder = data.products_to_order || [];
  productsToOrder.sort((a, b) => a.id - b.id);

  const supplierName = data.supplier.name;
  const branchesNames = data.selected_branches
    .map((branch) => branch.name)
    .join(', ');
    const dateObj = new Date(data.updated_at);
    const date = `${dateObj.toLocaleDateString('pl-PL')} ${dateObj.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })}`;
    

  const handleDownload = () => {
    const content =
      `${supplierName} ${date} ${branchesNames}\n\n` +
      data.products_to_order
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

  const selectedProduct = productsInOrderTableData?.find(
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
            products={filteredProductsInOrderTableData ?? []}
            selectedProductId={selectedProductId}
            setSelectedProductId={setSelectedProductId}
          />
          <Stack spacing={1} direction="row" justifyContent="center" paddingX={1}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleDownload}
              sx={{ width: '100px', height: '40px' }}
            >
              {'Pobierz'}
            </Button>
            <TextField
              label="Szukaj po nazwie"
              variant="outlined"
              size="small"
              fullWidth
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
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
              orderDetails={data}
              selectedProductId={selectedProductId}
              setSelectedProductId={setSelectedProductId}
            />
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};
