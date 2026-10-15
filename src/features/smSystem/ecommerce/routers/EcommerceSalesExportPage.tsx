import CheckIcon from '@mui/icons-material/Check';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Button,
  Chip,
  Link,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';

import { useAppSelector, useNotify } from '../../../../hooks';
import { Pages } from '../../../../utils';
import {
  SalesExportLine,
  SalesExportQuery,
  SalesExportSkipped,
  ecommerceSalesExportHistoryQueryKey,
  useDownloadEcommerceSalesExport,
  useGetEcommerceSalesExport,
  useGetEcommerceSalesExportHistory,
} from '../api';
import {
  ORDER_CHANNELS,
  OrderChannelSource,
  formatExportRange,
  lastCompleteExportDay,
  latestCoveredExport,
  orderChannelLabel,
  suggestExportRange,
} from '../utils';

const MAX_PERIOD_DAYS = 93;

const gridSx = {
  '& .MuiDataGrid-columnHeaderTitle': {
    whiteSpace: 'normal',
    lineHeight: 'normal',
  },
  '& .MuiDataGrid-cell': {
    display: 'flex',
    alignItems: 'center',
  },
};

const skipReasonLabel = (reason: SalesExportSkipped['reason']) => {
  if (reason === 'unmatched') return 'Brak dopasowania do produktu';
  if (reason === 'uncertain_match')
    return 'Niepewne dopasowanie (podobna nazwa)';
  if (reason === 'missing_ean') return 'Brak kodu EAN';
  return 'Brak produktu w katalogu';
};

const skippedName = (row: SalesExportSkipped) => {
  if (row.reason === 'uncertain_match' && row.offerName && row.name)
    return `${row.offerName} → ${row.name}`;
  return row.name || row.offerName || '—';
};

const lineColumns: GridColDef<SalesExportLine>[] = [
  { field: 'name', headerName: 'Nazwa', flex: 1, minWidth: 180 },
  { field: 'internalId', headerName: 'ID produktu', width: 130 },
  { field: 'ean', headerName: 'EAN', width: 150 },
  {
    field: 'allegro',
    headerName: 'Allegro',
    width: 100,
    type: 'number',
    valueGetter: (_value, row) => row.quantities.allegro,
  },
  {
    field: 'woocommerce',
    headerName: 'WooCommerce',
    width: 120,
    type: 'number',
    valueGetter: (_value, row) => row.quantities.woocommerce,
  },
  {
    field: 'erli',
    headerName: 'Erli',
    width: 90,
    type: 'number',
    valueGetter: (_value, row) => row.quantities.erli,
  },
  {
    field: 'quantity',
    headerName: 'Razem',
    width: 100,
    type: 'number',
  },
];

const skippedColumns: GridColDef<SalesExportSkipped & { id: number }>[] = [
  {
    field: 'reason',
    headerName: 'Powód',
    width: 280,
    valueFormatter: (value: SalesExportSkipped['reason']) =>
      skipReasonLabel(value),
  },
  {
    field: 'channel',
    headerName: 'Kanał',
    width: 130,
    valueFormatter: (value: string) => (value ? orderChannelLabel(value) : '—'),
  },
  {
    field: 'orderExternalId',
    headerName: 'Nr zamówienia',
    width: 160,
    valueFormatter: (value: string) => value || '—',
  },
  {
    field: 'name',
    headerName: 'Nazwa',
    flex: 1,
    minWidth: 180,
    valueGetter: (_value, row) => skippedName(row),
  },
  {
    field: 'internalId',
    headerName: 'ID produktu',
    width: 130,
    valueFormatter: (value: string) => value || '—',
  },
  { field: 'quantity', headerName: 'Ilość', width: 90, type: 'number' },
];

