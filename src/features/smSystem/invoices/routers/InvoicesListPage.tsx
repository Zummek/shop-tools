import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridSortModel,
} from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useNotify } from '../../../../hooks';
import { Pages } from '../../../../utils';
import { formatPrice } from '../../products/utils';
import {
  InvoiceListItem,
  InvoiceListSortBy,
  InvoiceStatus,
  useExportInvoiceToPcMarket,
  useGetInvoices,
} from '../api';
import { ImportInvoiceModal } from '../modals/ImportInvoiceModal';
import { invoiceStatusColors, invoiceStatusLabels } from '../utils';

const columns: GridColDef<InvoiceListItem>[] = [
  {
    field: 'invoiceNumber',
    headerName: 'Numer faktury',
    width: 200,
    minWidth: 150,
    sortable: false,
  },
  {
    field: 'invoiceDate',
    headerName: 'Data faktury',
    width: 120,
    valueFormatter: (value: string) => dayjs(value).format('DD.MM.YYYY'),
  },
  {
    field: 'createdAt',
    headerName: 'Data dołączenia',
    width: 120,
    valueFormatter: (value: string) => dayjs(value).format('DD.MM.YYYY HH:mm '),
  },
  {
    field: 'sellerName',
    headerName: 'Sprzedawca',
    width: 250,
    minWidth: 200,
    flex: 1,
    sortable: false,
  },
  {
    field: 'grossAmount',
    headerName: 'Kwota brutto',
    width: 120,
    align: 'right',
    sortable: false,
    valueFormatter: (value: string, row: InvoiceListItem) =>
      formatPrice(value, row.currency),
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 180,
    renderCell: ({ row }) => (
      <Chip
        label={invoiceStatusLabels[row.status as InvoiceStatus]}
        color={invoiceStatusColors[row.status as InvoiceStatus]}
        size="small"
      />
    ),
  },
  {
    field: 'action',
    headerName: '',
    headerAlign: 'right',
    align: 'right',
    width: 50,
    sortable: false,
    renderCell: () => (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          height: '100%',
        }}
      >
        <ChevronRightIcon style={{ fontSize: 30 }} />
      </Box>
    ),
  },
];

export const InvoicesListPage = () => {
  const { notify } = useNotify();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<number[]>([]);

  const {
    invoices,
    totalCount,
    isLoading,
    page,
    pageSize,
    setPage,
    invoiceNumber,
    setInvoiceNumber,
    sellerName,
    setSellerName,
    invoiceDateFrom,
    setInvoiceDateFrom,
    invoiceDateTo,
    setInvoiceDateTo,
    status,
    setStatus,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
  } = useGetInvoices();

  const { exportInvoiceToPcMarket } = useExportInvoiceToPcMarket();

  const handlePageChange = (_event: unknown, page: number): void =>
    setPage(page);

  const handleRowClick = (params: GridRowParams) => {
    const invoiceDetailsPath = Pages.smSystemInvoiceDetails.replace(
      ':invoiceId',
      params.id.toString(),
    );
    const currentParams = searchParams.toString();
    const urlWithParams = currentParams
      ? `${invoiceDetailsPath}?returnPage=${page + 1}`
      : invoiceDetailsPath;
    navigate(urlWithParams);
  };

  const handleExportSelected = async () => {
    if (selectedInvoiceIds.length === 0) {
      notify('warning', 'Nie wybrano żadnej faktury');
      return;
    }

    try {
      for (const id of selectedInvoiceIds) {
        const invoice = invoices.find((inv) => inv.id === id);
        if (invoice) {
          await exportInvoiceToPcMarket({
            id,
            sellerName: invoice.sellerName,
            invoiceDate: invoice.invoiceDate,
          });
        }
      }
      notify('success', 'Faktury zostały wyeksportowane');
    } catch (error) {
      notify('error', 'Błąd podczas eksportowania faktur');
    }
  };

  const handleDateFromChange = (value: Dayjs | null) => {
    setInvoiceDateFrom(value ? value.format('YYYY-MM-DD') : '');
  };

  const handleDateToChange = (value: Dayjs | null) => {
    setInvoiceDateTo(value ? value.format('YYYY-MM-DD') : '');
  };

  const invoiceStatuses: InvoiceStatus[] = [
    'IMPORTED',
    'PENDING_RECEIPT',
    'PARTIALLY_RECEIVED',
    'RECEIVED',
  ];

  const handleSortModelChange = (model: GridSortModel) => {
    if (!model.length) {
      setSortBy('invoiceDate');
      setSortOrder('desc');
      return;
    }
    const { field, sort } = model[0];
    const allowed: InvoiceListSortBy[] = ['invoiceDate', 'createdAt', 'status'];
    if (allowed.includes(field as InvoiceListSortBy) && sort) {
      setSortBy(field as InvoiceListSortBy);
      setSortOrder(sort);
    }
  };

  return (
    <Stack spacing={4}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h4" component="h1">
          {'Faktury'}
        </Typography>
        <Box display="flex" gap={2}>
          {selectedInvoiceIds.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportSelected}
            >
              {`Eksportuj zaznaczone (${selectedInvoiceIds.length})`}
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={() => setIsModalOpen(true)}
          >
            {'Importuj fakturę'}
          </Button>
        </Box>
      </Box>

      <Stack spacing={2}>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Numer faktury"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />
          <TextField
            label="Sprzedawca"
            value={sellerName}
            onChange={(e) => setSellerName(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />
          <DatePicker
            label="Data faktury od"
            value={invoiceDateFrom ? dayjs(invoiceDateFrom) : null}
            onChange={handleDateFromChange}
            slotProps={{ textField: { size: 'small' } }}
          />
          <DatePicker
            label="Data faktury do"
            value={invoiceDateTo ? dayjs(invoiceDateTo) : null}
            onChange={handleDateToChange}
            slotProps={{ textField: { size: 'small' } }}
          />
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="invoice-status-filter-label">{'Status'}</InputLabel>
            <Select
              labelId="invoice-status-filter-label"
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as InvoiceStatus | '')}
            >
              <MenuItem value="">
                <em>{'Wszystkie'}</em>
              </MenuItem>
              {invoiceStatuses.map((s) => (
                <MenuItem key={s} value={s}>
                  {invoiceStatusLabels[s]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      <Box height={500} width="100%">
        <DataGrid
          sx={{
            '& .MuiDataGrid-columnHeaderTitle': {
              whiteSpace: 'normal',
              lineHeight: 'normal',
            },
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              overflow: 'visible',
            },
            '& .MuiDataGrid-cellContent': {
              overflow: 'visible',
              whiteSpace: 'nowrap',
            },
          }}
          rows={invoices}
          rowCount={totalCount || 0}
          columns={columns}
          pageSizeOptions={[pageSize]}
          loading={isLoading}
          paginationModel={{
            page,
            pageSize,
          }}
          paginationMode="server"
          sortingMode="server"
          sortModel={[{ field: sortBy, sort: sortOrder }]}
          onSortModelChange={handleSortModelChange}
          checkboxSelection
          onRowSelectionModelChange={(newSelection) => {
            setSelectedInvoiceIds(newSelection as number[]);
          }}
          onRowClick={handleRowClick}
          disableColumnMenu
          style={{
            width: '100%',
          }}
          slotProps={{
            pagination: {
              showFirstButton: true,
              onPageChange: handlePageChange,
            },
          }}
        />
      </Box>

      <ImportInvoiceModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Stack>
  );
};
