import { Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';

import { LabelData } from '../../../../components';
import { formatPrice } from '../../products/utils';
import { EcommerceOrderDetails, OrderStatus } from '../types';
import { orderStatusMessage } from '../utils/orderStatusMessage';

interface OrderDetailsSectionProps {
  ecommerceOrder: EcommerceOrderDetails;
}

const statusColorMap: Record<
  OrderStatus,
  'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
> = {
  new: 'info',
  receiptPrepared: 'warning',
  packed: 'secondary',
  shipped: 'success',
  canceled: 'error',
};

const FIELD_MIN_WIDTH = 150;

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
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
}: OrderDetailsSectionProps) => {
  const status = ecommerceOrder.status || 'new';

  const orderValue = ecommerceOrder.orderItems
    .filter((item) => item.internalProduct)
    .reduce(
      (total, item) =>
        total +
        (item.internalProduct?.branches?.[0]?.grossPrice || 0) * item.quantity,
      0
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
                  'DD.MM.YYYY HH:mm'
                )}
                minWidth={FIELD_MIN_WIDTH}
              />
              <LabelData
                label="Miejsce zamówienia"
                value={ecommerceOrder.orderSource}
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
              <Stack sx={{ minWidth: FIELD_MIN_WIDTH }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  fontWeight={500}
                >
                  {'Status'}
                </Typography>
                <Chip
                  label={orderStatusMessage[status]}
                  color={statusColorMap[status]}
                  size="small"
                  sx={{ mt: 0.5, width: 'fit-content' }}
                />
              </Stack>
              <LabelData
                label="Metoda płatności"
                value={ecommerceOrder.paymentMethod}
                minWidth={FIELD_MIN_WIDTH}
              />
              <LabelData
                label="Metoda dostawy"
                value={ecommerceOrder.deliveryMethod}
                minWidth={FIELD_MIN_WIDTH}
              />
            </Stack>
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
                label="Ilość pozycji"
                value={ecommerceOrder.itemsAmount}
                minWidth={FIELD_MIN_WIDTH}
              />
              <LabelData
                label="Ilość produktów"
                value={ecommerceOrder.productsAmount}
                minWidth={FIELD_MIN_WIDTH}
              />
              <LabelData
                label="Wartość zamówienia"
                value={`${formatPrice(orderValue)} zł`}
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
                  'DD.MM.YYYY HH:mm'
                )}
                minWidth={FIELD_MIN_WIDTH}
              />
              <LabelData
                label="Data modyfikacji"
                value={dayjs(ecommerceOrder.updatedAt).format(
                  'DD.MM.YYYY HH:mm'
                )}
                minWidth={FIELD_MIN_WIDTH}
              />
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
};
