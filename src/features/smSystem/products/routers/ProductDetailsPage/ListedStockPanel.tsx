import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import {
  Alert,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import { KeyboardEvent, useEffect, useState } from 'react';

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
  const savedReserve =
    product.shopReservePieces == null ? '' : String(product.shopReservePieces);
  const [draft, setDraft] = useState(savedReserve);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(savedReserve);
    setIsEditing(false);
  }, [product.id, savedReserve]);

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
      setIsEditing(false);
    } catch {
      notify('error', 'Nie udało się zapisać sztuk dla sklepu');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = () => {
    setDraft(savedReserve);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraft(savedReserve);
    setIsEditing(false);
  };

  const handleDraftKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void saveReserve();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEdit();
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
  const soldSinceFetch = stock.syncedAt
    ? `Od ostatniego pobrania stanu, ${dayjs(stock.syncedAt).format('D.MM.YYYY HH:mm')}.`
    : 'Od ostatniego pobrania stanu.';
  const listed =
    stock.listedPieces == null ? '—' : piecesLabel(stock.listedPieces);
  const publishingText =
    stock.offersActive === 0
      ? 'brak aktywnych ofert'
      : `${stock.offersPublishing} z ${stock.offersActive} ofert`;
  const reserveText =
    product.shopReservePieces == null
      ? `Domyślne (${piecesLabel(stock.reservePieces)})`
      : piecesLabel(product.shopReservePieces);
  const reserveHelper = stock.reserveInherited
    ? `Puste zostawia domyślne ${stock.reservePieces} szt.`
    : 'Puste wraca do liczby domyślnej organizacji.';

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
            <LabelData
              label="Sprzedano w e-commerce"
              value={piecesLabel(stock.soldPieces)}
              hint={soldSinceFetch}
            />
            <LabelData
              label="Dla sklepu"
              value={piecesLabel(stock.reservePieces)}
            />
            <LabelData
              label="Wystawione w e-commerce"
              value={listed}
              weight="bold"
            />
            <LabelData
              label="Aktualizacja stanu"
              value={publishingText}
              hint="Ile aktywnych ofert tego produktu ma włączone „Aktualizuj stan”. Pozostałych SM nie zmienia."
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
          {isEditing ? (
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <TextField
                size="small"
                autoFocus
                label="Sztuki dla sklepu"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleDraftKeyDown}
                disabled={saving}
                helperText={reserveHelper}
                slotProps={{
                  htmlInput: { 'aria-label': 'Sztuki dla sklepu' },
                }}
                sx={{ width: 220 }}
              />
              <IconButton
                color="primary"
                aria-label="Zapisz sztuki dla sklepu"
                onClick={() => void saveReserve()}
                disabled={saving}
                sx={{ mt: 0.25 }}
              >
                {saving ? <CircularProgress size={18} /> : <CheckIcon />}
              </IconButton>
              <IconButton
                aria-label="Anuluj edycję sztuk dla sklepu"
                onClick={cancelEdit}
                disabled={saving}
                sx={{ mt: 0.25 }}
              >
                <CloseIcon />
              </IconButton>
            </Stack>
          ) : (
            <Stack spacing={0.5}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                fontWeight={500}
              >
                {'Sztuki dla sklepu'}
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography>{reserveText}</Typography>
                <Tooltip title="Edytuj sztuki dla sklepu">
                  <IconButton
                    size="small"
                    aria-label="Edytuj sztuki dla sklepu"
                    onClick={startEdit}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          )}
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
