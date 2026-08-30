import {
  Alert,
  Button,
  Link,
  Modal,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';

import { modalStyle } from '../../../../components';
import { Pages } from '../../../../utils';
import { formatPrice } from '../../products/utils';
import { useGetChannelMarginProductDetail } from '../api/useGetChannelMarginProductDetail';
import type {
  ChannelMarginLens,
  ChannelMarginRow,
} from '../api/useGetChannelMarginReport';
import { marginSourceLabel } from '../utils/marginSourceLabel';

import { MarginCalculationBreakdown } from './MarginCalculationBreakdown';

interface Props {
  open: boolean;
  onClose: () => void;
  row: ChannelMarginRow | null;
  rowKind: 'product' | 'offer';
  lens: ChannelMarginLens;
  startDate: string;
  endDate: string;
  currency: string;
}

const channelLabel = (channel: string) => {
  if (channel === 'pcmarket') return 'PC-Market';
  if (channel === 'allegro') return 'Allegro';
  if (channel === 'erli') return 'Erli';
  if (channel === 'woocommerce') return 'WooCommerce';
  return channel;
};

const formatDay = (value: string | null | undefined) =>
  value ? dayjs(value).format('DD.MM.YYYY') : '—';

const formatDayTime = (value: string | null | undefined) =>
  value ? dayjs(value).format('DD.MM.YYYY HH:mm') : '—';

const invoiceHref = (invoiceId: number) =>
  `#${Pages.smSystemInvoiceDetails.replace(':invoiceId', String(invoiceId))}`;

const orderHref = (orderId: number) =>
  `#${Pages.smSystemEcommerceOrderDetails.replace(':orderId', String(orderId))}`;

export const ProductMarginSourceModal = ({
  open,
  onClose,
  row,
  rowKind,
  lens,
  startDate,
  endDate,
  currency,
}: Props) => {
  const { data, isLoading, isError } = useGetChannelMarginProductDetail({
    enabled: open && row != null,
    lens,
    startDate,
    endDate,
    channel: row?.channel ?? '',
    rowKind,
    productId: row?.productId ?? null,
    offerId: row?.offerId ?? null,
    productName: row?.productName ?? '',
  });

  const showEcommerceFees = lens === 'ecommerce';
  const title = row
    ? rowKind === 'offer' && row.offerId
      ? `${row.productName} · oferta ${row.offerId} · ${channelLabel(row.channel)}`
      : `${row.productName} · ${channelLabel(row.channel)}`
    : '';

  return (
    <Modal open={open} onClose={onClose}>
      <Stack
        sx={{
          ...modalStyle({ width: 1040 }),
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        spacing={2}
      >
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {
            'Źródła kwot z tego wiersza — faktury zakupu i paragony/zamówienia. Ładowane dopiero po otwarciu.'
          }
        </Typography>

        {row ? (
          <MarginCalculationBreakdown
            calculation={row.calculation}
            currency={currency}
            dense
          />
        ) : null}

        {isError ? (
          <Alert severity="error">
            {'Nie udało się pobrać szczegółów źródeł.'}
          </Alert>
        ) : null}

        {isLoading ? (
          <Skeleton variant="rounded" height={220} />
        ) : data ? (
          <>
            {data.truncated ? (
              <Alert severity="info">
                {`Pokazano ${data.lines.length} z ${data.linesTotal} pozycji (najnowsze). Faktury poniżej dotyczą tylko tych pozycji.`}
              </Alert>
            ) : null}

            <Typography variant="subtitle2">
              {'Faktury użyte do kosztu zakupu'}
            </Typography>
            {data.invoices.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {
                  'Brak faktury w historii — COGS z last purchase albo brak ceny zakupu.'
                }
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{'Nr FV'}</TableCell>
                      <TableCell>{'Data FV'}</TableCell>
                      <TableCell>{'Dostawca'}</TableCell>
                      <TableCell>{'Źródło'}</TableCell>
                      <TableCell align="right">{'Cena zak. brutto'}</TableCell>
                      <TableCell align="right">{'Sprzedane szt.'}</TableCell>
                      <TableCell align="right">{'COGS'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.invoices.map((invoice, index) => (
                      <TableRow
                        key={`${invoice.invoiceId ?? 'x'}-${invoice.source}-${index}`}
                      >
                        <TableCell>
                          {invoice.invoiceId && invoice.invoiceNumber ? (
                            <Link
                              href={invoiceHref(invoice.invoiceId)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {invoice.invoiceNumber}
                            </Link>
                          ) : (
                            (invoice.invoiceNumber ?? 'ostatnia FV KSeF')
                          )}
                        </TableCell>
                        <TableCell>{formatDay(invoice.invoiceDate)}</TableCell>
                        <TableCell>{invoice.sellerName ?? '—'}</TableCell>
                        <TableCell>
                          {marginSourceLabel(invoice.source)}
                        </TableCell>
                        <TableCell align="right">
                          {invoice.unitGrossCents == null
                            ? '—'
                            : formatPrice(invoice.unitGrossCents, currency)}
                        </TableCell>
                        <TableCell align="right">
                          {invoice.soldUnits.toLocaleString('pl-PL')}
                        </TableCell>
                        <TableCell align="right">
                          {formatPrice(invoice.cogsCents, currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Typography variant="subtitle2">
              {lens === 'pcmarket'
                ? 'Paragony / faktury sprzedaży'
                : 'Zamówienia'}
            </Typography>
            {data.lines.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {'Brak pozycji w wybranym okresie.'}
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{'Data'}</TableCell>
                      <TableCell>{'Dokument'}</TableCell>
                      {lens === 'pcmarket' ? (
                        <TableCell>{'Oddział'}</TableCell>
                      ) : null}
                      <TableCell align="right">{'Ilość'}</TableCell>
                      <TableCell align="right">{'Przychód'}</TableCell>
                      <TableCell align="right">{'COGS'}</TableCell>
                      {showEcommerceFees ? (
                        <TableCell align="right">{'Prowizja'}</TableCell>
                      ) : null}
                      <TableCell>{'FV zakupu'}</TableCell>
                      <TableCell align="right">{'Marża'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.lines.map((line, index) => (
                      <TableRow
                        key={`${line.occurredAt}-${line.documentLabel}-${index}`}
                        sx={
                          line.exclusionReason
                            ? { opacity: 0.7, bgcolor: 'action.hover' }
                            : undefined
                        }
                      >
                        <TableCell>{formatDayTime(line.occurredAt)}</TableCell>
                        <TableCell>
                          {line.orderId ? (
                            <Link
                              href={orderHref(line.orderId)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {line.documentLabel}
                            </Link>
                          ) : (
                            line.documentLabel
                          )}
                          {line.exclusionReason === 'fx_missing' ? (
                            <Typography
                              variant="caption"
                              color="error"
                              display="block"
                            >
                              {'Pominięte w raporcie — brak kursu NBP'}
                            </Typography>
                          ) : null}
                        </TableCell>
                        {lens === 'pcmarket' ? (
                          <TableCell>{line.branchName ?? '—'}</TableCell>
                        ) : null}
                        <TableCell align="right">
                          {line.quantity.toLocaleString('pl-PL')}
                        </TableCell>
                        <TableCell align="right">
                          {formatPrice(line.revenueCents, currency)}
                        </TableCell>
                        <TableCell align="right">
                          {formatPrice(line.cogsCents, currency)}
                        </TableCell>
                        {showEcommerceFees ? (
                          <TableCell align="right">
                            {formatPrice(line.commissionCents, currency)}
                          </TableCell>
                        ) : null}
                        <TableCell>
                          {line.invoiceId && line.invoiceNumber ? (
                            <Link
                              href={invoiceHref(line.invoiceId)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {`${line.invoiceNumber} (${formatDay(line.invoiceDate)})`}
                            </Link>
                          ) : line.invoiceNumber ? (
                            `${line.invoiceNumber} (${formatDay(line.invoiceDate)})`
                          ) : line.cogsSource === 'ksef_last_purchase' ? (
                            `ostatnia FV KSeF (${formatDay(line.invoiceDate)})`
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {formatPrice(line.marginCents, currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        ) : null}

        <Button onClick={onClose} sx={{ alignSelf: 'flex-end' }}>
          {'Zamknij'}
        </Button>
      </Stack>
    </Modal>
  );
};
