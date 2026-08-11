import { LoadingButton } from '@mui/lab';
import {
  Stack,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Link,
  TextField,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { isAxiosError } from 'axios';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { LabelData } from '../../../../../components';
import { useNotify } from '../../../../../hooks';
import { formatPrice } from '../../../products/utils';
import {
  ChannelProductLink,
  useConnectWooCommerce,
  useGetWooCommerceConnection,
  useGetWooCommerceOffers,
  useGetWooCommerceSyncStatus,
  useTriggerWooCommerceSync,
  useWooCommerceDisconnect,
} from '../../api';

const unmatchedColumns: GridColDef<ChannelProductLink>[] = [
  {
    field: 'offerName',
    headerName: 'Nazwa produktu',
    flex: 1.4,
    minWidth: 220,
  },
  {
    field: 'externalOfferId',
    headerName: 'ID produktu',
    width: 120,
  },
  {
    field: 'sku',
    headerName: 'SKU (Woo)',
    width: 140,
    valueFormatter: (value: string | null) => value || '—',
  },
  {
    field: 'ean',
    headerName: 'EAN (Woo)',
    width: 140,
    valueFormatter: (value: string | null) => value || '—',
  },
  {
    field: 'marketplace',
    headerName: 'Sklep',
    width: 140,
    valueFormatter: (value: string | null) => value || '—',
  },
  {
    field: 'price',
    headerName: 'Cena',
    width: 110,
    valueGetter: (_value, row) =>
      row.price != null
        ? formatPrice(row.price, row.currency || undefined)
        : '—',
  },
  {
    field: 'stockAvailable',
    headerName: 'Stan',
    width: 90,
    valueFormatter: (value: number | null) =>
      value != null ? String(value) : '—',
  },
  {
    field: 'offerStatus',
    headerName: 'Status',
    width: 110,
    valueFormatter: (value: string | null) => value || '—',
  },
  {
    field: 'wooLink',
    headerName: '',
    width: 110,
    sortable: false,
    renderCell: (params) =>
      params.row.externalUrl ? (
        <Link
          href={params.row.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          onClick={(e) => e.stopPropagation()}
        >
          {'Otwórz'}
        </Link>
      ) : (
        '—'
      ),
  },
];

const extractErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) return error.message;
  if (isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
  }
  return 'Nie udało się połączyć ze sklepem WooCommerce';
};

