import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import SyncIcon from '@mui/icons-material/Sync';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Button,
  Chip,
  Link,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';

import { useAppSelector } from '../../../../hooks';
import { Pages } from '../../../../utils';
import { formatPrice } from '../../products/utils';
import {
  SalesExportCorrection,
  SalesExportEvidenceReason,
  SalesExportEvidenceRules,
  SalesExportExcluded,
  SalesExportLine,
  SalesExportOutside,
  SalesExportPending,
  SalesExportSkipped,
  SalesExportSyncResult,
  useAckEcommerceSalesExportCorrection,
  useDownloadEcommerceSalesExport,
  useGetEcommerceSalesExport,
  useGetEcommerceSalesExportHistory,
  useSetEcommerceSalesExportStart,
  useSyncEcommerceSalesExport,
} from '../api';
import {
  SalesExportRecord,
  formatExportMoment,
  formatHistoryLabel,
  orderChannelLabel,
  orderStatusConfig,
  pendingWaitLabel,
} from '../utils';

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

const evidenceReasonLabel = (reason: SalesExportEvidenceReason | string) => {
  if (reason === 'receipt') return 'Paragon na kasie';
  if (reason === 'invoice') return 'Faktura poza dowodem';
  if (reason === 'cod') return 'Pobranie na kasie';
  if (reason === 'oss') return 'Sprzedaż OSS';
  if (reason === 'export') return 'Eksport poza UE';
  if (reason === 'invoice_buyer_unknown') return 'Faktura, NIP nieznany';
  if (reason === 'missing_country') return 'Brak kraju dostawy';
  if (reason === 'wsto_unset') return 'Sprzedaż do UE bez rozliczenia';
  if (reason === 'missing_fx') return 'Brak kursu NBP';
  return reason;
};

const correctionReasonLabel = (reason: SalesExportCorrection['reason']) => {
  if (reason === 'canceled') return 'Anulowane';
  if (reason === 'quantity') return 'Mniejsza liczba sztuk';
  if (reason === 'product') return 'Inny produkt';
  if (reason === 'return') return 'Zwrot';
  return evidenceReasonLabel(reason);
};

const evidenceRulesText = (rules: SalesExportEvidenceRules) => {
  const cod =
    rules.codTreatment === 'in_evidence'
      ? 'Pobrania wchodzą do pliku.'
      : 'Pobrania zostają na kasie, poza plikiem.';
  const invoices =
    rules.consumerInvoiceTreatment === 'include'
      ? 'Faktura bez NIP wchodzi do pliku. Faktura z NIP zostaje poza plikiem.'
      : 'Faktury, także bez NIP, zostają poza plikiem.';
  const wsto =
    rules.wstoMode === 'oss'
      ? 'Sprzedaż do innych krajów UE jest w OSS i zostaje poza plikiem.'
      : rules.wstoMode === 'pl_vat'
        ? 'Sprzedaż do innych krajów UE wchodzi do pliku z polskim VAT.'
        : 'Sprzedaż do innych krajów UE czeka, dopóki w ustawieniach firmy nie wybierzesz rozliczenia.';
  return `${cod} ${invoices} ${wsto} Paragon na kasie zawsze zostaje poza plikiem.`;
};

const skippedName = (row: SalesExportSkipped) => {
  if (row.reason === 'uncertain_match' && row.offerName && row.name)
    return `${row.offerName} → ${row.name}`;
  return row.name || row.offerName || '—';
};

