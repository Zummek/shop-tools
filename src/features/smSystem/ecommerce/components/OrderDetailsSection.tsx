import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useState, type ReactNode } from 'react';

import { LabelData } from '../../../../components';
import { formatPrice } from '../../products/utils';
import { EcommerceOrderDetails, OrderStatus } from '../types';
import {
  NEXT_ORDER_STATUS,
  canRefreshOrderStatus,
  channelLabel,
  externalStatusLabel,
  orderStatusConfig,
  SM_TO_WOO_STATUS,
  WOO_STATUS_OPTIONS,
  WooStatusValue,
  wooStatusLabel,
} from '../utils';

import { OrderStatusChip } from './OrderStatusChip';
import { WooStatusChip } from './WooStatusChip';

interface OrderDetailsSectionProps {
  ecommerceOrder: EcommerceOrderDetails;
  isUpdatingStatus?: boolean;
  onSmStatusChange?: (status: OrderStatus) => void;
  onWooStatusChange?: (wooStatus: WooStatusValue) => void;
  onRefreshChannelStatus?: () => void;
}

const FIELD_MIN_WIDTH = 100;

const SectionHeader = ({ children }: { children: ReactNode }) => (
  <Typography
    variant="subtitle1"
    fontWeight={600}
    color="text.primary"
    sx={{ mb: 1.5 }}
  >
    {children}
  </Typography>
);