export const EcommerceSalesExportPage = () => {
  const { user } = useAppSelector((state) => state.smSystemUser);
  const { notify } = useNotify();
  const queryClient = useQueryClient();
  const datesTouched = useRef(false);
  const throughDate = lastCompleteExportDay(dayjs().format('YYYY-MM-DD'));
  const throughDay = dayjs(throughDate);
  const [start, setStart] = useState<Dayjs | null>(
    throughDay.subtract(6, 'day'),
  );
  const [end, setEnd] = useState<Dayjs | null>(throughDay);
  const [sources, setSources] = useState<OrderChannelSource[]>(
    ORDER_CHANNELS.map((channel) => channel.source),
  );
  const [query, setQuery] = useState<SalesExportQuery | null>(null);
  const { history } = useGetEcommerceSalesExportHistory();
  const { preview, isLoading, isError } = useGetEcommerceSalesExport(query);
  const { download, isPending } = useDownloadEcommerceSalesExport();

  useEffect(() => {
    if (datesTouched.current || history.length === 0) return;
    const next = suggestExportRange(history, throughDate);
    if (!next) return;
    const covered = latestCoveredExport(history);
    const nextSources = covered?.sources?.length
      ? covered.sources
      : ORDER_CHANNELS.map((channel) => channel.source);
    datesTouched.current = true;
    setStart(dayjs(next.startDate));
    setEnd(dayjs(next.endDate));
    setSources(nextSources);
    setQuery({
      startDate: next.startDate,
      endDate: next.endDate,
      sources: nextSources,
    });
  }, [history, throughDate]);

  const skippedRows = useMemo(
    () => (preview?.skipped ?? []).map((row, index) => ({ ...row, id: index })),
    [preview?.skipped],
  );
  const suggestion = useMemo(
    () => suggestExportRange(history, throughDate),
    [history, throughDate],
  );
  const suggestionListed =
    !!suggestion &&
    !isLoading &&
    !isError &&
    preview?.startDate === suggestion.startDate &&
    preview?.endDate === suggestion.endDate &&
    start?.format('YYYY-MM-DD') === suggestion.startDate &&
    end?.format('YYYY-MM-DD') === suggestion.endDate;
  const hasMatchSkips = skippedRows.some(
    (row) => row.reason === 'unmatched' || row.reason === 'uncertain_match',
  );

  if (!user?.permissions?.canAccessEcommerce)
    return <Navigate to={Pages.smSystem} replace />;

  const changeStart = (value: Dayjs | null) => {
    datesTouched.current = true;
    setStart(value);
  };

  const changeEnd = (value: Dayjs | null) => {
    datesTouched.current = true;
    setEnd(value);
  };

  const rangeIsClosed = (startDate: string, endDate: string) =>
    !dayjs(endDate).isAfter(throughDay, 'day') &&
    !dayjs(startDate).isAfter(throughDay, 'day');

  const applyRange = (
    startDate: string,
    endDate: string,
    nextSources: OrderChannelSource[],
  ) => {
    datesTouched.current = true;
    setStart(dayjs(startDate));
    setEnd(dayjs(endDate));
    setSources(nextSources);
    if (!rangeIsClosed(startDate, endDate)) {
      notify(
        'error',
        'Zakres może kończyć się najpóźniej wczoraj. Dzisiejsza sprzedaż nie jest jeszcze zamknięta.',
      );
      return;
    }
    setQuery({ startDate, endDate, sources: nextSources });
  };

  const showPreview = () => {
    if (!start || !end) {
      notify('error', 'Wybierz datę od i datę do');
      return;
    }
    if (end.isAfter(throughDay, 'day') || start.isAfter(throughDay, 'day')) {
      notify(
        'error',
        'Zakres może kończyć się najpóźniej wczoraj. Dzisiejsza sprzedaż nie jest jeszcze zamknięta.',
      );
      return;
    }
    if (end.isBefore(start, 'day')) {
      notify(
        'error',
        'Data końcowa musi być późniejsza albo równa dacie początkowej',
      );
      return;
    }
    const days = end.startOf('day').diff(start.startOf('day'), 'day') + 1;
    if (days > MAX_PERIOD_DAYS) {
      notify('error', `Zakres może mieć najwyżej ${MAX_PERIOD_DAYS} dni`);
      return;
    }
    if (sources.length === 0) {
      notify('error', 'Wybierz co najmniej jeden kanał');
      return;
    }
    datesTouched.current = true;
    setQuery({
      startDate: start.format('YYYY-MM-DD'),
      endDate: end.format('YYYY-MM-DD'),
      sources,
    });
  };

  const downloadFile = async () => {
    if (!query) return;
    const saved = await download(query);
    if (!saved) return;
    await queryClient.invalidateQueries({
      queryKey: ecommerceSalesExportHistoryQueryKey,
    });
  };

  const summary = preview?.summary;
  const syncGaps = preview?.syncGaps ?? [];
  const canDownload =
    !!query &&
    !!summary &&
    summary.linesCount > 0 &&
    syncGaps.length === 0 &&
    !isPending &&
    !isLoading;

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5">{'Eksport do PC Market'}</Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {
            'Suma sztuk sprzedanych w kanałach e-commerce. Plik wgrywa się w PC Market jako rozchód (zmiana stanu). Ilości są dodatnie.'
          }
        </Typography>
      </Box>

      <Alert severity="info">
        {
          'Drugi import tego samego zakresu w PC Market zdejmie stan drugi raz. Pozycje bez produktu albo bez kodu EAN nie wchodzą do pliku — zostają na liście pominiętych.'
        }
      </Alert>

      {history.length > 0 && (
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          alignItems="center"
        >
          <Typography variant="body2">{'Ostatnie eksporty'}</Typography>
          {history.map((row) => (
            <Chip
              key={row.id}
              size="small"
              variant="outlined"
              label={`${formatExportRange(row.startDate, row.endDate)} · ${row.sources.map(orderChannelLabel).join(', ')}`}
              onClick={() =>
                applyRange(row.startDate, row.endDate, row.sources)
              }
              sx={{
                backgroundColor: '#fff',
                color: '#333',
                borderColor: '#bbb',
              }}
            />
          ))}
        </Stack>
      )}

      {history.length > 0 && !suggestion && (
        <Alert severity="info">
          {
            'Ostatni eksport obejmuje już wczoraj. Kolejny zakres zacznie się od dzisiejszego dnia, gdy ten dzień się zamknie.'
          }
        </Alert>
      )}

      {suggestion && (
        <Alert
          severity="success"
          action={
            suggestionListed ? undefined : (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  const covered = latestCoveredExport(history);
                  applyRange(
                    suggestion.startDate,
                    suggestion.endDate,
                    covered?.sources?.length
                      ? covered.sources
                      : ORDER_CHANNELS.map((channel) => channel.source),
                  );
                }}
              >
                {'Użyj propozycji'}
              </Button>
            )
          }
        >
          {suggestion.truncated
            ? `Od ostatniego eksportu do wczoraj jest więcej niż ${MAX_PERIOD_DAYS} dni. Propozycja obejmuje pierwsze ${MAX_PERIOD_DAYS} dni: ${formatExportRange(suggestion.startDate, suggestion.endDate)}.${suggestionListed ? ' Ten zakres jest już na liście.' : ''}`
            : `Propozycja: ${formatExportRange(suggestion.startDate, suggestion.endDate)} — dzień po ostatnim eksporcie do wczoraj.${suggestionListed ? ' Ten zakres jest już na liście.' : ''}`}
        </Alert>
      )}

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ md: 'center' }}
      >
        <DatePicker
          label="Od"
          value={start}
          onChange={changeStart}
          maxDate={throughDay}
          slotProps={{ textField: { size: 'small' } }}
        />
        <DatePicker
          label="Do"
          value={end}
          onChange={changeEnd}
          maxDate={throughDay}
          slotProps={{ textField: { size: 'small' } }}
        />
        <ToggleButtonGroup
          size="small"
          value={sources}
          onChange={(_event, value: OrderChannelSource[]) => setSources(value)}
        >
          {ORDER_CHANNELS.map((channel) => {
            const selected = sources.includes(channel.source);
            return (
              <ToggleButton
                key={channel.source}
                value={channel.source}
                aria-label={
                  selected
                    ? `${channel.label}, wybrany`
                    : `${channel.label}, niewybrany`
                }
                sx={{
                  px: 1.5,
                  backgroundColor: '#fff',
                  color: '#333',
                  borderColor: '#bbb',
                  '&:hover': {
                    backgroundColor: '#f3f3f3',
                  },
                  '&.Mui-selected, &.Mui-selected:hover': {
                    backgroundColor: channel.color,
                    color: '#fff',
                    borderColor: channel.color,
                  },
                }}
              >
                {selected && <CheckIcon fontSize="small" sx={{ mr: 0.5 }} />}
                {channel.label}
              </ToggleButton>
            );
          })}
        </ToggleButtonGroup>
        <LoadingButton
          variant="contained"
          loading={isLoading}
          onClick={showPreview}
        >
          {'Pokaż'}
        </LoadingButton>
      </Stack>

      {isError && (
        <Alert severity="error">
          {'Nie udało się policzyć sprzedaży dla tego zakresu.'}
        </Alert>
      )}

      {summary && (
        <>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {[
              ['Zamówienia', summary.ordersCount],
              ['Linie w pliku', summary.linesCount],
              ['Sztuki', summary.piecesCount],
              ['Pominięte', summary.skippedCount],
            ].map(([label, value]) => (
              <Paper
                key={label}
                variant="outlined"
                sx={{ px: 2, py: 1.5, flex: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="h6">{value}</Typography>
              </Paper>
            ))}
          </Stack>

          {syncGaps.length > 0 && (
            <Alert severity="warning">
              {`Nie można pobrać pliku. Zamówienia z ${syncGaps
                .map(orderChannelLabel)
                .join(', ')} nie są zsynchronizowane dla każdego dnia tego zakresu. `}
              <Link component={RouterLink} to={Pages.smSystemEcommerceOrders}>
                {'Zaimportuj zamówienia'}
              </Link>
              {
                ' tak, żeby import objął cały zakres i został zrobiony po jego ostatnim dniu. Potem wróć tutaj i kliknij Pokaż jeszcze raz.'
              }
            </Alert>
          )}

          <Box>
            <LoadingButton
              variant="contained"
              startIcon={<FileDownloadOutlinedIcon />}
              disabled={!canDownload}
              loading={isPending}
              onClick={downloadFile}
            >
              {'Pobierz plik .txt'}
            </LoadingButton>
          </Box>

          <Box height={480}>
            <DataGrid
              sx={gridSx}
              rows={preview?.lines ?? []}
              columns={lineColumns}
              getRowId={(row) => row.productId}
              loading={isLoading}
              disableRowSelectionOnClick
              pageSizeOptions={[25, 50, 100]}
              initialState={{
                pagination: { paginationModel: { pageSize: 25 } },
              }}
              localeText={{ noRowsLabel: 'Brak pozycji do pliku' }}
            />
          </Box>

          {skippedRows.length > 0 && (
            <Stack spacing={1}>
              <Typography variant="h6">{'Pominięte'}</Typography>
              {hasMatchSkips && (
                <Typography variant="body2">
                  {'Brak dopasowania i niepewne dopasowanie poprawisz w '}
                  <Link
                    component={RouterLink}
                    to={Pages.smSystemEcommerceIntegrations}
                  >
                    {'integracjach'}
                  </Link>
                  {
                    '. Uzupełnij SKU albo EAN oferty i uruchom synchronizację, a potem wróć tutaj i kliknij Pokaż jeszcze raz.'
                  }
                </Typography>
              )}
              <Box height={Math.min(120 + skippedRows.length * 52, 420)}>
                <DataGrid
                  sx={gridSx}
                  rows={skippedRows}
                  columns={skippedColumns}
                  disableRowSelectionOnClick
                  hideFooter={skippedRows.length <= 25}
                  pageSizeOptions={[25, 50]}
                  localeText={{ noRowsLabel: 'Brak pominiętych' }}
                />
              </Box>
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
};