export const IntegrationsWooCommercePanel = () => {
  const { notify } = useNotify();
  const { wooCommerceConnection, isLoading } = useGetWooCommerceConnection();
  const {
    connectWooCommerce,
    isPending: isConnecting,
    error: connectError,
    reset: resetConnectError,
  } = useConnectWooCommerce();
  const { disconnectWooCommerce, isPending: isDisconnecting } =
    useWooCommerceDisconnect();
  const {
    syncRun,
    isLoading: isLoadingSync,
    hasNeverSynced,
    refetch,
  } = useGetWooCommerceSyncStatus();
  const { triggerSync, isPending: isTriggeringSync } =
    useTriggerWooCommerceSync();
  const {
    offers: unmatchedOffers,
    totalCount: unmatchedCount,
    isLoading: isLoadingUnmatched,
    page: unmatchedPage,
    setPage: setUnmatchedPage,
    query: unmatchedQuery,
    setQuery: setUnmatchedQuery,
    refetch: refetchUnmatched,
  } = useGetWooCommerceOffers({
    unmatchedOnly: true,
    enabled: !!wooCommerceConnection?.isConnected,
  });

  const [storeUrl, setStoreUrl] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [unmatchedSearchInput, setUnmatchedSearchInput] =
    useState(unmatchedQuery);

  useEffect(() => {
    const timeout = setTimeout(
      () => setUnmatchedQuery(unmatchedSearchInput),
      300,
    );
    return () => clearTimeout(timeout);
  }, [unmatchedSearchInput, setUnmatchedQuery]);

  useEffect(() => {
    if (syncRun?.status === 'completed' || syncRun?.status === 'failed')
      refetchUnmatched();
  }, [syncRun?.status, syncRun?.id, refetchUnmatched]);

  const isConnected = !!wooCommerceConnection?.isConnected;

  const handleConnect = async () => {
    resetConnectError();
    try {
      await connectWooCommerce({
        storeUrl: storeUrl.trim(),
        consumerKey: consumerKey.trim(),
        consumerSecret: consumerSecret.trim(),
      });
      notify('success', 'Połączono ze sklepem WooCommerce');
      setConsumerKey('');
      setConsumerSecret('');
    } catch {
      // error rendered via connectError
    }
  };

  const handleTriggerSync = async () => {
    try {
      await triggerSync();
      notify('success', 'Synchronizacja produktów została uruchomiona');
      refetch();
    } catch {
      notify('error', 'Nie udało się uruchomić synchronizacji');
    }
  };

  const syncStatusLabel = (() => {
    if (!syncRun) return hasNeverSynced ? 'Brak synchronizacji' : '—';
    if (syncRun.status === 'running') return 'W toku';
    if (syncRun.status === 'completed') return 'Zakończona';
    if (syncRun.status === 'failed') return 'Błąd';
    return syncRun.status;
  })();

  const syncStatusColor = (() => {
    if (!syncRun) return 'default' as const;
    if (syncRun.status === 'running') return 'info' as const;
    if (syncRun.status === 'completed') return 'success' as const;
    if (syncRun.status === 'failed') return 'error' as const;
    return 'default' as const;
  })();

  return (
    <Stack spacing={4}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack spacing={3}>
          <Typography variant="subtitle1" fontWeight={600} color="text.primary">
            {'Status połączenia'}
          </Typography>

          {isLoading && (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              py={2}
            >
              <CircularProgress />
            </Box>
          )}

          {isConnected && !isLoading && (
            <Stack spacing={3}>
              <Stack
                direction="row"
                flexWrap="wrap"
                gap={4}
                alignItems="flex-start"
              >
                <Stack sx={{ minWidth: 180 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    fontWeight={500}
                  >
                    {'Status'}
                  </Typography>
                  <Chip
                    label="Połączono"
                    color="success"
                    size="small"
                    sx={{ mt: 0.5, width: 'fit-content' }}
                  />
                </Stack>
                <LabelData
                  label="URL sklepu"
                  value={wooCommerceConnection?.storeUrl}
                  minWidth={220}
                />
                <LabelData
                  label="Klucz API"
                  value={wooCommerceConnection?.maskedConsumerKey}
                  minWidth={180}
                />
              </Stack>
              <Box>
                <LoadingButton
                  variant="outlined"
                  color="error"
                  onClick={() => disconnectWooCommerce()}
                  loading={isDisconnecting}
                >
                  {'Rozłącz sklep'}
                </LoadingButton>
              </Box>
            </Stack>
          )}

          {!isConnected && !isLoading && (
            <Stack spacing={3}>
              <Stack sx={{ minWidth: 180 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  fontWeight={500}
                >
                  {'Status'}
                </Typography>
                <Chip
                  label="Nie połączono"
                  color="warning"
                  size="small"
                  sx={{ mt: 0.5, width: 'fit-content' }}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {
                  'Wygeneruj klucze REST API w WooCommerce → Ustawienia → Zaawansowane → REST API (odczyt i zapis — wymagane do synchronizacji statusów zamówień). Lokalny sklep po HTTP: http://localhost:8080 — backend używa OAuth (Woo tego wymaga bez HTTPS) i mapuje localhost → host.docker.internal.'
                }
              </Typography>
              {!!connectError && (
                <Alert severity="error">
                  {extractErrorMessage(connectError)}
                </Alert>
              )}
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                flexWrap="wrap"
              >
                <TextField
                  label="URL sklepu"
                  placeholder="https://sklep.example.com"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  size="small"
                  sx={{ minWidth: 260, flex: 1 }}
                />
                <TextField
                  label="Consumer key"
                  value={consumerKey}
                  onChange={(e) => setConsumerKey(e.target.value)}
                  size="small"
                  sx={{ minWidth: 220, flex: 1 }}
                />
                <TextField
                  label="Consumer secret"
                  type="password"
                  value={consumerSecret}
                  onChange={(e) => setConsumerSecret(e.target.value)}
                  size="small"
                  sx={{ minWidth: 220, flex: 1 }}
                />
              </Stack>
              <Box>
                <LoadingButton
                  variant="contained"
                  color="primary"
                  onClick={handleConnect}
                  loading={isConnecting}
                  disabled={
                    !storeUrl.trim() ||
                    !consumerKey.trim() ||
                    !consumerSecret.trim()
                  }
                >
                  {'Połącz'}
                </LoadingButton>
              </Box>
            </Stack>
          )}
        </Stack>
      </Paper>

      {isConnected && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack spacing={3}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              gap={2}
            >
              <Typography
                variant="subtitle1"
                fontWeight={600}
                color="text.primary"
              >
                {'Synchronizacja produktów (cena / stan)'}
              </Typography>
              <LoadingButton
                variant="contained"
                onClick={handleTriggerSync}
                loading={isTriggeringSync || syncRun?.status === 'running'}
                disabled={!isConnected}
              >
                {'Synchronizuj teraz'}
              </LoadingButton>
            </Box>

            {isLoadingSync && !syncRun ? (
              <CircularProgress size={28} />
            ) : (
              <Stack spacing={2}>
                <Stack direction="row" flexWrap="wrap" gap={4}>
                  <Stack sx={{ minWidth: 160 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      fontWeight={500}
                    >
                      {'Status ostatniej synchronizacji'}
                    </Typography>
                    <Chip
                      label={syncStatusLabel}
                      color={syncStatusColor}
                      size="small"
                      sx={{ mt: 0.5, width: 'fit-content' }}
                    />
                  </Stack>
                  <LabelData
                    label="Start"
                    value={
                      syncRun?.startedAt
                        ? dayjs(syncRun.startedAt).format('DD.MM.YYYY HH:mm')
                        : '—'
                    }
                  />
                  <LabelData
                    label="Koniec"
                    value={
                      syncRun?.finishedAt
                        ? dayjs(syncRun.finishedAt).format('DD.MM.YYYY HH:mm')
                        : '—'
                    }
                  />
                </Stack>

                {syncRun && (
                  <Stack direction="row" flexWrap="wrap" gap={4}>
                    <LabelData label="Produkty" value={syncRun.offersSeen} />
                    <LabelData
                      label="Dopasowane SKU"
                      value={syncRun.matchedSku}
                    />
                    <LabelData
                      label="Dopasowane EAN"
                      value={syncRun.matchedEan}
                    />
                    <LabelData
                      label="Niedopasowane"
                      value={syncRun.unmatched}
                    />
                    <LabelData label="Błędy" value={syncRun.errors} />
                  </Stack>
                )}

                {syncRun?.errorMessage && (
                  <Alert severity="error">{syncRun.errorMessage}</Alert>
                )}

                <Typography variant="body2" color="text.secondary">
                  {
                    'Automatyczna synchronizacja codziennie o 00:30 (Europe/Warsaw). Dopasowanie automatyczne: najpierw SKU, potem EAN (GTIN).'
                  }
                </Typography>
              </Stack>
            )}
          </Stack>
        </Paper>
      )}

      {isConnected && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack spacing={2}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              gap={2}
              flexWrap="wrap"
            >
              <Stack spacing={0.5}>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  color="text.primary"
                >
                  {'Niedopasowane produkty'}
                  {unmatchedCount != null ? ` (${unmatchedCount})` : ''}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {
                    'Produkty bez automatycznego powiązania po SKU/EAN. Uzupełnij SKU lub GTIN w WooCommerce i uruchom synchronizację ponownie.'
                  }
                </Typography>
              </Stack>
              <TextField
                size="small"
                label="Szukaj produktu / SKU / EAN"
                value={unmatchedSearchInput}
                onChange={(e) => setUnmatchedSearchInput(e.target.value)}
                sx={{ minWidth: 260 }}
              />
            </Box>

            {isLoadingUnmatched && unmatchedOffers.length === 0 ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress size={28} />
              </Box>
            ) : unmatchedOffers.length === 0 ? (
              <Alert severity="success">
                {'Brak niedopasowanych aktywnych produktów.'}
              </Alert>
            ) : (
              <DataGrid
                rows={unmatchedOffers}
                columns={unmatchedColumns}
                loading={isLoadingUnmatched}
                autoHeight
                disableRowSelectionOnClick
                pageSizeOptions={[25]}
                paginationMode="server"
                rowCount={unmatchedCount ?? 0}
                paginationModel={{ page: unmatchedPage, pageSize: 25 }}
                onPaginationModelChange={(model) =>
                  setUnmatchedPage(model.page)
                }
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-cell': {
                    display: 'flex',
                    alignItems: 'center',
                  },
                }}
              />
            )}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
};
