import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useNotify } from '../../../../hooks';
import { Pages } from '../../../../utils';
import { useApplyProposals } from '../api/useApplyProposals';
import { useGetOrderDetails } from '../api/useGetOrderDetails';
import { DownloadDataModal } from '../components/DownloadDataModal';
import { StockUrgencyLegend } from '../components/StockUrgencyLegend';
import { ProductDetailsInBranchesTable } from '../tables/ProductDetailsInBranchesTable';
import { ProductDetailsInOrderTable } from '../tables/ProductDetailsInOrderTable';
import {
  ProductsInOrderSortBy,
  ProductsInOrderTable,
} from '../tables/ProductsInOrderTable';
import { resolveStockUrgencyThresholds } from '../utils/stockUrgency';

export const OrderDetailsPage = () => {
  const navigate = useNavigate();
  const { notify } = useNotify();
  const { orderId: rawOrderId } = useParams<{ orderId: string }>();
  const orderId = Number(rawOrderId);

  const [isEditing, setIsEditing] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [productSortBy, setProductSortBy] =
    useState<ProductsInOrderSortBy>('stockPriority');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApplyConfirmOpen, setIsApplyConfirmOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const { orderDetails, isLoading } = useGetOrderDetails(orderId);
  const { applyProposals, isApplying } = useApplyProposals();

  useEffect(() => {
    if (!isLoading && !orderDetails) {
      notify('error', 'Nie znaleziono zamówienia o podanym ID');
      navigate(Pages.smSystemOrdersV2);
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
  const differingCount = useMemo(
    () =>
      orderDetails?.productsToOrder.reduce(
        (total, product) =>
          total +
          product.ordersPerBranch.filter(
            (row) => row.toOrderAmount !== row.toOrderProposalAmount,
          ).length,
        0,
      ) ?? 0,
    [orderDetails],
  );

  const urgencyThresholds = useMemo(
    () => resolveStockUrgencyThresholds(orderDetails?.supplier),
    [orderDetails?.supplier],
  );

  const handleConfirmApplyProposals = async () => {
    await applyProposals(orderId);
    setIsApplyConfirmOpen(false);
  };

  return (
    <Stack spacing={2} width="100%">
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
      >
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          minWidth={0}
          flex={1}
        >
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate(Pages.smSystemOrdersV2)}
          >
            {'Powrót'}
          </Button>
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {'Zamówienie: '}
            {supplierName ? `${supplierName} - ${date}` : ''}
          </Typography>
          {orderDetails?.isAutoDraft && (
            <Chip size="small" color="info" label="Auto-szkic" />
          )}
        </Stack>
        <Stack direction="row" spacing={1} flexShrink={0}>
          <Button variant="outlined" size="small" onClick={handleOpenModal}>
            {'Pobierz'}
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => setIsApplyConfirmOpen(true)}
            disabled={differingCount === 0}
          >
            {'Zastosuj wszystkie propozycje'}
          </Button>
        </Stack>
      </Stack>

      <StockUrgencyLegend thresholds={urgencyThresholds} />

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
          <ToggleButtonGroup
            value={productSortBy}
            exclusive
            fullWidth
            size="small"
            color="primary"
            onChange={(_, value: ProductsInOrderSortBy | null) => {
              if (value !== null) setProductSortBy(value);
            }}
            aria-label="Sortowanie produktów"
          >
            <ToggleButton value="stockPriority">{'Pilność stanu'}</ToggleButton>
            <ToggleButton value="name">{'Nazwa'}</ToggleButton>
          </ToggleButtonGroup>
          <Box flex={1} minHeight={0}>
            <ProductsInOrderTable
              isLoading={isLoading}
              products={orderDetails?.productsToOrder ?? []}
              selectedProductId={selectedProductId}
              setSelectedProductId={handleProductSelection}
              filterText={filterText}
              disableSelectingProduct={isEditing}
              urgencyThresholds={urgencyThresholds}
              sortBy={productSortBy}
            />
          </Box>
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
      <Dialog
        open={isApplyConfirmOpen}
        onClose={() => setIsApplyConfirmOpen(false)}
      >
        <DialogTitle>{'Zastosować wszystkie propozycje?'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`Ta akcja wpisze proponowane ilości w ${differingCount} pozycjach. Ręcznie wpisane ilości zostaną nadpisane.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsApplyConfirmOpen(false)}>
            {'Anuluj'}
          </Button>
          <Button
            variant="contained"
            color="warning"
            loading={isApplying}
            onClick={handleConfirmApplyProposals}
          >
            {'Zastosuj'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
