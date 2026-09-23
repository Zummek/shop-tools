import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { MouseEvent, ReactNode, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { useAppSelector } from '../../../../../hooks';
import { Pages } from '../../../../../utils';
import { type InvoiceStatus } from '../../../invoices/types';
import { invoiceStatusLabels } from '../../../invoices/utils';
import { useGetProductDaySales, useGetProductHistory } from '../../api';
import {
  Product,
  ProductHistoryDailySale,
  ProductHistoryDays,
} from '../../types';
import { formatPrice } from '../../utils';

const transferStatusLabels: Record<string, string> = {
  PREPARING: 'W trakcie tworzenia',
  PREPARED: 'Przygotowany',
  RECEIVED: 'Odebrany',
  POSTED: 'Zaksięgowany',
  CANCELLED: 'Anulowany',
  CANCELED: 'Anulowany',
};

const formatQuantity = (value: number | null | undefined) => {
  if (value == null) return '—';
  return String(value);
};

const invoiceStatusLabel = (status: string) =>
  invoiceStatusLabels[status as InvoiceStatus] ?? status;

interface ProductWarehouseTabProps {
  product: Product;
}

export const ProductWarehouseTab = ({ product }: ProductWarehouseTabProps) => {
  const { user } = useAppSelector((state) => state.smSystemUser);
  const canViewPurchases = !!user?.permissions?.canViewPurchasePrices;
  const [days, setDays] = useState<ProductHistoryDays>(30);
  const { history, isLoading, isError, refetch } = useGetProductHistory(
    product.id,
    days,
  );

  const handleDaysChange = (
    _event: MouseEvent<HTMLElement>,
    value: string | null,
  ) => {
    if (value === '7' || value === '30' || value === '90')
      setDays(Number(value) as ProductHistoryDays);
  };

  return (
    <Stack spacing={3}>
      <Stack spacing={2}>
        <Typography variant="h6">{'Stany i ceny (oddziały)'}</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{'Oddział'}</TableCell>
              <TableCell align="right">{'Stan'}</TableCell>
              <TableCell align="right">{'Cena netto'}</TableCell>
              <TableCell align="right">{'Cena brutto'}</TableCell>
              <TableCell>{'Aktualizacja stanu'}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(product.branches || []).map((branch) => (
              <TableRow key={branch.branch.id}>
                <TableCell>{branch.branch.name}</TableCell>
                <TableCell align="right">{branch.stock}</TableCell>
                <TableCell align="right">
                  {formatPrice(branch.netPrice, 'PLN')}
                </TableCell>
                <TableCell align="right">
                  {formatPrice(branch.grossPrice, 'PLN')}
                </TableCell>
                <TableCell>
                  {branch.stockUpdatedAt
                    ? dayjs(branch.stockUpdatedAt).format('DD.MM.YYYY HH:mm')
                    : '—'}
                </TableCell>
              </TableRow>
            ))}
            {(!product.branches || product.branches.length === 0) && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">
                    {'Brak danych oddziałowych'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Stack>

      <Stack spacing={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          gap={2}
          flexWrap="wrap"
        >
          <Typography variant="h6">{'Zdarzenia magazynowe'}</Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={String(days)}
            onChange={handleDaysChange}
          >
            <ToggleButton value="7">{'7 dni'}</ToggleButton>
            <ToggleButton value="30">{'30 dni'}</ToggleButton>
            <ToggleButton value="90">{'90 dni'}</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {'To znane zdarzenia (sprzedaż, transfery, zakupy)'}
        </Typography>

        {isError ? (
          <Stack spacing={1} alignItems="flex-start">
            <Alert severity="error">
              {'Nie udało się pobrać zdarzeń magazynowych'}
            </Alert>
            <Button size="small" onClick={() => refetch()}>
              {'Spróbuj ponownie'}
            </Button>
          </Stack>
        ) : isLoading || !history ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Stack spacing={3}>
            <HistorySection title="Sprzedaż dzienna">
              <HistoryTable>
                <TableHead>
                  <TableRow>
                    <TableCell width={40} />
                    <TableCell>{'Data'}</TableCell>
                    <TableCell>{'Oddział'}</TableCell>
                    <TableCell align="right">{'Ilość'}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.salesDaily.map((row) => (
                    <DailySaleRow
                      key={`${row.date}-${row.branchId}`}
                      productId={product.id}
                      row={row}
                    />
                  ))}
                  {history.salesDaily.length === 0 && (
                    <EmptyRow colSpan={4} label="Brak sprzedaży w okresie" />
                  )}
                </TableBody>
              </HistoryTable>
            </HistorySection>

            <HistorySection title="Transfery">
              <HistoryTable>
                <TableHead>
                  <TableRow>
                    <TableCell>{'ID'}</TableCell>
                    <TableCell>{'Status'}</TableCell>
                    <TableCell>{'Z'}</TableCell>
                    <TableCell>{'Do'}</TableCell>
                    <TableCell align="right">{'Do transferu'}</TableCell>
                    <TableCell align="right">{'Przyjęto'}</TableCell>
                    <TableCell>{'Data'}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.transfers.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.humanId}</TableCell>
                      <TableCell>
                        {transferStatusLabels[row.status] ?? row.status}
                      </TableCell>
                      <TableCell>{row.sourceBranchName}</TableCell>
                      <TableCell>{row.destinationBranchName || '—'}</TableCell>
                      <TableCell align="right">
                        {formatQuantity(row.toTransferAmount)}
                      </TableCell>
                      <TableCell align="right">
                        {formatQuantity(row.receivedAmount)}
                      </TableCell>
                      <TableCell>
                        {dayjs(row.createdAt).format('DD.MM.YYYY HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                  {history.transfers.length === 0 && (
                    <EmptyRow colSpan={7} label="Brak transferów w okresie" />
                  )}
                </TableBody>
              </HistoryTable>
              {history.transfersTruncated && (
                <Typography variant="body2" color="text.secondary">
                  {'Pokazano 100 najnowszych transferów.'}
                </Typography>
              )}
            </HistorySection>

            {canViewPurchases && (
              <HistorySection title="Zakupy">
                <HistoryTable>
                  <TableHead>
                    <TableRow>
                      <TableCell>{'Faktura'}</TableCell>
                      <TableCell>{'Data'}</TableCell>
                      <TableCell>{'Dostawca'}</TableCell>
                      <TableCell align="right">{'Ilość'}</TableCell>
                      <TableCell align="right">{'Przyjęto'}</TableCell>
                      <TableCell align="right">{'Cena netto'}</TableCell>
                      <TableCell>{'Status'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(history.purchases ?? []).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Link
                            component={RouterLink}
                            to={Pages.smSystemInvoiceDetails.replace(
                              ':invoiceId',
                              String(row.invoiceId),
                            )}
                          >
                            {row.invoiceNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {dayjs(row.invoiceDate).format('DD.MM.YYYY')}
                        </TableCell>
                        <TableCell>{row.sellerName}</TableCell>
                        <TableCell align="right">
                          {formatQuantity(row.quantity)}
                        </TableCell>
                        <TableCell align="right">
                          {formatQuantity(row.receivedQuantity)}
                        </TableCell>
                        <TableCell align="right">
                          {row.unitNetPrice != null
                            ? formatPrice(row.unitNetPrice, row.currency)
                            : '—'}
                        </TableCell>
                        <TableCell>{invoiceStatusLabel(row.status)}</TableCell>
                      </TableRow>
                    ))}
                    {(history.purchases ?? []).length === 0 && (
                      <EmptyRow colSpan={7} label="Brak zakupów w okresie" />
                    )}
                  </TableBody>
                </HistoryTable>
                {history.purchasesTruncated && (
                  <Typography variant="body2" color="text.secondary">
                    {'Pokazano 100 najnowszych zakupów.'}
                  </Typography>
                )}
              </HistorySection>
            )}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
};

const DailySaleRow = ({
  productId,
  row,
}: {
  productId: number;
  row: ProductHistoryDailySale;
}) => {
  const [open, setOpen] = useState(false);
  const { daySales, isLoading, isError, refetch } = useGetProductDaySales(
    productId,
    row.date.slice(0, 10),
    row.branchId,
    open,
  );

  return (
    <>
      <TableRow
        hover
        sx={{ cursor: 'pointer' }}
        onClick={() => setOpen((value) => !value)}
      >
        <TableCell width={40} padding="checkbox">
          <IconButton
            size="small"
            aria-label={open ? 'Zwiń dokumenty' : 'Pokaż dokumenty'}
          >
            {open ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{dayjs(row.date).format('DD.MM.YYYY')}</TableCell>
        <TableCell>{row.branchName}</TableCell>
        <TableCell align="right">{formatQuantity(row.quantity)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell
          colSpan={4}
          sx={{ py: 0, borderBottom: open ? undefined : 'none' }}
        >
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box py={1} pl={3}>
              {isError ? (
                <Stack spacing={1} alignItems="flex-start" py={1}>
                  <Alert severity="error">
                    {'Nie udało się pobrać dokumentów sprzedaży'}
                  </Alert>
                  <Button size="small" onClick={() => refetch()}>
                    {'Spróbuj ponownie'}
                  </Button>
                </Stack>
              ) : isLoading || !daySales ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={22} />
                </Box>
              ) : (
                <Stack spacing={1}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{'Dokument'}</TableCell>
                        <TableCell>{'Godzina'}</TableCell>
                        <TableCell align="right">{'Ilość'}</TableCell>
                        <TableCell align="right">{'Cena brutto'}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {daySales.sales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>{sale.documentNumber}</TableCell>
                          <TableCell>
                            {dayjs(sale.saleDate).format('HH:mm')}
                          </TableCell>
                          <TableCell align="right">
                            {formatQuantity(sale.quantity)}
                          </TableCell>
                          <TableCell align="right">
                            {sale.unitGrossCents != null
                              ? formatPrice(sale.unitGrossCents, 'PLN')
                              : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                      {daySales.sales.length === 0 && (
                        <EmptyRow
                          colSpan={4}
                          label="Brak dokumentów sprzedaży"
                        />
                      )}
                    </TableBody>
                  </Table>
                  {daySales.salesTruncated && (
                    <Typography variant="body2" color="text.secondary">
                      {'Pokazano 100 najnowszych dokumentów z tego dnia.'}
                    </Typography>
                  )}
                </Stack>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const HISTORY_TABLE_MAX_HEIGHT = 360;

const HistoryTable = ({ children }: { children: ReactNode }) => (
  <TableContainer sx={{ maxHeight: HISTORY_TABLE_MAX_HEIGHT }}>
    <Table size="small" stickyHeader>
      {children}
    </Table>
  </TableContainer>
);

const HistorySection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <Stack spacing={1}>
    <Typography variant="subtitle1" fontWeight={600}>
      {title}
    </Typography>
    {children}
  </Stack>
);

const EmptyRow = ({ colSpan, label }: { colSpan: number; label: string }) => (
  <TableRow>
    <TableCell colSpan={colSpan}>
      <Typography color="text.secondary">{label}</Typography>
    </TableCell>
  </TableRow>
);
