import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
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
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import get from 'lodash/get';
import { KeyboardEvent, MouseEvent, ReactNode, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { useAppSelector, useNotify } from '../../../../../hooks';
import { Pages } from '../../../../../utils';
import { type InvoiceStatus } from '../../../invoices/types';
import { invoiceStatusLabels } from '../../../invoices/utils';
import {
  getProductDetailsQueryKey,
  getProductsQueryKeyBase,
  useGetProductDaySales,
  useGetProductHistory,
  useUpdateProduct,
} from '../../api';
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

const PRICE_INPUT_RE = /^\d+([.,]\d{1,2})?$/;

const centsToInput = (cents: number | null | undefined) => {
  if (cents == null) return '';
  return (cents / 100).toFixed(2).replace('.', ',');
};

const parsePriceInput = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (!PRICE_INPUT_RE.test(trimmed)) return NaN;
  return Math.round(parseFloat(trimmed.replace(',', '.')) * 100);
};

const ReportPurchasePrice = ({ product }: { product: Product }) => {
  const report = product.reportPurchase;
  const heroCents =
    report?.unitNetCents ?? product.lastPurchaseNetPrice ?? null;
  const invoiceId = report?.invoiceId;
  const invoiceNumber = report?.invoiceNumber;
  const fromInvoice = invoiceId != null && !!invoiceNumber;
  const lastReceivedCents = report?.lastReceivedNetCents;
  const lastReceivedDiffers =
    lastReceivedCents != null &&
    heroCents != null &&
    lastReceivedCents !== heroCents;
  const invoiceDate = report?.invoiceDate
    ? dayjs(report.invoiceDate).format('DD.MM.YYYY')
    : null;
  const seller = report?.sellerName?.trim() || null;

  return (
    <Stack spacing={0.5}>
      <Typography variant="h6">{'Cena zakupu netto'}</Typography>
      <Typography sx={{ fontSize: 20, fontWeight: 500 }}>
        {heroCents != null ? formatPrice(heroCents, 'PLN') : '—'}
      </Typography>
      {fromInvoice ? (
        <Typography>
          {'z faktury '}
          <Link
            component={RouterLink}
            to={Pages.smSystemInvoiceDetails.replace(
              ':invoiceId',
              String(invoiceId),
            )}
          >
            {invoiceNumber}
          </Link>
          {invoiceDate ? ` · ${invoiceDate}` : ''}
          {seller ? ` · ${seller}` : ''}
        </Typography>
      ) : null}
      {lastReceivedDiffers && lastReceivedCents != null ? (
        <Typography variant="body2" color="text.secondary">
          {`Ostatnia przyjęta: ${formatPrice(lastReceivedCents, 'PLN')}`}
          {report?.lastReceivedAt
            ? ` · ${dayjs(report.lastReceivedAt).format('DD.MM.YYYY')}`
            : ''}
        </Typography>
      ) : null}
      {!fromInvoice && !lastReceivedDiffers && product.lastPurchaseAt ? (
        <Typography variant="body2" color="text.secondary">
          {`Ostatnia przyjęta · ${dayjs(product.lastPurchaseAt).format('DD.MM.YYYY')}`}
        </Typography>
      ) : null}
    </Stack>
  );
};

