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
  useConnectErli,
  useGetErliConnection,
  useGetErliOffers,
  useGetErliSyncStatus,
  useTriggerErliSync,
  useErliDisconnect,
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
    headerName: 'ID zewnętrzne',
    width: 140,
  },
  {
    field: 'sku',
    headerName: 'SKU (Erli)',
    width: 140,
    valueFormatter: (value: string | null) => value || '—',
  },
  {
    field: 'ean',
    headerName: 'EAN (Erli)',
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
    field: 'erliLink',
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
  return 'Nie udało się połączyć z Erli';
};

export const IntegrationsErliPanel = () => {
  const { notify } = useNotify();
  const { erliConnection, isLoading } = useGetErliConnection();
  const {
    connectErli,
    isPending: isConnecting,
    error: connectError,
    reset: resetConnectError,
  } = useConnectErli();
  const { disconnectErli, isPending: isDisconnecting } = useErliDisconnect();
  const {
    syncRun,
    isLoading: isLoadingSync,
    hasNeverSynced,
    refetch,
  } = useGetErliSyncStatus();
  const { triggerSync, isPending: isTriggeringSync } = useTriggerErliSync();
  const {
    offers: unmatchedOffers,
    totalCount: unmatchedCount,
    isLoading: isLoadingUnmatched,
    page: unmatchedPage,
    setPage: setUnmatchedPage,
    query: unmatchedQuery,
    setQuery: setUnmatchedQuery,
    refetch: refetchUnmatched,
  } = useGetErliOffers({
    unmatchedOnly: true,
    enabled: !!erliConnection?.isConnected,
  });

  const [apiKey, setApiKey] = useState('');
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

  const isConnected = !!erliConnection?.isConnected;

  const handleConnect = async () => {
    resetConnectError();
    try {
      await connectErli({
        apiKey: apiKey.trim(),
      });
      notify('success', 'Połączono z Erli');
      setApiKey('');
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
                  label="Sklep Erli"
                  value={erliConnection?.shopName}
                  minWidth={180}
                />
                <LabelData
                  label="Klucz API"
                  value={erliConnection?.maskedApiKey}
                  minWidth={180}
                />
              </Stack>
              <Box>
                <LoadingButton
                  variant="outlined"
                  color="error"
                  onClick={() => disconnectErli()}
                  loading={isDisconnecting}
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
              <Typography variant="body2" color="text.secondary">
                {
                  'Wygeneruj klucz API w panelu sprzedawcy Erli → Metoda integracji → Własna integracja po API, a następnie wklej go poniżej.'
                }
              </Typography>
              {!!connectError && (
                <Alert severity="error">
                  {extractErrorMessage(connectError)}
                </Alert>
              )}
              <TextField
                label="Klucz API"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                size="small"
                sx={{ minWidth: 320, maxWidth: 480 }}
              />
              <Box>
                <LoadingButton
                  variant="contained"
                  color="primary"
                  onClick={handleConnect}
                  loading={isConnecting}
                  disabled={!apiKey.trim()}
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
                    'Automatyczna synchronizacja codziennie o 00:45 (Europe/Warsaw). Dopasowanie automatyczne: najpierw SKU, potem EAN.'
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
                    'Produkty bez automatycznego powiązania po SKU/EAN. Uzupełnij SKU lub EAN w Erli i uruchom synchronizację ponownie.'
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
                disableColumnFilter
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
