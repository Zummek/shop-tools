import { Stack } from '@mui/material';
import dayjs from 'dayjs';

import { LabelData } from '../../../../components';
import { EcommerceOrderDetails } from '../types';
import { orderStatusMessage } from '../utils/orderStatusMessage';

interface OrderDetailsSectionProps {
  ecommerceOrder: EcommerceOrderDetails;
}

export const OrderDetailsSection = ({
  ecommerceOrder,
}: OrderDetailsSectionProps) => {
  return (
    <Stack spacing={2}>
      <Stack spacing={6} direction="row" flexWrap="wrap">
        <LabelData
          label="Data zamówienia"
          value={dayjs(ecommerceOrder.orderDate).format('DD.MM.YYYY HH:mm')}
        />
        <LabelData
          label="Miejsce zamówienia"
          value={ecommerceOrder.orderSource}
        />
        <LabelData label="ID zamówienia" value={ecommerceOrder.externalId} />
      </Stack>
      <Stack spacing={6} direction="row" flexWrap="wrap">
        <LabelData
          label="Status"
          value={orderStatusMessage[ecommerceOrder.status || 'new']}
        />
        <LabelData
          label="Metoda płatności"
          value={ecommerceOrder.paymentMethod}
        />
        <LabelData
          label="Metoda dostawy"
          value={ecommerceOrder.deliveryMethod}
        />
      </Stack>
      <Stack spacing={6} direction="row" flexWrap="wrap">
        <LabelData label="Kupujący" value={ecommerceOrder.buyerName} />
        <LabelData
          label="Adres kupującego"
          value={ecommerceOrder.buyerAddress}
        />
        <LabelData
          label="Kontakt kupującego"
          value={ecommerceOrder.buyerContact}
        />
        <LabelData
          label="Wiadomość od kupującego"
          value={ecommerceOrder.messageFromBuyer || 'brak'}
        />
      </Stack>
      <Stack spacing={6} direction="row" flexWrap="wrap">
        <LabelData label="Ilość pozycji" value={ecommerceOrder.itemsAmount} />
        <LabelData
          label="Ilość produktów"
          value={ecommerceOrder.productsAmount}
        />
      </Stack>
      <Stack spacing={6} direction="row" flexWrap="wrap">
        <LabelData
          label="Data utworzenia"
          value={dayjs(ecommerceOrder.createdAt).format('DD.MM.YYYY HH:mm')}
        />
        <LabelData
          label="Data modyfikacji"
          value={dayjs(ecommerceOrder.updatedAt).format('DD.MM.YYYY HH:mm')}
        />
      </Stack>
    </Stack>
  );
};
