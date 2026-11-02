import {
  Alert,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { LabelData } from '../../../../../components';
import { useNotify } from '../../../../../hooks';
import { getProductDetailsQueryKey, useUpdateProduct } from '../../api';
import { Product } from '../../types';

const channelDisplayName = (channel: string) => {
  if (channel === 'woocommerce') return 'WooCommerce';
  if (channel === 'allegro') return 'Allegro';
  if (channel === 'erli') return 'Erli';
  return channel.toUpperCase();
};

const blockedOfferReason = (reason: string) => {
  if (reason === 'ended') return 'zakończona';
  if (reason === 'closed') return 'szkic albo kosz';
  if (reason === 'archived') return 'zarchiwizowana';
  if (reason === 'unmanaged_stock') return 'WooCommerce nie prowadzi stanu';
  if (reason === 'manage_stock_unknown')
    return 'nie wiadomo, czy WooCommerce prowadzi stan';
  if (reason === 'pool_conflict') return 'kanały mają różne placówki';
  if (reason === 'no_pool') return 'brak placówek stanu';
  if (reason === 'unmatched_line') return 'linia bez pewnego produktu';
  if (reason === 'no_product') return 'brak produktu';
  if (reason === 'no_warehouse') return 'brak stanu w PC-Markecie';
  return reason;
};

const piecesLabel = (count: number) => `${count} szt.`;

export const ListedStockPanel = ({ product }: { product: Product }) => {
  const stock = product.ecommerceStock;
  const { notify } = useNotify();
  const queryClient = useQueryClient();
  const { updateShopReservePieces } = useUpdateProduct();
  const [draft, setDraft] = useState(
    product.shopReservePieces == null ? '' : String(product.shopReservePieces),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(
      product.shopReservePieces == null
        ? ''
        : String(product.shopReservePieces),
    );
  }, [product.id, product.shopReservePieces]);

  if (!stock) return null;

  const saveReserve = async () => {
    const trimmed = draft.trim();
    const value = trimmed === '' ? null : Number(trimmed);
    if (value != null && (!Number.isInteger(value) || value < 0)) {
      notify(
        'error',
        'Podaj pełne sztuki albo zostaw puste, żeby wziąć domyślną',
      );
      return;
    }
    setSaving(true);
    try {
      const updated = await updateShopReservePieces(product.id, value);
      queryClient.setQueryData<AxiosResponse<Product>>(
        getProductDetailsQueryKey(product.id),
        (current) => (current ? { ...current, data: updated } : current),
      );
      await queryClient.invalidateQueries({
        queryKey: getProductDetailsQueryKey(product.id),
      });
    } catch {
      notify('error', 'Nie udało się zapisać sztuk dla sklepu');
    } finally {
      setSaving(false);
    }
  };

  const warehouse =
    stock.warehousePieces == null
      ? 'brak stanu'
      : `${piecesLabel(stock.warehousePieces)}${
          stock.syncedAt
            ? `, pobrane ${dayjs(stock.syncedAt).format('D.MM.YYYY HH:mm')}`
            : ''
        }`;
  const sold = `${piecesLabel(stock.soldPieces)}${
    stock.soldSince
      ? `, od ${dayjs(stock.soldSince).format('D.MM.YYYY HH:mm')}`
      : ''
  }`;
  const listed =
    stock.listedPieces == null ? '—' : piecesLabel(stock.listedPieces);

  return (
    <Stack spacing={2}>
      <Typography variant="h6">{'Stan dla e-commerce'}</Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            useFlexGap
            flexWrap="wrap"
          >
            <LabelData label="Stan z PC-Marketu" value={warehouse} />
            <LabelData label="Sprzedano w e-commerce" value={sold} />
            <LabelData
              label="Dla sklepu"
              value={piecesLabel(stock.reservePieces)}
            />
            <LabelData
              label="Wystawione w e-commerce"
              value={listed}
              weight="bold"
            />
          </Stack>
          {stock.shortagePieces > 0 && (
            <Alert severity="warning">
              {`Brakuje ${piecesLabel(stock.shortagePieces)}. Sprzedaż i bufor przekraczają stan.`}
            </Alert>
          )}
          {stock.poolConflict && (
            <Alert severity="error">
              {`Publikacja stoi. Kanały wskazują różne placówki: ${stock.sources
                .map(
                  (source) =>
                    `${channelDisplayName(source.channel)} (${source.branches.join(', ')})`,
                )
                .join('; ')}.`}
            </Alert>
          )}
          {!stock.poolReady && !stock.poolConflict && (
            <Alert severity="info">
              {'Brak placówek, z których liczony jest stan e-commerce.'}
            </Alert>
          )}
          {stock.reservePercent != null && (
            <Typography variant="body2" color="text.secondary">
              {`Dodatkowy limit: ${stock.reservePercent}% tego, co zostaje po sprzedaży online.`}
            </Typography>
          )}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ alignItems: { sm: 'center' } }}
          >
            <TextField
              size="small"
              label="Sztuki dla sklepu"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              helperText={
                stock.reserveInherited
                  ? `Puste zostawia domyślne ${stock.reservePieces} szt.`
                  : 'Puste wraca do liczby domyślnej organizacji.'
              }
              sx={{ width: 220 }}
            />
            <Button variant="outlined" disabled={saving} onClick={saveReserve}>
              {'Zapisz'}
            </Button>
          </Stack>
          {stock.blockedOffers.length > 0 && (
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                {'Te oferty nie dostały nowej liczby:'}
              </Typography>
              {stock.blockedOffers.map((offer) => (
                <Typography
                  key={`${offer.channel}:${offer.externalOfferId}:${offer.reason}`}
                  variant="body2"
                >
                  {`${channelDisplayName(offer.channel)} ${
                    offer.offerName || offer.externalOfferId
                  }: ${blockedOfferReason(offer.reason)}`}
                </Typography>
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
};
