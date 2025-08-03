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
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useNotify } from '../../../../hooks';
import { Pages } from '../../../../utils';
import { useGetOrderDetails } from '../api/useGetOrderDetails';
import { DownloadDataModal } from '../components/DownloadDataModal';
import { ProductDetailsInBranchesTable } from '../tables/ProductDetailsInBranchesTable';
import { ProductDetailsInOrderTable } from '../tables/ProductDetailsInOrderTable';
import { ProductsInOrderTable } from '../tables/ProductsInOrderTable';

export const OrderDetailsPage = () => {
  const navigate = useNavigate();
  const { notify } = useNotify();
  const { orderId: rawOrderId } = useParams<{ orderId: string }>();
  const orderId = Number(rawOrderId);

  const [isEditing, setIsEditing] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const { orderDetails, isLoading } = useGetOrderDetails(orderId);

  useEffect(() => {
    if (!isLoading && !orderDetails) {
      notify('error', 'Nie znaleziono zamówienia o podanym ID');
      navigate(Pages.smSystemOrders);
    }
  }, [orderDetails, isLoading, navigate, notify]);

  useEffect(() => {
    if (
      orderDetails &&
      !selectedProductId &&
      orderDetails.productsToOrder.length > 0
    )
      setSelectedProductId(orderDetails.productsToOrder[0].id);
  }, [orderDetails, selectedProductId]);

  const handleEditStateChange = (editing: boolean) => {
    setIsEditing(editing);
  };

  const handleProductSelection = (productId: number | null) => {
    if (!isEditing) setSelectedProductId(productId);
  };

  const supplierName = orderDetails?.supplier.name;
  const date = dayjs(orderDetails?.updatedAt).format('DD.MM.YYYY HH:mm');

  return (
    <Stack spacing={2} width="100%">
      <Stack direction="row" spacing={4} alignItems="center">
        <Button
          variant="outlined"
          onClick={() => navigate(Pages.smSystemOrders)}
        >
          {'Powrót'}
        </Button>
        <Button variant="outlined" onClick={handleOpenModal}>
          {'Pobierz'}
        </Button>
        <Typography variant="h5" color="primary">
          {'Zamówienie: '}
          {supplierName ? `${supplierName} - ${date}` : ''}
        </Typography>
      </Stack>

      <Stack spacing={2} direction="row">
        <Stack spacing={2} width={320} height={616}>
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
          <ProductsInOrderTable
            isLoading={isLoading}
            products={orderDetails?.productsToOrder ?? []}
            selectedProductId={selectedProductId}
            setSelectedProductId={handleProductSelection}
            filterText={filterText}
            disableSelectingProduct={isEditing}
          />
        </Stack>

        <Stack spacing={2} flex={1}>
          <Box height={300}>
            <ProductDetailsInOrderTable
              orderDetails={orderDetails}
              selectedProductId={selectedProductId}
              onEditStateChange={handleEditStateChange}
              isLoading={isLoading}
            />
          </Box>
          <Box height={300}>
            <ProductDetailsInBranchesTable
              orderDetails={orderDetails}
              selectedProductId={selectedProductId}
              isLoading={isLoading}
            />
          </Box>
        </Stack>
      </Stack>
      <DownloadDataModal
        open={isModalOpen}
        handleClose={handleCloseModal}
        orderDetails={orderDetails}
      />
    </Stack>
  );
};
