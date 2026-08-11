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
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { LabelData } from '../../../../../components';
import { useNotify } from '../../../../../hooks';
import { formatPrice } from '../../../products/utils';
import {
  ChannelProductLink,
  useAllegroDisconnect,
  useGetAllegroAuthUrl,
  useGetAllegroConnection,
  useGetAllegroOffers,
  useGetAllegroSyncStatus,
  useTriggerAllegroSync,
} from '../../api';

const offerUrl = (offerId: string, marketplace?: string | null) => {
  if (marketplace?.includes('cz'))
    return `https://allegro.cz/oferta/${offerId}`;
  if (marketplace?.includes('sk'))
    return `https://allegro.sk/oferta/${offerId}`;
  if (marketplace?.includes('hu'))
    return `https://allegro.hu/oferta/${offerId}`;
  return `https://allegro.pl/oferta/${offerId}`;
};

const unmatchedColumns: GridColDef<ChannelProductLink>[] = [
  {
    field: 'offerName',
    headerName: 'Nazwa oferty',
    flex: 1.4,
    minWidth: 220,
  },
  {
    field: 'externalOfferId',
    headerName: 'ID oferty',
    width: 140,
  },
  {
    field: 'sku',
    headerName: 'SKU (Allegro)',
    width: 140,
    valueFormatter: (value: string | null) => value || '—',
  },
  {
    field: 'ean',
    headerName: 'EAN (Allegro)',
    width: 140,
    valueFormatter: (value: string | null) => value || '—',
  },
  {
    field: 'marketplace',
    headerName: 'Marketplace',
    width: 120,
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
    field: 'allegroLink',
    headerName: '',
    width: 110,
    sortable: false,
    renderCell: (params) => (
      <Link
        href={offerUrl(params.row.externalOfferId, params.row.marketplace)}
        target="_blank"
        rel="noopener noreferrer"
        underline="hover"
        onClick={(e) => e.stopPropagation()}
      >
        {'Otwórz'}
      </Link>
    ),
  },
];

export const IntegrationsAllegroPanel = () => {
  const [searchParams] = useSearchParams();
  const { notify } = useNotify();
  const isConnectionSuccess = searchParams.get('success') === 'true';
  const connectionError = searchParams.get('error');

  const { allegroConnection, isLoading } = useGetAllegroConnection();
  const { getAllegroAuthUrl, isPending: isGettingAllegroAuthUrl } =
    useGetAllegroAuthUrl();
  const { disconnectAllegro, isPending: isDisconnectingAllegro } =
    useAllegroDisconnect();
  const {
    syncRun,
    isLoading: isLoadingSync,
    hasNeverSynced,
    refetch,
  } = useGetAllegroSyncStatus();
  const { triggerSync, isPending: isTriggeringSync } = useTriggerAllegroSync();
  const {
    offers: unmatchedOffers,
    totalCount: unmatchedCount,
    isLoading: isLoadingUnmatched,
    page: unmatchedPage,
    setPage: setUnmatchedPage,
    query: unmatchedQuery,
    setQuery: setUnmatchedQuery,
    refetch: refetchUnmatched,
  } = useGetAllegroOffers({
    unmatchedOnly: true,
    enabled: !!allegroConnection?.isConnected,
  });

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

  const isConnected = !!allegroConnection?.isConnected;

  const handleGetAllegroAuthUrl = async () => {
    const { data } = await getAllegroAuthUrl();
    window.location.href = data.authorizationUrl;
  };

  const handleTriggerSync = async () => {
    try {
      await triggerSync();
      notify('success', 'Synchronizacja ofert została uruchomiona');
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
      {isConnectionSuccess && (
        <Alert severity="success">
          {'Połączenie z Allegro zostało pomyślnie utworzone'}
        </Alert>
      )}
      {!!connectionError && (
        <Alert severity="error">
          {'Wystąpił błąd podczas łączenia z Allegro'}
        </Alert>
      )}

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
                  label="Login Allegro"
                  value={allegroConnection?.allegroUserLogin}
                  minWidth={180}
                />
              </Stack>
              <Box>
                <LoadingButton
                  variant="outlined"
                  color="error"
                  onClick={() => disconnectAllegro()}
                  loading={isDisconnectingAllegro}
                >
                  {'Rozłącz konto'}
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
              <Box>
                <LoadingButton
                  variant="contained"
                  color="primary"
                  onClick={handleGetAllegroAuthUrl}
                  loading={isGettingAllegroAuthUrl}
                >
                  {'Połącz z Allegro'}
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
                {'Synchronizacja ofert (cena / stan)'}
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
                    <LabelData label="Oferty" value={syncRun.offersSeen} />
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
                    'Automatyczna synchronizacja codziennie o północy (Europe/Warsaw). Dopasowanie automatyczne: najpierw SKU (sygnatura), potem EAN.'
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
                  {'Niedopasowane oferty'}
                  {unmatchedCount != null ? ` (${unmatchedCount})` : ''}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {
                    'Oferty bez automatycznego powiązania po SKU/EAN. Uzupełnij sygnaturę lub EAN w Allegro i uruchom synchronizację ponownie.'
                  }
                </Typography>
              </Stack>
              <TextField
                size="small"
                label="Szukaj oferty / SKU / EAN"
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
                {'Brak niedopasowanych aktywnych ofert.'}
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
