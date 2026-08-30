import {
  Alert,
  Box,
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

  const salesTableMinWidth = showEcommerceFees
    ? 880
    : lens === 'pcmarket'
      ? 800
      : 720;

  return (
    <Modal open={open} onClose={onClose}>
      <Stack
        sx={{
          ...modalStyle({ width: 1040 }),
          top: { xs: 12, sm: '50%' },
          transform: {
            xs: 'translate(-50%, 0)',
            sm: 'translate(-50%, -50%)',
          },
          maxHeight: 'calc(100dvh - 24px)',
          overflow: 'hidden',
        }}
        spacing={2}
      >
        <Stack spacing={1} sx={{ flexShrink: 0 }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: '1.05rem', sm: '1.25rem' },
              lineHeight: 1.35,
              wordBreak: 'break-word',
              pr: { xs: 0, sm: 1 },
            }}
          >
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {
              'Źródła kwot z tego wiersza — faktury zakupu i paragony/zamówienia. Ładowane dopiero po otwarciu.'
            }
          </Typography>
        </Stack>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            pr: 0.5,
          }}
        >
          <Stack spacing={2}>
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
                  <TableContainer
                    sx={{
                      overflowX: 'auto',
                      overflowY: 'visible',
                      maxWidth: '100%',
                    }}
                  >
                    <Table size="small" sx={{ minWidth: 640 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>{'Nr FV'}</TableCell>
                          <TableCell>{'Data FV'}</TableCell>
                          <TableCell>{'Dostawca'}</TableCell>
                          <TableCell>{'Źródło'}</TableCell>
                          <TableCell align="right">
                            {'Cena zak. brutto'}
                          </TableCell>
                          <TableCell align="right">
                            {'Sprzedane szt.'}
                          </TableCell>
                          <TableCell align="right">{'COGS'}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.invoices.map((invoice, index) => (
                          <TableRow
                            key={`${invoice.invoiceId ?? 'x'}-${invoice.source}-${index}`}
                          >
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
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
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {formatDay(invoice.invoiceDate)}
                            </TableCell>
                            <TableCell>{invoice.sellerName ?? '—'}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {marginSourceLabel(invoice.source)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ whiteSpace: 'nowrap' }}
                            >
                              {invoice.unitGrossCents == null
                                ? '—'
                                : formatPrice(invoice.unitGrossCents, currency)}
                            </TableCell>
                            <TableCell align="right">
                              {invoice.soldUnits.toLocaleString('pl-PL')}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ whiteSpace: 'nowrap' }}
                            >
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
                  <TableContainer
                    sx={{
                      overflowX: 'auto',
                      overflowY: 'visible',
                      maxWidth: '100%',
                    }}
                  >
                    <Table size="small" sx={{ minWidth: salesTableMinWidth }}>
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
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {formatDayTime(line.occurredAt)}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
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
                            <TableCell
                              align="right"
                              sx={{ whiteSpace: 'nowrap' }}
                            >
                              {formatPrice(line.revenueCents, currency)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ whiteSpace: 'nowrap' }}
                            >
                              {formatPrice(line.cogsCents, currency)}
                            </TableCell>
                            {showEcommerceFees ? (
                              <TableCell
                                align="right"
                                sx={{ whiteSpace: 'nowrap' }}
                              >
                                {formatPrice(line.commissionCents, currency)}
                              </TableCell>
                            ) : null}
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
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
                            <TableCell
                              align="right"
                              sx={{ whiteSpace: 'nowrap' }}
                            >
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
          </Stack>
        </Box>

        <Button onClick={onClose} sx={{ alignSelf: 'flex-end', flexShrink: 0 }}>
          {'Zamknij'}
        </Button>
      </Stack>
    </Modal>
  );
};