export const OrderDetailsSection = ({
  ecommerceOrder,
  isUpdatingStatus = false,
  onSmStatusChange,
  onWooStatusChange,
  onRefreshChannelStatus,
}: OrderDetailsSectionProps) => {
  const status = ecommerceOrder.status || 'new';
  const isWooOrder = ecommerceOrder.orderSource === 'woocommerce';
  const channelName = channelLabel(ecommerceOrder.orderSource);
  const showRefresh =
    !!onRefreshChannelStatus &&
    canRefreshOrderStatus(
      ecommerceOrder.orderSource,
      status,
      ecommerceOrder.externalStatus,
    );

  const nextStatus = NEXT_ORDER_STATUS[status];
  const canCancel = status !== 'shipped' && status !== 'canceled';

  const [selectedWooStatus, setSelectedWooStatus] = useState<WooStatusValue>(
    (ecommerceOrder.externalStatus as WooStatusValue) || 'processing',
  );
  const [confirmWooOpen, setConfirmWooOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  useEffect(() => {
    if (
      ecommerceOrder.externalStatus &&
      WOO_STATUS_OPTIONS.some((o) => o.value === ecommerceOrder.externalStatus)
    )
      setSelectedWooStatus(ecommerceOrder.externalStatus as WooStatusValue);
  }, [ecommerceOrder.externalStatus]);

  const wooStatusDirty =
    selectedWooStatus !== (ecommerceOrder.externalStatus || '');

  const internalOrderValue = ecommerceOrder.orderItems.reduce(
    (total, item) =>
      total +
      (item.internalProduct?.branches?.[0]?.grossPrice || 0) * item.quantity,
    0,
  );

  const externalOrderValue = ecommerceOrder.orderItems.reduce(
    (total, item) => total + item.externalPricePerItem * item.quantity,
    0,
  );

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Stack spacing={3}>
        <Stack>
          <SectionHeader>{'📦 Informacje o zamówieniu'}</SectionHeader>
          <Stack spacing={2}>
            <Stack direction="row" flexWrap="wrap" gap={4}>
              <LabelData
                label="Data zamówienia"
                value={dayjs(ecommerceOrder.orderDate).format(
                  'DD.MM.YYYY HH:mm',
                )}
                minWidth={FIELD_MIN_WIDTH}
              />
              <LabelData
                label="Miejsce zamówienia"
                value={channelName}
                minWidth={FIELD_MIN_WIDTH}
              />
              <LabelData
                label="ID zamówienia"
                value={ecommerceOrder.externalId}
                minWidth={280}
              />
            </Stack>
            <Stack
              direction="row"
              flexWrap="wrap"
              gap={4}
              alignItems="flex-start"
            >
              <LabelData
                label="Metoda płatności"
                value={ecommerceOrder.paymentMethod}
                minWidth={FIELD_MIN_WIDTH}
              />
              {ecommerceOrder.deliveryGroupName ? (
                <>
                  <LabelData
                    label="Dostawa"
                    value={ecommerceOrder.deliveryGroupName}
                    minWidth={FIELD_MIN_WIDTH}
                  />
                  <LabelData
                    label="Szczegóły dostawy"
                    value={ecommerceOrder.deliveryName}
                    minWidth={FIELD_MIN_WIDTH}
                  />
                </>
              ) : (
                <LabelData
                  label="Metoda dostawy"
                  value={ecommerceOrder.deliveryName}
                  minWidth={FIELD_MIN_WIDTH}
                />
              )}
              <LabelData
                label="Faktura"
                value={
                  ecommerceOrder.invoiceRequired ? 'Wymagana Faktura' : 'brak'
                }
                minWidth={FIELD_MIN_WIDTH}
                weight={ecommerceOrder.invoiceRequired ? 'medium' : undefined}
                valueColor={
                  ecommerceOrder.invoiceRequired ? 'primary' : 'text.secondary'
                }
              />
            </Stack>
            <Stack direction="row" flexWrap="wrap" gap={4}>
              <Stack spacing={0.5} sx={{ minWidth: FIELD_MIN_WIDTH }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  fontWeight={500}
                >
                  {'Status SM'}
                </Typography>
                <OrderStatusChip status={status} />
              </Stack>
              {isWooOrder ? (
                <Stack spacing={0.5} sx={{ minWidth: FIELD_MIN_WIDTH }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    fontWeight={500}
                  >
                    {'Status Woo'}
                  </Typography>
                  <WooStatusChip
                    status={status}
                    externalStatus={ecommerceOrder.externalStatus}
                  />
                </Stack>
              ) : (
                <Stack spacing={0.5} sx={{ minWidth: FIELD_MIN_WIDTH }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    fontWeight={500}
                  >
                    {`Status ${channelName}`}
                  </Typography>
                  <Chip
                    label={externalStatusLabel(
                      ecommerceOrder.orderSource,
                      ecommerceOrder.externalStatus,
                    )}
                    variant="outlined"
                    size="small"
                    sx={{ width: 'fit-content' }}
                  />
                </Stack>
              )}
            </Stack>

            {onSmStatusChange && (nextStatus || canCancel || showRefresh) && (
              <Stack spacing={1}>
                <Stack direction="row" flexWrap="wrap" gap={1.5}>
                  {nextStatus && (
                    <LoadingButton
                      variant="contained"
                      loading={isUpdatingStatus}
                      onClick={() => onSmStatusChange(nextStatus)}
                    >
                      {`Oznacz jako: ${orderStatusConfig[nextStatus].label}`}
                    </LoadingButton>
                  )}
                  {canCancel && (
                    <Button
                      variant="outlined"
                      color="error"
                      disabled={isUpdatingStatus}
                      onClick={() => setConfirmCancelOpen(true)}
                    >
                      {'Anuluj zamówienie'}
                    </Button>
                  )}
                  {showRefresh && (
                    <LoadingButton
                      variant="outlined"
                      loading={isUpdatingStatus}
                      onClick={() => onRefreshChannelStatus?.()}
                    >
                      {`Odśwież status z ${channelName}`}
                    </LoadingButton>
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {
                    'Zmiana statusu SM dotyczy tylko workflow magazynowego — nie wysyła zmian do sklepu.'
                  }
                </Typography>
              </Stack>
            )}

            {isWooOrder && onWooStatusChange && (
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {'Aktualizuj status WooCommerce'}
                </Typography>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  alignItems={{ sm: 'center' }}
                >
                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <InputLabel id="woo-status-select-label">
                      {'Status Woo'}
                    </InputLabel>
                    <Select
                      labelId="woo-status-select-label"
                      label="Status Woo"
                      value={selectedWooStatus}
                      onChange={(e) =>
                        setSelectedWooStatus(e.target.value as WooStatusValue)
                      }
                      disabled={isUpdatingStatus}
                    >
                      {WOO_STATUS_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <LoadingButton
                    variant="outlined"
                    loading={isUpdatingStatus}
                    disabled={!wooStatusDirty}
                    onClick={() => setConfirmWooOpen(true)}
                  >
                    {'Zapisz w WooCommerce'}
                  </LoadingButton>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {`Status SM „${orderStatusConfig[status].label}” odpowiada statusowi „${wooStatusLabel(
                    SM_TO_WOO_STATUS[status],
                  )}” w WooCommerce.`}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Stack>

        <Divider />

        <Stack>
          <SectionHeader>{'👤 Kupujący'}</SectionHeader>
          <Stack spacing={2}>
            <Stack direction="row" flexWrap="wrap" gap={4}>
              <LabelData
                label="Login"
                value={ecommerceOrder.buyerLogin}
                minWidth={FIELD_MIN_WIDTH}
              />
              <LabelData
                label="Imię i nazwisko"
                value={ecommerceOrder.buyerName}
                minWidth={FIELD_MIN_WIDTH}
              />
              <LabelData
                label="Kontakt"
                value={ecommerceOrder.buyerContact}
                minWidth={FIELD_MIN_WIDTH}
              />
            </Stack>
            <Stack direction="row" flexWrap="wrap" gap={4}>
              <LabelData
                label="Adres"
                value={ecommerceOrder.buyerAddress}
                minWidth={300}
              />
              <LabelData
                label="Wiadomość od kupującego"
                value={ecommerceOrder.messageFromBuyer || 'brak'}
                minWidth={300}
              />
            </Stack>
          </Stack>
        </Stack>

        <Divider />

        <Stack direction="row" flexWrap="wrap" gap={6}>
          <Stack>
            <SectionHeader>{'📊 Podsumowanie'}</SectionHeader>
            <Stack direction="row" flexWrap="wrap" gap={4}>
              <LabelData
                label="Ilość pozycji / produktów"
                value={`${ecommerceOrder.itemsAmount} / ${ecommerceOrder.productsAmount}`}
                minWidth={FIELD_MIN_WIDTH}
              />
              <LabelData
                label="Koszt dostawy"
                value={
                  ecommerceOrder.deliveryCost !== null
                    ? `${formatPrice(ecommerceOrder.deliveryCost)} ${ecommerceOrder.deliveryCostCurrency}`
                    : '-'
                }
                minWidth={FIELD_MIN_WIDTH}
                valueColor={
                  ecommerceOrder.deliveryCost !== null
                    ? 'primary'
                    : 'text.secondary'
                }
                weight={
                  ecommerceOrder.deliveryCost !== null ? 'medium' : undefined
                }
              />
              <LabelData
                label="Zew. wartość zamówienia"
                value={`${formatPrice(externalOrderValue)} ${ecommerceOrder.orderItems[0]?.externalCurrency ?? ''}`}
                minWidth={FIELD_MIN_WIDTH}
              />
              <LabelData
                label="Wew. wartość zamówienia"
                value={`${formatPrice(internalOrderValue)} PLN`}
                minWidth={FIELD_MIN_WIDTH}
              />
            </Stack>
          </Stack>
          <Divider orientation="vertical" flexItem />

          <Stack>
            <SectionHeader>{'🕐 Historia'}</SectionHeader>
            <Stack direction="row" flexWrap="wrap" gap={4}>
              <LabelData
                label="Data zaimportowania"
                value={dayjs(ecommerceOrder.createdAt).format(
                  'DD.MM.YYYY HH:mm',
                )}
                minWidth={FIELD_MIN_WIDTH}
              />
              <LabelData
                label="Data modyfikacji"
                value={dayjs(ecommerceOrder.updatedAt).format(
                  'DD.MM.YYYY HH:mm',
                )}
                minWidth={FIELD_MIN_WIDTH}
              />
            </Stack>
          </Stack>
        </Stack>
      </Stack>

      <Dialog open={confirmWooOpen} onClose={() => setConfirmWooOpen(false)}>
        <DialogTitle>{'Potwierdź zmianę statusu WooCommerce'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`Ustawić status w WooCommerce na „${wooStatusLabel(
              selectedWooStatus,
            )}”? Status SM nie zmieni się.`}
          </DialogContentText>
          <Alert severity="warning" sx={{ mt: 2 }}>
            {
              'Ta operacja nadpisze status zamówienia w sklepie. Używaj ostrożnie.'
            }
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmWooOpen(false)}>{'Anuluj'}</Button>
          <LoadingButton
            variant="contained"
            color="error"
            loading={isUpdatingStatus}
            onClick={() => {
              setConfirmWooOpen(false);
              onWooStatusChange?.(selectedWooStatus);
            }}
          >
            {'Potwierdź i zapisz w Woo'}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
      >
        <DialogTitle>{'Anulować zamówienie?'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {
              'Status SM zostanie ustawiony na „Anulowane”. Status w sklepie nie zmieni się automatycznie.'
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmCancelOpen(false)}>{'Wróć'}</Button>
          <LoadingButton
            variant="contained"
            color="error"
            loading={isUpdatingStatus}
            onClick={() => {
              setConfirmCancelOpen(false);
              onSmStatusChange?.('canceled');
            }}
          >
            {'Anuluj zamówienie'}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