const statusLabel = (status: string) =>
  orderStatusConfig[status as keyof typeof orderStatusConfig]?.label ?? status;

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
  {
    field: 'netGrosze',
    headerName: 'Netto',
    description:
      'Suma netto z zamówień. Tę kwotę dostaje PC Market w polu Wartosc.',
    width: 120,
    type: 'number',
    valueFormatter: (value: number | null) =>
      value == null ? '—' : formatPrice(value, 'PLN'),
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

const outsideColumns: GridColDef<SalesExportOutside>[] = [
  {
    field: 'orderExternalId',
    headerName: 'Nr zamówienia',
    width: 160,
  },
  {
    field: 'channel',
    headerName: 'Kanał',
    width: 130,
    valueFormatter: (value: string) => orderChannelLabel(value),
  },
  {
    field: 'orderDate',
    headerName: 'Data zamówienia',
    width: 170,
    valueFormatter: (value: string) => formatExportMoment(value),
  },
  { field: 'name', headerName: 'Nazwa', flex: 1, minWidth: 180 },
  { field: 'internalId', headerName: 'ID produktu', width: 130 },
  { field: 'quantity', headerName: 'Sztuki', width: 90, type: 'number' },
];

const orderDetailsHref = (orderId: number) =>
  `#${Pages.smSystemEcommerceOrderDetails.replace(':orderId', String(orderId))}`;

const excludedColumns: GridColDef<SalesExportExcluded>[] = [
  {
    field: 'orderExternalId',
    headerName: 'Nr zamówienia',
    width: 160,
    renderCell: ({ row }) => (
      <Link
        href={orderDetailsHref(row.orderId)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => event.stopPropagation()}
      >
        {row.orderExternalId || '—'}
      </Link>
    ),
  },
  {
    field: 'channel',
    headerName: 'Kanał',
    width: 130,
    valueFormatter: (value: string) => orderChannelLabel(value),
  },
  {
    field: 'orderDate',
    headerName: 'Data zamówienia',
    width: 170,
    valueFormatter: (value: string) => formatExportMoment(value),
  },
  {
    field: 'reason',
    headerName: 'Powód',
    flex: 1,
    minWidth: 220,
    valueFormatter: (value: SalesExportExcluded['reason']) =>
      evidenceReasonLabel(value),
  },
  {
    field: 'disposition',
    headerName: 'Status',
    width: 140,
    valueFormatter: (value: SalesExportExcluded['disposition']) =>
      value === 'hold' ? 'Wstrzymane' : 'Poza plikiem',
  },
  {
    field: 'quantity',
    headerName: 'Ilość szt. produktów w zamówieniu',
    description:
      'Suma sztuk produktów w tym zamówieniu, których ten plik jeszcze nie zdjął.',
    width: 200,
    type: 'number',
  },
];

const pendingColumns: GridColDef<SalesExportPending>[] = [
  {
    field: 'orderExternalId',
    headerName: 'Nr zamówienia',
    width: 160,
    renderCell: ({ row }) => (
      <Link
        href={orderDetailsHref(row.orderId)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => event.stopPropagation()}
      >
        {row.orderExternalId || '—'}
      </Link>
    ),
  },
  {
    field: 'channel',
    headerName: 'Kanał',
    width: 130,
    valueFormatter: (value: string) => orderChannelLabel(value),
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 180,
    valueFormatter: (value: string) => statusLabel(value),
  },
  {
    field: 'orderDate',
    headerName: 'Data zamówienia',
    width: 170,
    valueFormatter: (value: string) => formatExportMoment(value),
  },
  { field: 'offerName', headerName: 'Oferta', flex: 1, minWidth: 180 },
  { field: 'quantity', headerName: 'Ilość', width: 90, type: 'number' },
  {
    field: 'reason',
    headerName: 'Dlaczego czeka',
    flex: 1.2,
    minWidth: 260,
    valueGetter: (_value, row) => pendingWaitLabel(row),
    renderCell: ({ value }) => (
      <Tooltip title={value || ''}>
        <Typography variant="body2" noWrap sx={{ width: '100%' }}>
          {value}
        </Typography>
      </Tooltip>
    ),
  },
];

const historyFileName = (row: SalesExportRecord) =>
  `SM-ecommerce-${row.startDate.replace(/-/g, '')}-${row.endDate.replace(/-/g, '')}.txt`;

export const EcommerceSalesExportPage = () => {
  const { user } = useAppSelector((state) => state.smSystemUser);
  const { history } = useGetEcommerceSalesExportHistory();
  const { preview, isLoading, isError } = useGetEcommerceSalesExport();
  const { download, downloadHistory, isPending } =
    useDownloadEcommerceSalesExport();
  const { sync, isPending: isSyncing } = useSyncEcommerceSalesExport();
  const { setStart, isPending: isSettingStart } =
    useSetEcommerceSalesExportStart();
  const { acknowledge, ackingId } = useAckEcommerceSalesExportCorrection();
  const startTouched = useRef(false);
  const [start, setStartDate] = useState<Dayjs | null>(() =>
    dayjs().subtract(7, 'day'),
  );
  const [syncResult, setSyncResult] = useState<SalesExportSyncResult | null>(
    null,
  );

  useEffect(() => {
    if (startTouched.current || !preview?.suggestedStart) return;
    setStartDate(dayjs(preview.suggestedStart));
  }, [preview?.suggestedStart]);

  const skippedRows = useMemo(
    () => (preview?.skipped ?? []).map((row, index) => ({ ...row, id: index })),
    [preview?.skipped],
  );
  const correctionColumns = useMemo<GridColDef<SalesExportCorrection>[]>(
    () => [
      { field: 'orderExternalId', headerName: 'Nr zamówienia', width: 160 },
      {
        field: 'channel',
        headerName: 'Kanał',
        width: 130,
        valueFormatter: (value: string) => orderChannelLabel(value),
      },
      { field: 'name', headerName: 'Produkt w pliku', flex: 1, minWidth: 180 },
      { field: 'internalId', headerName: 'ID produktu', width: 130 },
      {
        field: 'reason',
        headerName: 'Co się zmieniło',
        width: 240,
        valueFormatter: (value: SalesExportCorrection['reason']) =>
          correctionReasonLabel(value),
      },
      {
        field: 'exportedPieces',
        headerName: 'W pliku',
        width: 90,
        type: 'number',
      },
      {
        field: 'currentPieces',
        headerName: 'Teraz',
        width: 90,
        type: 'number',
      },
      {
        field: 'ack',
        headerName: '',
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Button
            size="small"
            disabled={
              ackingId === `${params.row.orderItemId}-${params.row.productId}`
            }
            onClick={() =>
              acknowledge(params.row.orderItemId, params.row.productId)
            }
          >
            {'Odhacz'}
          </Button>
        ),
      },
    ],
    [acknowledge, ackingId],
  );

  if (!user?.permissions?.canAccessEcommerce)
    return <Navigate to={Pages.smSystem} replace />;

  const hasMatchSkips = skippedRows.some(
    (row) => row.reason === 'unmatched' || row.reason === 'uncertain_match',
  );
  const failedChannels = (syncResult?.channels ?? []).filter(
    (channel) => !channel.ok,
  );
  const summary = preview?.summary;
  const canDownload =
    !!preview?.canDownload && !!preview.revision && !isPending && !isLoading;

  const saveStart = async () => {
    if (!start) return;
    await setStart(start.format('YYYY-MM-DD'));
  };

  const syncOrders = async () => {
    const result = await sync();
    if (result) setSyncResult(result);
  };

  const downloadFile = async () => {
    if (!preview?.revision) return;
    const fallback =
      preview.startDate && preview.endDate
        ? `SM-ecommerce-${preview.startDate.replace(/-/g, '')}-${preview.endDate.replace(/-/g, '')}.txt`
        : 'SM-ecommerce.txt';
    await download(preview.revision, fallback);
  };

  const rangeIsOpen =
    !!preview?.exportedUntil &&
    !!preview.windowUntil &&
    preview.exportedUntil !== preview.windowUntil;
  const showFileTable = (preview?.lines.length ?? 0) > 0;

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5">{'Eksport do PC Market'}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {
            'Suma sztuk ze sprzedaży, która wchodzi do dowodu bezrachunkowego, z ceną netto z zamówienia. Plik wgrywa się w PC Market: Kontrola → Obsługa kas → ręczne sporządzanie dokumentu. Ilości są dodatnie. Drugi import tego samego pliku zdejmie stan drugi raz.'
          }
        </Typography>
        {preview?.evidenceRules && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {evidenceRulesText(preview.evidenceRules)}{' '}
            <Link component={RouterLink} to={Pages.smSystemCompanySettings}>
              {'Ustawienia firmy'}
            </Link>
          </Typography>
        )}
      </Box>

      {history.length > 0 && (
        <Stack spacing={0.75}>
          <Typography variant="caption" color="text.secondary">
            {'Ostatnie pliki'}
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {history.map((row) => (
              <Chip
                key={row.id}
                size="small"
                variant="outlined"
                label={formatHistoryLabel(row)}
                title={row.sources.map(orderChannelLabel).join(', ')}
                onClick={() => downloadHistory(row.id, historyFileName(row))}
              />
            ))}
          </Stack>
        </Stack>
      )}

      {isError && (
        <Alert severity="error">
          {'Nie udało się policzyć sprzedaży do eksportu.'}
        </Alert>
      )}

      {preview?.needsStart && (
        <Stack spacing={1}>
          <Alert severity="info">
            {
              'Wybierz, od kiedy liczyć sprzedaż. Domyślnie jest to 7 dni wstecz. Starsze zamówienia nie wejdą do plików.'
            }
          </Alert>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <DatePicker
              label="Początek"
              value={start}
              onChange={(value) => {
                startTouched.current = true;
                setStartDate(value);
              }}
              maxDate={dayjs()}
              slotProps={{ textField: { size: 'small' } }}
            />
            <LoadingButton
              variant="contained"
              loading={isSettingStart}
              disabled={!start}
              onClick={saveStart}
            >
              {'Ustaw początek'}
            </LoadingButton>
          </Stack>
        </Stack>
      )}

      {preview && !preview.needsStart && (
        <>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
              <Typography variant="body1">
                {preview.blockedReason === 'empty'
                  ? `Od ${formatExportMoment(preview.exportedUntil)} do ${formatExportMoment(preview.windowUntil)} nie ma sztuk do zdjęcia ze stanu.`
                  : rangeIsOpen
                    ? `Plik obejmie sprzedaż od ${formatExportMoment(preview.exportedUntil)} do ${formatExportMoment(preview.windowUntil)}.`
                    : `Żeby pobrać sprzedaż po ${formatExportMoment(preview.exportedUntil)}, zsynchronizuj zamówienia.`}
              </Typography>

              {preview.truncated && (
                <Typography variant="body2" color="text.secondary">
                  {'Plik ma najwyżej 93 dni. Reszta będzie w następnym.'}
                </Typography>
              )}

              {preview.channels.length > 0 && (
                <Stack spacing={0.5}>
                  {preview.channels.map((channel) => (
                    <Stack
                      key={channel.channel}
                      direction="row"
                      spacing={1.5}
                      alignItems="baseline"
                    >
                      <Typography variant="body2" sx={{ minWidth: 120 }}>
                        {orderChannelLabel(channel.channel)}
                      </Typography>
                      <Typography
                        variant="body2"
                        color={channel.gap ? 'warning.main' : 'text.secondary'}
                      >
                        {channel.gap ? 'do zsynchronizowania' : 'gotowe'}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <LoadingButton
                  variant="outlined"
                  startIcon={<SyncIcon />}
                  loading={isSyncing}
                  onClick={syncOrders}
                >
                  {'Synchronizuj zamówienia'}
                </LoadingButton>
                <LoadingButton
                  variant="contained"
                  startIcon={<FileDownloadOutlinedIcon />}
                  disabled={!canDownload}
                  loading={isPending}
                  onClick={downloadFile}
                >
                  {'Pobierz plik .txt'}
                </LoadingButton>
              </Stack>
            </Stack>
          </Paper>

          {preview.blockedReason === 'no_channels' && (
            <Alert severity="warning">
              {'Podłącz kanał sprzedaży, żeby pobrać plik.'}
            </Alert>
          )}

          {failedChannels.length > 0 && (
            <Alert severity="error">
              {failedChannels
                .map(
                  (channel) =>
                    `${orderChannelLabel(channel.channel)}: ${channel.error || 'błąd synchronizacji'}`,
                )
                .join(' ')}
            </Alert>
          )}

          {(syncResult?.statusRefreshFailed ?? 0) > 0 && (
            <Alert severity="warning">
              {`Nie udało się sprawdzić statusu ${syncResult?.statusRefreshFailed} zamówień. Zostają na liście poniżej.`}
            </Alert>
          )}

          {(syncResult?.statusRefreshDeferred ?? 0) > 0 && (
            <Alert severity="info">
              {`Zostało ${syncResult?.statusRefreshDeferred} zamówień do sprawdzenia. Zsynchronizuj jeszcze raz przed pobraniem pliku.`}
            </Alert>
          )}

          {showFileTable && summary && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {[
                ['Zamówienia', summary.ordersCount],
                ['Linie w pliku', summary.linesCount],
                ['Sztuki', summary.piecesCount],
                [
                  'Netto',
                  formatPrice(
                    (preview?.lines ?? []).reduce(
                      (sum, row) => sum + (row.netGrosze || 0),
                      0,
                    ),
                    'PLN',
                  ),
                ],
                ['Pominięte', summary.skippedCount],
                ['Poza plikiem', summary.excludedCount],
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
          )}

          {showFileTable && (
            <Box height={480}>
              <DataGrid
                sx={gridSx}
                rows={preview.lines}
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
          )}

          {preview.outsideRange.length > 0 && (
            <Stack spacing={1}>
              <Typography variant="h6">
                {'Z wcześniejszych zamówień'}
              </Typography>
              <Typography variant="body2">
                {
                  'Nie było ich w poprzednim pliku. Ich sztuki są w tabeli powyżej.'
                }
              </Typography>
              <Box
                height={Math.min(120 + preview.outsideRange.length * 52, 420)}
              >
                <DataGrid
                  sx={gridSx}
                  rows={preview.outsideRange}
                  columns={outsideColumns}
                  getRowId={(row) => `${row.orderItemId}-${row.productId}`}
                  disableRowSelectionOnClick
                  hideFooter={preview.outsideRange.length <= 25}
                  pageSizeOptions={[25, 50]}
                  localeText={{ noRowsLabel: 'Brak pozycji spoza zakresu' }}
                />
              </Box>
            </Stack>
          )}

          {(preview.excluded.length > 0 ||
            preview.summary.excludedCount > 0) && (
            <Stack spacing={1}>
              <Typography variant="h6">{'Poza plikiem'}</Typography>
              <Typography variant="body2">
                {
                  'Wstrzymane wejdą do późniejszego pliku, gdy da się je zaliczyć do dowodu. Lista pokazuje zamówienia, których ten plik jeszcze nie zdjął, od najnowszych.'
                }
                {preview.excludedTruncated
                  ? ` Pokazane są pierwsze zamówienia z ${preview.summary.excludedCount}.`
                  : ''}
              </Typography>
              <Box height={Math.min(120 + preview.excluded.length * 52, 420)}>
                <DataGrid
                  sx={gridSx}
                  rows={preview.excluded}
                  columns={excludedColumns}
                  columnHeaderHeight={72}
                  getRowId={(row) => row.orderId}
                  disableRowSelectionOnClick
                  hideFooter={preview.excluded.length <= 25}
                  pageSizeOptions={[25, 50]}
                  localeText={{ noRowsLabel: 'Brak zamówień poza plikiem' }}
                />
              </Box>
            </Stack>
          )}

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
                    '. Po poprawce wejdą do następnego pliku, także starsze zamówienia.'
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

          {preview.corrections.length > 0 && (
            <Stack spacing={1}>
              <Typography variant="h6">{'Korekty'}</Typography>
              <Typography variant="body2">
                {
                  'To już zeszło w pliku, a bieżący stan jest inny. Paragon oznaczony po pobraniu pliku oraz zamówienie wyeksportowane już według dowodu, które potem wypadło z dowodu, mają teraz 0 sztuk — stan w PC Market trzeba przywrócić ręcznie. Zwrot towaru jest na tej liście tak samo: w pliku tyle zeszło, teraz tyle zostaje, i po odhaczeniu te sztuki nie wchodzą do następnego pliku. Po odhaczeniu pozostałe korekty mogą wrócić do następnego pliku, gdy zamówienie znowu wchodzi do dowodu. Plik zawiera tylko ilości dodatnie. Korekta znika po odhaczeniu i wraca, gdy różnica znowu się zmieni.'
                }
                {preview.correctionsTruncated
                  ? ` Pokazane są pierwsze korekty z ${preview.summary.correctionsCount}.`
                  : ''}
              </Typography>
              <Box
                height={Math.min(160 + preview.corrections.length * 52, 420)}
              >
                <DataGrid
                  sx={gridSx}
                  rows={preview.corrections}
                  columns={correctionColumns}
                  getRowId={(row) => `${row.orderItemId}-${row.productId}`}
                  disableRowSelectionOnClick
                  hideFooter={preview.corrections.length <= 25}
                  pageSizeOptions={[25, 50]}
                  localeText={{ noRowsLabel: 'Brak korekt' }}
                />
              </Box>
            </Stack>
          )}

          {preview.pending.length > 0 && (
            <Stack spacing={1}>
              <Typography variant="h6">{'Oczekujące'}</Typography>
              <Typography variant="body2">
                {
                  'To zamówienia, które jeszcze nie schodzą ze stanu, bo brakuje płatności. Pobrania przy ustawieniu „Na kasie”, paragony i faktury poza dowodem są na liście „Poza plikiem”.'
                }
                {preview.pendingTruncated
                  ? ` Pokazane są pierwsze zamówienia z ${preview.summary.pendingCount}.`
                  : ''}
              </Typography>
              <Box height={Math.min(120 + preview.pending.length * 52, 420)}>
                <DataGrid
                  sx={gridSx}
                  rows={preview.pending}
                  columns={pendingColumns}
                  getRowId={(row) => row.orderItemId}
                  disableRowSelectionOnClick
                  hideFooter={preview.pending.length <= 25}
                  pageSizeOptions={[25, 50]}
                  localeText={{ noRowsLabel: 'Brak oczekujących' }}
                />
              </Box>
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
};
