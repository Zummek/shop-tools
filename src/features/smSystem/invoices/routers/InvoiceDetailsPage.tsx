import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import {
  Box,
  Button,
  Chip,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { useNotify } from '../../../../hooks';
import { Pages } from '../../../../utils';
import { formatPrice } from '../../products/utils';
import {
  InvoiceItem,
  InvoiceStatus,
  ProductMatchType,
  useDeleteInvoice,
  useExportInvoiceToPcMarket,
  useGetInvoiceDetails,
  useUpdateInvoiceStatus,
} from '../api';
import { invoiceStatusColors, invoiceStatusLabels } from '../utils';

const INVOICE_STATUSES: InvoiceStatus[] = [
  'IMPORTED',
  'PENDING_RECEIPT',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
];

export const InvoiceDetailsPage = () => {
  const navigate = useNavigate();
  const { notify } = useNotify();
  const [searchParams] = useSearchParams();

  const { invoiceId: rawInvoiceId } = useParams<{ invoiceId: string }>();
  const id = Number(rawInvoiceId);

  const { invoice, isLoading } = useGetInvoiceDetails({ id });
  const { deleteInvoice, isPending: isDeleting } = useDeleteInvoice();
  const { exportInvoiceToPcMarket } = useExportInvoiceToPcMarket();
  const { updateInvoiceStatus, isPending: isUpdatingStatus } =
    useUpdateInvoiceStatus();
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  const isThereAnyDiscount = invoice?.items?.some(
    (item) => (item.discountAmount ?? 0) > 0
  );

  const itemsColumns: GridColDef<InvoiceItem>[] = [
    {
      field: 'lineNumber',
      headerName: 'Lp.',
      width: 60,
      align: 'center',
    },
    {
      field: 'productName',
      headerName: 'Nazwa produktu',
      width: 300,
      minWidth: 200,
    },
    {
      field: 'gtin',
      headerName: 'GTIN/EAN',
      width: 140,
    },
    {
      field: 'unit',
      headerName: 'Jednostka',
      width: 80,
    },
    {
      field: 'quantity',
      headerName: 'Ilość',
      width: 80,
      align: 'right',
      valueFormatter: (value: string) => value ?? '',
    },
    {
      field: 'vatRate',
      headerName: 'VAT %',
      width: 80,
      align: 'right',
    },
    {
      field: 'unitNetPrice',
      headerName: 'Cena netto szt.',
      width: 120,
      align: 'right',
      valueFormatter: (value: string) => formatPrice(value, invoice?.currency),
    },
    {
      field: 'unitGrossPrice',
      headerName: 'Cena brutto szt.',
      width: 120,
      align: 'right',
      valueFormatter: (value: string) => formatPrice(value, invoice?.currency),
    },
    {
      field: 'unitNetDiscount',
      headerName: 'Rabat netto szt.',
      width: 130,
      align: 'right',
      renderCell: ({ row }) => {
        return (
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            height="100%"
          >
            <Typography variant="body2">
              {formatPrice(row.unitNetDiscount ?? 0, invoice?.currency)}
            </Typography>
            <Typography variant="body2">
              {row.discountPercentage ?? 0}
              {'%'}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'discountAmount',
      headerName: 'Suma rabatów netto',
      width: 120,
      align: 'right',
      valueFormatter: (value: string) => formatPrice(value, invoice?.currency),
    },
    {
      field: 'netAmount',
      headerName: 'Kwota netto',
      width: 120,
      align: 'right',
      valueFormatter: (value: string) => formatPrice(value, invoice?.currency),
    },
    {
      field: 'grossAmount',
      headerName: 'Kwota brutto',
      width: 120,
      align: 'right',
      valueFormatter: (value: string) => formatPrice(value, invoice?.currency),
    },
    {
      field: 'productMatchType',
      headerName: 'Status dopasowania',
      width: 180,
      renderCell: ({ row }) => {
        const matchLabels: Record<ProductMatchType, string> = {
          NONE: 'Niedopasowany',
          GTIN: 'Auto (EAN)',
          MANUAL: 'Ręcznie',
          PREVIOUS_MANUAL: 'Auto (poprzednie)',
        };
        const matchColors: Record<
          ProductMatchType,
          'error' | 'success' | 'info' | 'secondary'
        > = {
          NONE: 'error',
          GTIN: 'success',
          MANUAL: 'info',
          PREVIOUS_MANUAL: 'secondary',
        };

        return (
          <Chip
            label={matchLabels[row.productMatchType as ProductMatchType]}
            color={matchColors[row.productMatchType as ProductMatchType]}
            size="small"
          />
        );
      },
    },
  ];

  const handleExport = async () => {
    if (!invoice) return;

    try {
      await exportInvoiceToPcMarket({
        id: invoice.id,
        sellerName: invoice.sellerName,
        invoiceDate: invoice.invoiceDate,
      });
      notify('success', 'Faktura została wyeksportowana');
    } catch (error) {
      notify('error', 'Błąd podczas eksportowania faktury');
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;

    if (
      !window.confirm(
        `Czy na pewno chcesz usunąć fakturę ${invoice.invoiceNumber}?`
      )
    )
      return;

    try {
      await deleteInvoice({ id: invoice.id });
      notify('success', 'Faktura została usunięta');
      const returnPage = searchParams.get('returnPage');
      const invoicesPath = returnPage
        ? `${Pages.smSystemInvoices}?page=${returnPage}`
        : Pages.smSystemInvoices;
      navigate(invoicesPath);
    } catch (error) {
      notify('error', 'Błąd podczas usuwania faktury');
    }
  };

  const handleStatusChange = async (status: InvoiceStatus) => {
    if (!invoice || status === invoice.status) {
      setStatusMenuAnchor(null);
      return;
    }
    try {
      await updateInvoiceStatus({ id: invoice.id, status });
      notify('success', 'Status faktury został zaktualizowany');
      setStatusMenuAnchor(null);
    } catch (error) {
      notify('error', 'Błąd podczas aktualizacji statusu');
    }
  };

  if (isLoading || !invoice) {
    return (
      <Stack spacing={4}>
        <Typography variant="h4">{'Ładowanie...'}</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <Box>
        <Button
          variant="outlined"
          onClick={() => {
            const returnPage = searchParams.get('returnPage');
            const invoicesPath = returnPage
              ? `${Pages.smSystemInvoices}?page=${returnPage}`
              : Pages.smSystemInvoices;
            navigate(invoicesPath);
          }}
        >
          {'Powrót'}
        </Button>
      </Box>

      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h4" component="h1">
          {`Faktura ${invoice.invoiceNumber}`}
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
          >
            {'Eksportuj do PC-Market'}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {'Usuń'}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6">{'Status:'}</Typography>
            <Chip
              label={invoiceStatusLabels[invoice.status]}
              color={invoiceStatusColors[invoice.status]}
              onClick={(e) => setStatusMenuAnchor(e.currentTarget)}
              onDelete={() => setStatusMenuAnchor(null)}
              deleteIcon={<ArrowDropDownIcon />}
              disabled={isUpdatingStatus}
            />
            <Menu
              anchorEl={statusMenuAnchor}
              open={Boolean(statusMenuAnchor)}
              onClose={() => setStatusMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              {INVOICE_STATUSES.map((status) => (
                <MenuItem
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  selected={status === invoice.status}
                >
                  <Chip
                    size="small"
                    label={invoiceStatusLabels[status]}
                    color={invoiceStatusColors[status]}
                    sx={{ pointerEvents: 'none' }}
                  />
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', width: '200px' }}>
                    {'Data faktury'}
                  </TableCell>
                  <TableCell>
                    {dayjs(invoice.invoiceDate).format('DD.MM.YYYY')}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {'Typ faktury'}
                  </TableCell>
                  <TableCell>{invoice.invoiceType}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>{'Waluta'}</TableCell>
                  <TableCell>{invoice.currency}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {'Sprzedawca'}
                  </TableCell>
                  <TableCell>
                    {invoice.sellerName}
                    {' (NIP: '}
                    {invoice.sellerNip}
                    {')'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>{'Nabywca'}</TableCell>
                  <TableCell>
                    {invoice.buyerName}
                    {' (NIP: '}
                    {invoice.buyerNip}
                    {')'}
                  </TableCell>
                </TableRow>
                {invoice.netAmount && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {'Kwota netto'}
                    </TableCell>
                    <TableCell>
                      {formatPrice(invoice.netAmount, invoice.currency)}
                    </TableCell>
                  </TableRow>
                )}
                {invoice.vatAmount && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {'Kwota VAT'}
                    </TableCell>
                    <TableCell>
                      {formatPrice(invoice.vatAmount, invoice.currency)}
                    </TableCell>
                  </TableRow>
                )}
                {invoice.grossAmount && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {'Kwota brutto'}
                    </TableCell>
                    <TableCell>
                      {formatPrice(invoice.grossAmount, invoice.currency)}
                    </TableCell>
                  </TableRow>
                )}
                {invoice.paymentMethod && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {'Sposób płatności'}
                    </TableCell>
                    <TableCell>{invoice.paymentMethod}</TableCell>
                  </TableRow>
                )}
                {invoice.paymentDueDate && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {'Termin płatności'}
                    </TableCell>
                    <TableCell>
                      {dayjs(invoice.paymentDueDate).format('DD.MM.YYYY')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Paper>

      <Typography variant="h5">{'Pozycje faktury'}</Typography>

      <Box height={500} width="100%">
        <DataGrid
          sx={{
            '& .MuiDataGrid-columnHeaderTitle': {
              whiteSpace: 'normal',
              lineHeight: 'normal',
            },
          }}
          rows={invoice.items}
          rowCount={invoice.items.length}
          columns={itemsColumns}
          pageSizeOptions={[invoice.items.length]}
          loading={isLoading}
          columnVisibilityModel={{
            discountAmount: isThereAnyDiscount ?? false,
            unitNetDiscount: isThereAnyDiscount ?? false,
          }}
          paginationModel={{
            page: 0,
            pageSize: invoice.items.length,
          }}
          paginationMode="server"
          disableColumnSorting
          disableRowSelectionOnClick
          hideFooter
          onRowClick={() => {}}
          disableColumnMenu
          onPaginationModelChange={() => {}}
          style={{
            width: '100%',
          }}
        />
      </Box>
    </Stack>
  );
};
