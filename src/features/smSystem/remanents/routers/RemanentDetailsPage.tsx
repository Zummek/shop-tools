import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useNotify } from '../../../../hooks';
import { Pages } from '../../../../utils';
import {
  remanentLinesPageSize,
  remanentDocumentsPageSize,
  useAttachRemanentDocument,
  useCloseRemanent,
  useDetachRemanentDocument,
  useExportRemanent,
  useGetAttachableDocuments,
  useGetRemanent,
  useGetRemanentDocuments,
  useGetRemanentLines,
  useResolveRemanentProduct,
  useUpdateRemanent,
} from '../api';
import { RemanentStatusChip } from '../components/RemanentStatusChip';
import { RemanentBucket, RemanentLine, RemanentStatus } from '../types';

import { errorMessage } from './errorMessage';

const bucketLabel: Record<string, string> = {
  default: 'Do wyjaśnienia',
  difference: 'Różnice',
  conflict: 'Konflikty',
  match: 'Zgodne',
  unscanned: 'Nieskanowane',
  scanned: 'Wszystkie zeskanowane',
};

const documentStatusLabel: Record<string, string> = {
  PREPARING: 'W trakcie tworzenia',
  PREPARED: 'Przygotowany',
  POSTED: 'Zaksięgowany',
  CANCELED: 'Anulowany',
};

const formatAmount = (value: string | null) => {
  if (value == null || value === '') return '—';
  const asNumber = Number(value);
  return Number.isNaN(asNumber) ? value : String(asNumber);
};

const showWhen = (value: string | null) =>
  value ? dayjs(value).format('DD-MM-YYYY HH:mm') : 'brak daty synchronizacji';