const ManualPurchaseSection = ({ product }: { product: Product }) => {
  const { notify } = useNotify();
  const queryClient = useQueryClient();
  const { updateManualPurchaseNetPrice } = useUpdateProduct();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(() =>
    centsToInput(product.manualPurchaseNetPrice),
  );
  const [isSaving, setIsSaving] = useState(false);

  const vatMissing = product.vat == null;
  const canEdit = !!product.canEditManualPurchase && !vatMissing;
  const savedPrice =
    product.manualPurchaseNetPrice != null
      ? formatPrice(product.manualPurchaseNetPrice, 'PLN')
      : '—';

  const handleStartEdit = () => {
    setDraft(centsToInput(product.manualPurchaseNetPrice));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraft(centsToInput(product.manualPurchaseNetPrice));
    setIsEditing(false);
  };

  const handleSave = async () => {
    const cents = parsePriceInput(draft);
    if (Number.isNaN(cents)) {
      notify('error', 'Podaj cenę netto, np. 12,34');
      return;
    }
    setIsSaving(true);
    try {
      const updated = await updateManualPurchaseNetPrice(product.id, cents);
      queryClient.setQueryData<AxiosResponse<Product>>(
        getProductDetailsQueryKey(product.id),
        (current) => (current ? { ...current, data: updated } : current),
      );
      await queryClient.invalidateQueries({
        queryKey: getProductDetailsQueryKey(product.id),
      });
      await queryClient.invalidateQueries({
        queryKey: [getProductsQueryKeyBase],
        refetchType: 'all',
      });
      setIsEditing(false);
      notify('success', 'Zapisano ręczną cenę zakupu');
    } catch (error) {
      const apiMessage =
        get(error as AxiosError, 'response.data.manualPurchaseNetPrice.0') ||
        get(error as AxiosError, 'response.data.manual_purchase_net_price.0');
      notify(
        'error',
        typeof apiMessage === 'string'
          ? apiMessage
          : 'Nie udało się zapisać ceny zakupu',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDraftKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void handleSave();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      handleCancel();
    }
  };

  if (product.hasRealPurchase) return <ReportPurchasePrice product={product} />;

  return (
    <Stack spacing={2}>
      <Typography variant="h6">{'Cena zakupu netto'}</Typography>
      <Typography color="text.secondary">
        {'Brak historii zakupu z faktury.'}
      </Typography>
      {vatMissing && product.canEditManualPurchase ? (
        <Alert severity="warning">
          {'Ustaw stawkę VAT produktu, zanim wpiszesz ręczną cenę zakupu.'}
        </Alert>
      ) : null}
      {isEditing ? (
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <TextField
            size="small"
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleDraftKeyDown}
            disabled={isSaving}
            placeholder="0,00"
            helperText="PLN netto. Zastąpi ją pierwsza faktura zakupu."
            slotProps={{
              htmlInput: { 'aria-label': 'Cena zakupu netto' },
            }}
            sx={{ width: 220 }}
          />
          <IconButton
            color="primary"
            aria-label="Zapisz cenę zakupu"
            onClick={() => void handleSave()}
            disabled={isSaving}
            sx={{ mt: 0.25 }}
          >
            {isSaving ? <CircularProgress size={18} /> : <CheckIcon />}
          </IconButton>
          <IconButton
            aria-label="Anuluj edycję"
            onClick={handleCancel}
            disabled={isSaving}
            sx={{ mt: 0.25 }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      ) : (
        <Stack spacing={0.5}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography>{savedPrice}</Typography>
            {product.canEditManualPurchase ? (
              <Tooltip
                title={
                  vatMissing
                    ? 'Ustaw stawkę VAT, zanim wpiszesz cenę'
                    : 'Edytuj cenę zakupu netto'
                }
              >
                <span>
                  <IconButton
                    size="small"
                    aria-label="Edytuj cenę zakupu netto"
                    onClick={handleStartEdit}
                    disabled={!canEdit}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            ) : null}
          </Stack>
          {product.manualPurchaseSetAt ? (
            <Typography variant="caption" color="text.secondary">
              {`Zapisano ${dayjs(product.manualPurchaseSetAt).format(
                'DD.MM.YYYY HH:mm',
              )}`}
            </Typography>
          ) : null}
          {canEdit ? (
            <Typography variant="caption" color="text.secondary">
              {'PLN netto. Zastąpi ją pierwsza faktura zakupu.'}
            </Typography>
          ) : null}
        </Stack>
      )}
    </Stack>
  );
};

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
        <Typography variant="h6">{'Stany i ceny sprzedaży'}</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{'Oddział'}</TableCell>
              <TableCell align="right">{'Stan'}</TableCell>
              <TableCell align="right">{'Sprzedaż netto'}</TableCell>
              <TableCell align="right">{'Sprzedaż brutto'}</TableCell>
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

      {canViewPurchases && <ManualPurchaseSection product={product} />}

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
                      <TableCell align="right">{'Netto po rabacie'}</TableCell>
                      <TableCell>{'Status'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.reportPurchase &&
                    history.reportPurchase.outsideWindow ? (
                      <PurchaseRow
                        invoiceId={history.reportPurchase.invoiceId}
                        invoiceNumber={history.reportPurchase.invoiceNumber}
                        invoiceDate={history.reportPurchase.invoiceDate}
                        sellerName={history.reportPurchase.sellerName}
                        quantity={history.reportPurchase.quantity}
                        receivedQuantity={
                          history.reportPurchase.receivedQuantity
                        }
                        netCents={history.reportPurchase.unitNetCents}
                        currency={history.reportPurchase.currency}
                        status={history.reportPurchase.status}
                        pinned
                      />
                    ) : null}
                    {(history.purchases ?? []).map((row) => (
                      <PurchaseRow
                        key={row.id}
                        invoiceId={row.invoiceId}
                        invoiceNumber={row.invoiceNumber}
                        invoiceDate={row.invoiceDate}
                        sellerName={row.sellerName}
                        quantity={row.quantity}
                        receivedQuantity={row.receivedQuantity}
                        netCents={row.unitNetAfterDiscount ?? row.unitNetPrice}
                        currency={row.currency}
                        status={row.status}
                      />
                    ))}
                    {(history.purchases ?? []).length === 0 && (
                      <EmptyRow
                        colSpan={7}
                        label={
                          history.reportPurchase?.outsideWindow
                            ? 'Brak innych zakupów w okresie'
                            : 'Brak zakupów w okresie'
                        }
                      />
                    )}
                  </TableBody>
                </HistoryTable>
                {history.reportPurchase?.outsideWindow ? (
                  <Typography variant="body2" color="text.secondary">
                    {`Poza ostatnimi ${history.days} dniami. Z tej faktury liczony jest aktualny koszt: średnia ważona ilością, netto po rabacie.`}
                  </Typography>
                ) : null}
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

const PurchaseRow = ({
  invoiceId,
  invoiceNumber,
  invoiceDate,
  sellerName,
  quantity,
  receivedQuantity,
  netCents,
  currency,
  status,
  pinned = false,
}: {
  invoiceId: number | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  sellerName: string | null;
  quantity: number | null;
  receivedQuantity: number | null;
  netCents: number | null;
  currency: string;
  status: string;
  pinned?: boolean;
}) => (
  <TableRow sx={pinned ? { bgcolor: 'action.hover' } : undefined}>
    <TableCell>
      {invoiceId != null ? (
        <Link
          component={RouterLink}
          to={Pages.smSystemInvoiceDetails.replace(
            ':invoiceId',
            String(invoiceId),
          )}
        >
          {invoiceNumber || '—'}
        </Link>
      ) : (
        invoiceNumber || '—'
      )}
    </TableCell>
    <TableCell>
      {invoiceDate ? dayjs(invoiceDate).format('DD.MM.YYYY') : '—'}
    </TableCell>
    <TableCell>{sellerName || '—'}</TableCell>
    <TableCell align="right">{formatQuantity(quantity)}</TableCell>
    <TableCell align="right">{formatQuantity(receivedQuantity)}</TableCell>
    <TableCell align="right">
      {netCents != null ? formatPrice(netCents, currency) : '—'}
    </TableCell>
    <TableCell>{invoiceStatusLabel(status)}</TableCell>
  </TableRow>
);

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
