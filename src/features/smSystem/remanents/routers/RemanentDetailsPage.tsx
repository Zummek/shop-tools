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
  useReopenRemanent,
  useUpdateRemanent,
} from '../api';
import { RemanentStatusChip } from '../components/RemanentStatusChip';
import { RemanentBucket, RemanentLine, RemanentStatus } from '../types';

import { errorMessage } from './errorMessage';

const bucketLabel: Record<string, string> = {
  difference: 'Różnice',
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
  const [bucket, setBucket] = useState<RemanentBucket>('difference');
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
    bucket,
  });
  const isOpen = remanent?.status === 'OPEN';
  const { documents: attachable, isLoading: attachableLoading } =
    useGetAttachableDocuments(remanentId, !!remanent && isOpen);
  const { updateRemanent, isPending: isSaving } = useUpdateRemanent(remanentId);
  const { attachDocument, isPending: isAttaching } =
    useAttachRemanentDocument(remanentId);
  const { detachDocument, isPending: isDetaching } =
    useDetachRemanentDocument(remanentId);
  const { closeRemanent, isPending: isClosing } = useCloseRemanent(remanentId);
  const { reopenRemanent, isPending: isReopening } =
    useReopenRemanent(remanentId);
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
        width: 180,
        renderCell: (params) => {
          const scans = params.row.sessions;
          if (scans.length < 2)
            return formatAmount(params.row.countedAmount);
          return (
            <Stack spacing={0} py={0.5} sx={{ whiteSpace: 'normal' }}>
              {scans.map((session) => (
                <Typography
                  key={session.documentId}
                  variant="caption"
                  color="text.secondary"
                >
                  {`${session.documentName}: ${formatAmount(session.amount)}`}
                </Typography>
              ))}
              <span>{formatAmount(params.row.countedAmount)}</span>
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
    [isOpen, referenceHeader],
  );

  const rows = lines.map((line) => ({ ...line, id: line.product.id }));

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
    if (nextStatus === 'CLOSED') {
      closeRemanent()
        .then(() => notify('success', 'Remanent zamknięty'))
        .catch((error) =>
          notify(
            'error',
            errorMessage(error, 'Nie udało się zamknąć remanentu'),
          ),
        );
      return;
    }
    if (nextStatus === 'OPEN') {
      reopenRemanent()
        .then(() => notify('success', 'Remanent otwarty'))
        .catch((error) =>
          notify(
            'error',
            errorMessage(error, 'Nie udało się otworzyć remanentu'),
          ),
        );
    }
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
              isUpdating={isClosing || isReopening}
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
          {isOpen && !attachableLoading && attachable.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              {
                'Dokument do podpięcia musi być z tego sklepu, utworzony po otwarciu remanentu, mieć pozycje, bez ujemnych ilości i nie być już podpięty.'
              }
            </Typography>
          )}
        </>
      )}

      {tab === 'lines' && (
        <>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={bucket}
            onChange={(_event, value: RemanentBucket | null) => {
              if (value === null) return;
              setBucket(value);
              setPage(0);
            }}
          >
            {Object.entries(bucketLabel).map(([value, label]) => (
              <ToggleButton key={value} value={value}>
                {label}
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
