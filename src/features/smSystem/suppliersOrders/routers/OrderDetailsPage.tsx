import { Button, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

import { useGetOrderDetails } from '../api/useGetOrderDetails';
import { ProductDetailsInBranchesTable } from '../tables/ProductDetailsInBranchesTable';
import { ProductDetailsInOrderTable } from '../tables/ProductDetailsInOrderTable';
import { ProductsInOrderTable } from '../tables/ProductsInOrderTable';

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

  const productsInOrderTableData = useMemo(() => {
    return data?.productsToOrder.map(({ id, name, ordersPerBranch }) => {
      const totalToOrder = ordersPerBranch.reduce(
        (sum, order) => sum + order.toOrderAmount,
        0
      );

      return {
        id,
        name,
        totalToOrder,
      };
    }) ?? [];
  }, [data]);
  
  const filteredProductsInOrderTableData = useMemo(() => {
    return productsInOrderTableData.filter((product) =>
      product.name.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [productsInOrderTableData, filterText]);

  const selectedProduct = useMemo(
    () => productsInOrderTableData.find((product) => product.id === selectedProductId),
    [productsInOrderTableData, selectedProductId]
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

  const supplierName = data.supplier.name;
  const branchesNames = data.selectedBranches
    .map((branch) => branch.name)
    .join(', ');
  const date = dayjs(data.updatedAt).format('DD.MM.YYYY HH:MM');

  const handleDownload = () => {
    const filteredProducts = productsInOrderTableData.filter((product) => product.totalToOrder > 0);

    if (filteredProducts.length === 0) 
      return;

    const content =
      `${supplierName} ${date} ${branchesNames}\n\n` +
      filteredProducts
        .map((product, index) => `${index + 1}. ${product.name}\tx${product.totalToOrder}`)
        .join('\n');

    const fileName = `${supplierName} ${date} ${branchesNames}.txt`;
    generateTxtFile(content, fileName);
  };



  return (
    <Stack spacing={2} width="100%" alignItems="center">
      <Typography
        variant="h5"
        color="primary"
        sx={{ flexGrow: 1, textAlign: 'center' }}
      >
        {supplierName} {' - '} {date} {' - '} {branchesNames}
      </Typography>

      <Stack spacing={2} direction="row">
        <Stack spacing={1} width={329} height={418}>
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

        <Stack spacing={1}>
          <Stack direction="row" width="100%" height={162}>
            <Typography
              variant="h5"
              color="primary"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                width: '36%',
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
            {data.productsToOrder[0]?.notSelectedBranches?.length > 0 && (
              <ProductDetailsInBranchesTable
                orderDetails={data}
                selectedProductId={selectedProductId}
              />
            )}
          </Stack>

          <Stack width={710} height={214}>
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
