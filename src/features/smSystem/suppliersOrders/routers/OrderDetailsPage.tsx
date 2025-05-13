import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import {
  Box,
  Button,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useNotify } from '../../../../hooks';
import { Pages } from '../../../../utils';
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
  const navigate = useNavigate();
  const { notify } = useNotify();
  const { orderId: rawOrderId } = useParams<{ orderId: string }>();
  const orderId = Number(rawOrderId);

  const { orderDetails, isLoading } = useGetOrderDetails(orderId);

  useEffect(() => {
    if (!isLoading && !orderDetails) {
      notify('error', 'Nie znaleziono zamówienia o podanym ID');
      navigate(Pages.smSystemOrders);
    }
  }, [orderDetails, isLoading, navigate, notify]);

  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [filterText, setFilterText] = useState('');

  const productsInOrderTableData = useMemo(() => {
    return (
      orderDetails?.productsToOrder?.map(({ id, name, ordersPerBranch }) => {
        const totalToOrder = ordersPerBranch.reduce(
          (sum, order) => sum + order.toOrderAmount,
          0
        );

        return {
          id,
          name,
          totalToOrder,
        };
      }) ?? []
    );
  }, [orderDetails]);

  const supplierName = orderDetails?.supplier.name;
  const date = dayjs(orderDetails?.updatedAt).format('DD.MM.YYYY HH:mm');

  const handleDownload = () => {
    const branchesNames = orderDetails?.selectedBranches
      .map((branch) => branch.name)
      .join(', ');
    const filteredProducts = productsInOrderTableData.filter(
      (product) => product.totalToOrder > 0
    );

    if (filteredProducts.length === 0) return;

    const content =
      `${supplierName} ${date} ${branchesNames}\n\n` +
      filteredProducts
        .map(
          (product, index) =>
            `${index + 1}. ${product.name}\tx${product.totalToOrder}`
        )
        .join('\n');

    const fileName = `${supplierName}-${date}.txt`;
    generateTxtFile(content, fileName);
  };

  return (
    <Stack spacing={2} width="100%">
      <Stack direction="row" spacing={3} alignItems="center">
        <Button
          variant="outlined"
          onClick={() => navigate(Pages.smSystemOrders)}
        >
          {'Powrót'}
        </Button>
        <Typography variant="h5" color="primary">
          {'Zamówienie: '}
          {supplierName} {' - '} {date}
        </Typography>
      </Stack>

      <Stack spacing={2} direction="row">
        <Stack spacing={2} width={320} height={516}>
          <Stack spacing={2} direction="row" justifyContent="center">
            <Button variant="outlined" onClick={handleDownload}>
              {'Pobierz'}
            </Button>
            <TextField
              label="Szukaj po nazwie"
              variant="outlined"
              size="small"
              fullWidth
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              slotProps={{
                input: {
                  endAdornment:
                    filterText.length > 0 ? (
                      <InputAdornment position="end">
                        <ClearOutlinedIcon
                          onClick={() => setFilterText('')}
                          sx={{ cursor: 'pointer' }}
                        />
                      </InputAdornment>
                    ) : null,
                },
              }}
            />
          </Stack>
          <ProductsInOrderTable
            isLoading={isLoading}
            products={orderDetails?.productsToOrder ?? []}
            selectedProductId={selectedProductId}
            setSelectedProductId={setSelectedProductId}
            filterText={filterText}
          />
        </Stack>

        <Stack spacing={2} flex={1}>
          <Box height={250}>
            <ProductDetailsInOrderTable
              orderDetails={orderDetails}
              selectedProductId={selectedProductId}
            />
          </Box>
          <Box height={250}>
            <ProductDetailsInBranchesTable
              orderDetails={orderDetails}
              selectedProductId={selectedProductId}
            />
          </Box>
        </Stack>
      </Stack>
    </Stack>
  );
};