export const RemanentDetailsPage = () => {
  const { notify } = useNotify();
  const navigate = useNavigate();
  const { remanentId: remanentIdParam } = useParams();
  const remanentId = Number(remanentIdParam);

  const [page, setPage] = useState(0);
  const [scansPage, setScansPage] = useState(0);
  const [tab, setTab] = useState<'lines' | 'scans'>('lines');
  const [bucket, setBucket] = useState<RemanentBucket | 'default'>('default');
  const [name, setName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [documentId, setDocumentId] = useState<number | ''>('');

  const { remanent, isLoading } = useGetRemanent(remanentId);
  const {
    documents,
    totalCount: documentsCount,
    isLoading: documentsLoading,
  } = useGetRemanentDocuments(remanentId, scansPage, tab === 'scans');
  const {
    lines,
    totalCount,
    isLoading: linesLoading,
  } = useGetRemanentLines({
    remanentId,
    page,
    bucket: bucket === 'default' ? '' : bucket,
  });
  const isOpen = remanent?.status === 'OPEN';
  const { documents: attachable, isLoading: attachableLoading } =
    useGetAttachableDocuments(remanentId, !!remanent && isOpen);
  const { updateRemanent, isPending: isSaving } = useUpdateRemanent(remanentId);
  const { attachDocument, isPending: isAttaching } =
    useAttachRemanentDocument(remanentId);
  const { detachDocument, isPending: isDetaching } =
    useDetachRemanentDocument(remanentId);
  const { resolveProduct } = useResolveRemanentProduct(remanentId);
  const { closeRemanent, isPending: isClosing } = useCloseRemanent(remanentId);
  const { exportRemanent, isPending: isExporting } =
    useExportRemanent(remanentId);

  useEffect(() => {
    if (!remanent) return;
    setName(remanent.name);
  }, [remanent]);

  const referenceHeader = isOpen ? 'Stan teraz' : 'Stan na zamknięcie';

  const columns = useMemo<GridColDef<RemanentLine & { id: number }>[]>(
    () => [
      {
        field: 'product',
        headerName: 'Produkt',
        flex: 1,
        minWidth: 180,
        valueGetter: (_value, row) => row.product.name,
      },
      {
        field: 'openingStock',
        headerName: 'Stan na otwarcie',
        width: 140,
        valueGetter: (_value, row) => formatAmount(row.openingStock),
      },
      {
        field: 'referenceStock',
        headerName: referenceHeader,
        width: 150,
        renderCell: (params) => (
          <Stack>
            <span>{formatAmount(params.row.referenceStock)}</span>
            <Typography variant="caption" color="text.secondary">
              {showWhen(params.row.referenceStockUpdatedAt)}
            </Typography>
          </Stack>
        ),
      },
      {
        field: 'countedAmount',
        headerName: 'Policzone',
        width: 140,
        renderCell: (params) => {
          if (params.row.bucket !== 'conflict')
            return formatAmount(params.row.countedAmount);
          const total = params.row.sessionsSum;
          return (
            <Stack spacing={0.5} py={0.5}>
              {params.row.sessions.map((session) => (
                <Stack
                  key={session.documentId}
                  spacing={0}
                  sx={{ whiteSpace: 'normal' }}
                >
                  <span>{`${session.documentName}: ${formatAmount(session.amount)}`}</span>
                  {isOpen && (
                    <Button
                      size="small"
                      onClick={() =>
                        resolveProduct({
                          productId: params.row.product.id,
                          mode: 'PICK',
                          documentId: session.documentId,
                        }).catch((error) =>
                          notify(
                            'error',
                            errorMessage(error, 'Nie udało się wybrać skanu'),
                          ),
                        )
                      }
                    >
                      {'Zostaw'}
                    </Button>
                  )}
                </Stack>
              ))}
              {isOpen && (
                <Button
                  size="small"
                  onClick={() =>
                    resolveProduct({
                      productId: params.row.product.id,
                      mode: 'SUM',
                    }).catch((error) =>
                      notify(
                        'error',
                        errorMessage(error, 'Nie udało się zapisać sumy'),
                      ),
                    )
                  }
                >
                  {`Suma (${formatAmount(total)})`}
                </Button>
              )}
            </Stack>
          );
        },
      },
      {
        field: 'difference',
        headerName: 'Różnica do otwarcia',
        width: 130,
        valueGetter: (_value, row) => formatAmount(row.difference),
      },
      {
        field: 'differenceNow',
        headerName: isOpen ? 'Różnica na teraz' : 'Różnica do zamknięcia',
        width: 130,
        valueGetter: (_value, row) => formatAmount(row.differenceNow),
      },
      {
        field: 'movement',
        headerName: 'Ruch od otwarcia',
        width: 140,
        valueGetter: (_value, row) => formatAmount(row.movement),
      },
      {
        field: 'bucket',
        headerName: 'Status',
        width: 150,
        valueGetter: (_value, row) => bucketLabel[row.bucket] || row.bucket,
      },
    ],
    [isOpen, notify, referenceHeader, resolveProduct],
  );

  const rows = lines.map((line) => ({ ...line, id: line.product.id }));
  const conflicts = remanent?.counts.conflict || 0;

  const saveHeader = async () => {
    try {
      await updateRemanent({ name: name.trim() });
      setEditingName(false);
      notify('success', 'Zapisano');
    } catch (error) {
      notify('error', errorMessage(error, 'Nie udało się zapisać'));
    }
  };

  const handleAttach = async () => {
    if (documentId === '') return;
    try {
      await attachDocument(documentId);
      setDocumentId('');
      notify('success', 'Skan podpięty');
    } catch (error) {
      notify('error', errorMessage(error, 'Nie udało się podpiąć skanu'));
    }
  };

  const handleStatusChange = (nextStatus: RemanentStatus) => {
    if (nextStatus !== 'CLOSED') return;
    closeRemanent()
      .then(() => notify('success', 'Remanent zamknięty'))
      .catch((error) =>
        notify('error', errorMessage(error, 'Nie udało się zamknąć remanentu')),
      );
  };

  const handleExport = async () => {
    try {
      await exportRemanent();
    } catch (error) {
      notify(
        'error',
        errorMessage(error, 'Nie udało się wyeksportować remanentu'),
      );
    }
  };

  if (!isLoading && !remanent)
    return <Typography>{'Nie znaleziono remanentu.'}</Typography>;

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button onClick={() => navigate(Pages.smSystemRemanents)}>
          {'Wróć do listy'}
        </Button>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography>{remanent ? remanent.branch.name : ''}</Typography>
          {remanent && (
            <RemanentStatusChip
              status={remanent.status}
              onStatusChange={handleStatusChange}
              isUpdating={isClosing}
            />
          )}
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        {editingName ? (
          <>
            <TextField
              label="Nazwa"
              value={name}
              onChange={(event) => setName(event.target.value)}
              size="small"
              autoFocus
              sx={{ minWidth: 280 }}
            />
            <LoadingButton
              variant="outlined"
              loading={isSaving}
              onClick={saveHeader}
              disabled={!name.trim()}
            >
              {'Zapisz'}
            </LoadingButton>
            <Button
              onClick={() => {
                setName(remanent?.name || '');
                setEditingName(false);
              }}
            >
              {'Anuluj'}
            </Button>
          </>
        ) : (
          <>
            <Typography variant="h6">{name}</Typography>
            <IconButton
              aria-label="Edytuj nazwę"
              size="small"
              onClick={() => setEditingName(true)}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </Stack>

      <Alert severity="info">
        {'Do PC Marketu idzie plik tego remanentu, po zamknięciu.'}
      </Alert>

      <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
        {!isOpen && (
          <LoadingButton
            variant="contained"
            loading={isExporting}
            onClick={handleExport}
          >
            {'Eksportuj do PC Market'}
          </LoadingButton>
        )}
        {conflicts > 0 && (
          <Typography color="warning.main" alignSelf="center">
            {`Konflikty do rozstrzygnięcia: ${conflicts}`}
          </Typography>
        )}
      </Stack>

      <Tabs
        value={tab}
        onChange={(_event, value: 'lines' | 'scans') => setTab(value)}
      >
        <Tab value="lines" label="Zestawienie" />
        <Tab value="scans" label={`Skany (${remanent?.documentCount ?? 0})`} />
      </Tabs>

      {tab === 'scans' && (
        <>
          <DataGrid
            rows={documents}
            columns={[
              { field: 'name', headerName: 'Nazwa', flex: 1, minWidth: 160 },
              {
                field: 'status',
                headerName: 'Status',
                width: 180,
                valueGetter: (_value, row) =>
                  documentStatusLabel[row.status] || row.status,
              },
              {
                field: 'detach',
                headerName: '',
                width: 120,
                sortable: false,
                renderCell: (params) =>
                  isOpen ? (
                    <Button
                      size="small"
                      color="warning"
                      disabled={isDetaching}
                      onClick={() =>
                        detachDocument(params.row.id).catch((error) =>
                          notify(
                            'error',
                            errorMessage(error, 'Nie udało się odpiąć skanu'),
                          ),
                        )
                      }
                    >
                      {'Odepnij'}
                    </Button>
                  ) : null,
              },
            ]}
            pageSizeOptions={[remanentDocumentsPageSize]}
            paginationMode="server"
            rowCount={documentsCount}
            paginationModel={{
              page: scansPage,
              pageSize: remanentDocumentsPageSize,
            }}
            onPaginationModelChange={(model) => setScansPage(model.page)}
            loading={documentsLoading}
            disableColumnMenu
            sx={{ height: 320 }}
            localeText={{ noRowsLabel: 'Brak podpiętych skanów.' }}
          />

          {isOpen && (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems="center"
            >
              <TextField
                select
                label="Dokument do podpięcia"
                value={documentId}
                onChange={(event) => setDocumentId(Number(event.target.value))}
                sx={{ minWidth: 280 }}
                disabled={attachableLoading || attachable.length === 0}
              >
                {attachable.map((document) => (
                  <MenuItem key={document.id} value={Number(document.id)}>
                    {document.name}
                  </MenuItem>
                ))}
              </TextField>
              <LoadingButton
                variant="outlined"
                loading={isAttaching}
                disabled={documentId === ''}
                onClick={handleAttach}
              >
                {'Podłącz skan'}
              </LoadingButton>
            </Stack>
          )}
        </>
      )}

      {tab === 'lines' && (
        <>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={bucket}
            onChange={(_event, value: RemanentBucket | 'default' | null) => {
              if (value === null) return;
              setBucket(value);
              setPage(0);
            }}
          >
            {Object.entries(bucketLabel).map(([value, label]) => (
              <ToggleButton key={value} value={value}>
                {label}
                {value === 'conflict' && remanent
                  ? ` (${remanent.counts.conflict})`
                  : ''}
                {value === 'unscanned' && remanent
                  ? ` (${remanent.counts.unscanned})`
                  : ''}
                {value === 'difference' && remanent
                  ? ` (${remanent.counts.difference})`
                  : ''}
                {value === 'match' && remanent
                  ? ` (${remanent.counts.match})`
                  : ''}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <DataGrid
            rows={rows}
            columns={columns}
            loading={isLoading || linesLoading}
            rowCount={totalCount}
            paginationMode="server"
            pageSizeOptions={[remanentLinesPageSize]}
            paginationModel={{ page, pageSize: remanentLinesPageSize }}
            onPaginationModelChange={(model) => setPage(model.page)}
            disableColumnSorting
            disableColumnMenu
            getRowHeight={() => 'auto'}
            sx={{
              minHeight: 420,
              '& .MuiDataGrid-columnHeaderTitle': {
                whiteSpace: 'normal',
                lineHeight: 'normal',
              },
            }}
          />
        </>
      )}
    </Stack>
  );
};
