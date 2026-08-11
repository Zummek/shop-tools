import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { useAppSelector, useNotify } from '../../../../../hooks';
import { Pages } from '../../../../../utils';
import {
  useAcknowledgeAlert,
  useAcknowledgeAllAlerts,
  useGetAlerts,
} from '../../api';
import { AlertSeverityChip, AlertStatusChip } from '../../components';
import { AlertListItem, AlertSeverity, AlertStatus } from '../../types';
import { ALERT_TYPE_OPTIONS, alertChannelLabel, alertTypeLabels } from '../../utils';

const EllipsisCell = ({ value }: { value: string | null | undefined }) => {
  const text = value || '—';
  return (
    <Tooltip title={text} enterDelay={500}>
      <Typography
        variant="body2"
        noWrap
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
        }}
      >
        {text}
      </Typography>
    </Tooltip>
  );
};

export const AlertsListPage = () => {
  const { notify } = useNotify();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.smSystemUser);

  const [isAcknowledgeAllDialogOpen, setIsAcknowledgeAllDialogOpen] =
    useState(false);

  const {
    alerts,
    totalCount,
    isLoading,
    page,
    pageSize,
    setPage,
    status,
    setStatus,
    type,
    setType,
    severity,
    setSeverity,
    channel,
    setChannel,
  } = useGetAlerts();
  const {
    acknowledgeAlert,
    isPending: isAcknowledgePending,
    pendingAlertId,
  } = useAcknowledgeAlert();
  const { acknowledgeAllAlerts, isPending: isAcknowledgingAll } =
    useAcknowledgeAllAlerts();

  if (!user?.permissions?.canViewAlerts)
    return <Navigate to={Pages.smSystem} replace />;

  const handleProductClick = (productId: number) => {
    navigate(
      Pages.smSystemProductDetails.replace(':productId', String(productId)),
    );
  };

  const handleAcknowledge = async (id: number) => {
    try {
      await acknowledgeAlert(id);
    } catch {
      // error is reported via the mutation's onError handler
    }
  };

  const handleAcknowledgeAll = async () => {
    try {
      const result = await acknowledgeAllAlerts();
      notify(
        'success',
        `Oznaczono ${result.acknowledged} alertów jako sprawdzone`,
      );
    } catch {
      // error is reported via the mutation's onError handler
    } finally {
      setIsAcknowledgeAllDialogOpen(false);
    }
  };

  const columns: GridColDef<AlertListItem>[] = [
    {
      field: 'severity',
      headerName: 'Ważność',
      width: 130,
      renderCell: ({ row }) => <AlertSeverityChip severity={row.severity} />,
    },
    {
      field: 'title',
      headerName: 'Alert',
      minWidth: 220,
      flex: 1.4,
      renderCell: ({ row }) => (
        <Stack spacing={0.25} sx={{ py: 0.5, minWidth: 0, width: '100%' }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {row.title}
          </Typography>
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            {row.product != null && row.productName && (
              <Typography
                variant="caption"
                color="primary"
                sx={{ cursor: 'pointer' }}
                onClick={(event) => {
                  event.stopPropagation();
                  handleProductClick(row.product as number);
                }}
              >
                {row.productName}
              </Typography>
            )}
            {row.externalUrl && (
              <Link
                href={row.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="caption"
                onClick={(event) => event.stopPropagation()}
              >
                {'Zobacz ofertę'}
              </Link>
            )}
          </Stack>
        </Stack>
      ),
    },
    {
      field: 'message',
      headerName: 'Wiadomość',
      minWidth: 220,
      flex: 1.4,
      renderCell: ({ row }) => <EllipsisCell value={row.message} />,
    },
    {
      field: 'channel',
      headerName: 'Kanał',
      width: 130,
      valueFormatter: (value: string | null) => alertChannelLabel(value),
    },
    {
      field: 'occurrences',
      headerName: 'Wystąpienia',
      width: 110,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'lastSeenAt',
      headerName: 'Ostatnio wykryty',
      width: 160,
      valueFormatter: (value: string) => dayjs(value).format('DD.MM.YYYY HH:mm'),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: ({ row }) => <AlertStatusChip status={row.status} />,
    },
    {
      field: 'acknowledgedBy',
      headerName: 'Sprawdzone przez',
      minWidth: 200,
      flex: 1,
      renderCell: ({ row }) => {
        if (!row.acknowledgedBy) return <EllipsisCell value={null} />;
        const dateLabel = row.acknowledgedAt
          ? dayjs(row.acknowledgedAt).format('DD.MM.YYYY HH:mm')
          : '';
        return (
          <EllipsisCell
            value={`Sprawdził: ${row.acknowledgedBy.fullName}${
              dateLabel ? ` · ${dateLabel}` : ''
            }`}
          />
        );
      },
    },
    {
      field: 'action',
      headerName: '',
      width: 60,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ row }) => {
        if (row.status === 'resolved') return null;

        if (row.status === 'acknowledged') {
          return (
            <Tooltip title="Alert sprawdzony">
              <span>
                <IconButton size="small" disabled>
                  <DoneAllIcon fontSize="small" color="success" />
                </IconButton>
              </span>
            </Tooltip>
          );
        }

        const isRowPending =
          isAcknowledgePending && pendingAlertId === row.id;

        return (
          <Tooltip title="Oznacz jako sprawdzone">
            <span>
              <IconButton
                size="small"
                disabled={isRowPending}
                onClick={(event) => {
                  event.stopPropagation();
                  handleAcknowledge(row.id);
                }}
              >
                <DoneIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <Stack spacing={2}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        gap={2}
        flexWrap="wrap"
      >
        <Typography variant="h5">{'Alerty'}</Typography>
        <Button
          variant="contained"
          startIcon={<DoneAllIcon />}
          onClick={() => setIsAcknowledgeAllDialogOpen(true)}
        >
          {'Oznacz wszystkie jako sprawdzone'}
        </Button>
      </Box>

      <Stack direction="row" spacing={2} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="alert-status-filter-label">{'Status'}</InputLabel>
          <Select
            labelId="alert-status-filter-label"
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as AlertStatus | '')}
          >
            <MenuItem value="">
              <em>{'Wszystkie'}</em>
            </MenuItem>
            <MenuItem value="active">{'Aktywne'}</MenuItem>
            <MenuItem value="acknowledged">{'Sprawdzone'}</MenuItem>
            <MenuItem value="resolved">{'Rozwiązane'}</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="alert-type-filter-label">{'Typ'}</InputLabel>
          <Select
            labelId="alert-type-filter-label"
            label="Typ"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
          >
            <MenuItem value="">
              <em>{'Wszystkie'}</em>
            </MenuItem>
            {ALERT_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {alertTypeLabels[option.value]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="alert-severity-filter-label">
            {'Ważność'}
          </InputLabel>
          <Select
            labelId="alert-severity-filter-label"
            label="Ważność"
            value={severity}
            onChange={(e) =>
              setSeverity(e.target.value as AlertSeverity | '')
            }
          >
            <MenuItem value="">
              <em>{'Wszystkie'}</em>
            </MenuItem>
            <MenuItem value="critical">{'Krytyczny'}</MenuItem>
            <MenuItem value="warning">{'Ostrzeżenie'}</MenuItem>
            <MenuItem value="info">{'Informacja'}</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="alert-channel-filter-label">{'Kanał'}</InputLabel>
          <Select
            labelId="alert-channel-filter-label"
            label="Kanał"
            value={channel}
            onChange={(e) => setChannel(e.target.value as typeof channel)}
          >
            <MenuItem value="">
              <em>{'Wszystkie'}</em>
            </MenuItem>
            <MenuItem value="allegro">{'Allegro'}</MenuItem>
            <MenuItem value="woocommerce">{'WooCommerce'}</MenuItem>
            <MenuItem value="erli">{'Erli'}</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Box height={560} width="100%">
        <DataGrid
          sx={{
            '& .MuiDataGrid-columnHeaderTitle': {
              whiteSpace: 'normal',
              lineHeight: 'normal',
            },
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
            },
            '& .MuiDataGrid-cellContent': {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            },
          }}
          rows={alerts}
          rowCount={totalCount || 0}
          columns={columns}
          pageSizeOptions={[pageSize]}
          loading={isLoading}
          paginationModel={{
            page,
            pageSize,
          }}
          onPaginationModelChange={(model) => setPage(model.page)}
          paginationMode="server"
          getRowHeight={() => 'auto'}
          disableColumnSorting
          disableRowSelectionOnClick
          disableColumnMenu
          style={{
            width: '100%',
          }}
          slotProps={{
            pagination: {
              showFirstButton: true,
            },
          }}
        />
      </Box>

      <Dialog
        open={isAcknowledgeAllDialogOpen}
        onClose={() => setIsAcknowledgeAllDialogOpen(false)}
      >
        <DialogTitle>{'Oznaczyć wszystkie alerty jako sprawdzone?'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {
              'Wszystkie aktywne alerty widoczne dla Ciebie zostaną oznaczone jako sprawdzone. Tej operacji nie można odwrócić.'
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsAcknowledgeAllDialogOpen(false)}>
            {'Anuluj'}
          </Button>
          <LoadingButton
            variant="contained"
            loading={isAcknowledgingAll}
            onClick={handleAcknowledgeAll}
          >
            {'Oznacz wszystkie jako sprawdzone'}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
