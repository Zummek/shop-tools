import { Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useMappedOrderDetails } from '../hooks/useMappedOrderDetails';
import ProductDetailsInOrderTable from '../tables/ProductDetailsInOrderTable';
import ProductsInOrderTable from '../tables/ProductsInOrderTable';
import { MappedOrderDetails, ProductInOrderWithTotal } from '../types/index';

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
  const { orderId } = useParams<{ orderId: string }>();

  const { mappedOrderDetails, isLoading, minLp } =
    useMappedOrderDetails(orderId);

  const [editableMappedOrderDetails, setEditableMappedOrderDetails] =
    useState<MappedOrderDetails | null>(null);
  const [selectedProductLp, setSelectedProductLp] = useState<number>(0);
  const [selectedProductData, setSelectedProductData] =
    useState<ProductInOrderWithTotal | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isLoading) return;

    setSelectedProductLp(minLp ?? 0);
    setEditableMappedOrderDetails(mappedOrderDetails);
    setIsDetailsLoading(false);
  }, [mappedOrderDetails, isLoading, minLp]);

  useEffect(() => {
    if (!editableMappedOrderDetails) return;

    const product = editableMappedOrderDetails.productsInOrder.find(
      (product) => product.lp === selectedProductLp
    );

    setSelectedProductData(product || null);
  }, [selectedProductLp, editableMappedOrderDetails]);

  if (isDetailsLoading || (!selectedProductData && selectedProductLp)) {
    return (
      <Stack width="100%" alignItems="center" paddingTop={8}>
        <CircularProgress />
      </Stack>
    );
  }

  if (!editableMappedOrderDetails) {
    return (
      <Typography
        variant="h6"
        color="error"
        sx={{ textAlign: 'center', marginTop: 2 }}
      >
        {'Order not found'}
      </Typography>
    );
  }

  if (!minLp || !selectedProductData) {
    return (
      <Typography
        variant="h6"
        color="error"
        sx={{ textAlign: 'center', marginTop: 2 }}
      >
        {'Products not found'}
      </Typography>
    );
  }

  const supplierName = editableMappedOrderDetails.supplier.name;
  const branchesNames = editableMappedOrderDetails.branchesNames;
  const date = new Date(
    editableMappedOrderDetails.createdAt
  ).toLocaleDateString('pl-PL');

  const handleDownload = () => {
    const content =
      `${supplierName} ${date} ${branchesNames}\n\n` +
      editableMappedOrderDetails.productsInOrder
        .map((product) => {
          return `${product.lp}. ${product.product.name}\tx${product.totalToOrder}`;
        })
        .join('\n');
    const fileName = `${supplierName} ${date} ${branchesNames}.txt`;
    generateTxtFile(content, fileName);
  };

  const handleSave = () => {};

  const productsInOrderTableData =
    editableMappedOrderDetails.productsInOrder.map(
      ({ lp, product, totalToOrder }) => ({
        lp,
        name: product.name,
        totalToOrder,
      })
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
            selectedProductLp={selectedProductLp}
            setSelectedProductLp={setSelectedProductLp}
          />
          <Stack spacing={1} direction="row" justifyContent="center">
            <Button
              variant="outlined"
              color="primary"
              onClick={handleSave}
              sx={{ width: '80px', height: '40px' }}
            >
              {'Zapisz'}
            </Button>
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
              {selectedProductData.product.name}
              {'\n'}
              {'Suma: '}
              {selectedProductData.totalToOrder}
            </Typography>
          </Stack>

          <Stack height={214}>
            <ProductDetailsInOrderTable
              editableOrderDetails={editableMappedOrderDetails}
              setEditableOrderDetails={setEditableMappedOrderDetails}
              selectedProductLp={selectedProductLp}
              setSelectedProductLp={setSelectedProductLp}
            />
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};
