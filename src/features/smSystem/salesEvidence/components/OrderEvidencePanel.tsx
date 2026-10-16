import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Chip,
  FormControlLabel,
  Link,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import { Pages } from '../../../../utils';
import { useOrderEvidenceStatus, useSaveOrderMarks } from '../api';
import {
  formatDay,
  formatMoment,
  monthName,
  monthRangeOf,
} from '../utils/format';

const evidenceHref = (channel: string, day: string | null | undefined) => {
  const params = new URLSearchParams();
  if (channel) params.set('channel', channel);
  if (day) {
    const [from, to] = monthRangeOf(day);
    params.set('from', from);
    params.set('to', to);
  }
  const query = params.toString();
  return `#${Pages.smSystemSalesEvidence}${query ? `?${query}` : ''}`;
};

const STATUS_LABELS = {
  issued: 'wystawiony',
  handed_over: 'przekazany do księgowości',
  cancelled: 'anulowany',
} as const;

const markedBy = (by: string | null, at: string | null) =>
  by ? `Zaznaczył(a) ${by}, ${formatMoment(at)}.` : '';

const CONSUMER_INVOICE_TEXT = {
  in: 'Kupujący zażądał faktury jako osoba prywatna (bez NIP). Według ustawień w „Firma i rozliczenia” takie zamówienie zostaje w dowodzie z uwagą „faktura bez NIP”.',
  out: 'Kupujący zażądał faktury jako osoba prywatna (bez NIP). Według ustawień w „Firma i rozliczenia” każda faktura, także bez NIP, jest poza dowodem.',
};

const UNKNOWN_BUYER_TEXT = {
  in: 'Kupujący zażądał faktury, ale SM nie wie, czy z NIP. Dopóki tego nie ustalisz, zamówienie blokuje wystawienie dowodu. Pobierz zamówienie ponownie albo wpisz NIP poniżej.',
  out: 'Kupujący zażądał faktury w kanale – zamówienie jest poza dowodem (rozliczasz je fakturą).',
};

const invoiceText = (taxId: string | null, consumerInEvidence: boolean) => {
  const key = consumerInEvidence ? 'in' : 'out';
  if (taxId)
    return `Kupujący zażądał w kanale faktury na firmę (NIP ${taxId}). Zamówienie jest poza dowodem – rozliczasz je fakturą.`;
  return taxId === '' ? CONSUMER_INVOICE_TEXT[key] : UNKNOWN_BUYER_TEXT[key];
};

export const OrderEvidencePanel = ({ orderId }: { orderId: number }) => {
  const { data } = useOrderEvidenceStatus(orderId);
  const { save: saveMarks, isPending } = useSaveOrderMarks(orderId);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
  const [taxId, setTaxId] = useState<string | null>(null);
  const [warning, setWarning] = useState('');

  const save = async (marks: Parameters<typeof saveMarks>[0]) => {
    const result = await saveMarks(marks);
    if (result.ok) setWarning(result.warning);
    return result.ok;
  };

  if (!data?.channelSupported) return null;

  const { marks, evaluation } = data;
  const numberValue = invoiceNumber ?? marks.invoiceNumber;
  const taxIdValue = taxId ?? marks.buyerTaxId ?? '';
  const numberDirty = numberValue !== marks.invoiceNumber;
  const taxIdDirty =
    taxId !== null && taxId.trim() !== (marks.buyerTaxId ?? '');
  const invoiceActive =
    marks.invoiceIssuedManually ||
    (marks.invoiceRequired && !marks.invoiceNotIssued);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {'Dowód sprzedaży bezrachunkowej'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {
              'Czy to zamówienie wchodzi do zbiorczego dowodu dla księgowej, czy jest rozliczane paragonem albo fakturą.'
            }
          </Typography>
        </Box>

        {evaluation ? (
          <Typography variant="body2">
            {evaluation.text}
            {evaluation.day
              ? ` Dzień sprzedaży: ${formatDay(evaluation.day)}.`
              : ''}
            {evaluation.status === 'undated' && data.canViewEvidence ? (
              <>
                {' Pobierz daty z kanału na '}
                <Link href={evidenceHref(data.channel, evaluation.day)}>
                  {'stronie dowodu'}
                </Link>
                {' („Dociągnij dane za okres”).'}
              </>
            ) : null}
          </Typography>
        ) : null}

        {evaluation?.status === 'review' ? (
          <Alert severity="warning">
            <Typography variant="body2" fontWeight={500}>
              {evaluation.day
                ? `Blokuje wystawienie dowodu za ${monthName(evaluation.day)}:`
                : 'Blokuje wystawienie dowodu:'}
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {evaluation.review.map((item) => (
                <li key={item.key}>
                  <Typography variant="body2">{`${item.title} – ${item.detail}`}</Typography>
                </li>
              ))}
            </Box>
          </Alert>
        ) : null}

        {warning ? (
          <Alert severity="warning" onClose={() => setWarning('')}>
            {warning}
          </Alert>
        ) : null}

        {data.documents.length ? (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flexWrap: 'wrap', rowGap: 0.5 }}
          >
            <Typography variant="body2">{'Ujęte w:'}</Typography>
            {data.documents.map((doc) => (
              <Chip
                key={doc.id}
                size="small"
                color="success"
                variant="outlined"
                label={`${doc.number} (${STATUS_LABELS[doc.status]})`}
                component={data.canViewEvidence ? 'a' : 'div'}
                href={
                  data.canViewEvidence
                    ? evidenceHref(data.channel, evaluation?.day)
                    : undefined
                }
                clickable={data.canViewEvidence}
              />
            ))}
          </Stack>
        ) : null}

        <Typography variant="caption" color="text.secondary">
          {[
            `Wpłata: ${data.paidAt ? formatMoment(data.paidAt) : 'brak danych'}`,
            `nadanie: ${data.shippedAt ? formatMoment(data.shippedAt) : 'brak danych'}`,
            `kraj dostawy: ${data.deliveryCountryCode || 'brak danych'}`,
          ].join(' · ')}
        </Typography>

        {marks.invoiceRequired ? (
          <Alert severity={marks.invoiceNotIssued ? 'warning' : 'info'}>
            {marks.invoiceNotIssued
              ? 'Kanał podaje żądanie faktury, ale oznaczono, że faktury nie wystawiono – zamówienie liczy się jak zwykła sprzedaż.'
              : invoiceText(marks.buyerTaxId, data.consumerInvoicesInEvidence)}
          </Alert>
        ) : null}

        <Box>
          <FormControlLabel
            disabled={isPending}
            control={
              <Switch
                checked={marks.fiscalReceiptIssued}
                onChange={(event) =>
                  save({ fiscalReceiptIssued: event.target.checked })
                }
              />
            }
            label="Paragon wystawiony na kasie"
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
            {
              'Włącz, jeśli za to zamówienie nabiłeś paragon na kasie fiskalnej. Nie wejdzie wtedy do dowodu, żeby VAT nie liczył się dwa razy. '
            }
            {markedBy(marks.fiscalReceiptMarkedBy, marks.fiscalReceiptMarkedAt)}
          </Typography>
        </Box>

        <Box>
          <FormControlLabel
            disabled={isPending}
            control={
              <Switch
                checked={marks.invoiceIssuedManually}
                onChange={(event) =>
                  save({ invoiceIssuedManually: event.target.checked })
                }
              />
            }
            label="Faktura wystawiona"
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
            {data.consumerInvoicesInEvidence
              ? 'Włącz, jeśli wystawiłeś fakturę poza kanałem (np. w programie do faktur). Faktura z NIP wyłącza zamówienie z dowodu, faktura bez NIP – nie. Wpisz poniżej NIP nabywcy albo zostaw puste pole dla osoby prywatnej. '
              : 'Włącz, jeśli wystawiłeś fakturę poza kanałem (np. w programie do faktur). Zamówienie nie wejdzie do dowodu. '}
            {markedBy(marks.invoiceMarkedBy, marks.invoiceMarkedAt)}
          </Typography>
        </Box>

        {marks.invoiceRequired ? (
          <Box>
            <FormControlLabel
              disabled={isPending}
              control={
                <Switch
                  checked={marks.invoiceNotIssued}
                  onChange={(event) =>
                    save({ invoiceNotIssued: event.target.checked })
                  }
                />
              }
              label="Faktury nie wystawiono"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
              {
                'Włącz, jeśli kanał podaje żądanie faktury, ale faktury nie wystawiłeś – np. kupujący się wycofał albo pole w sklepie zaznaczyło się przez pomyłkę. Zamówienie wejdzie wtedy do dowodu jak zwykła sprzedaż. '
              }
              {markedBy(
                marks.invoiceNotIssuedMarkedBy,
                marks.invoiceNotIssuedMarkedAt,
              )}
            </Typography>
          </Box>
        ) : null}

        {invoiceActive ? (
          <Stack spacing={1} sx={{ ml: 6 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems="flex-start"
            >
              <TextField
                size="small"
                label="Numer faktury (opcjonalnie)"
                value={numberValue}
                onChange={(event) => setInvoiceNumber(event.target.value)}
                helperText="Pojawi się w wykazie przy zamówieniu."
              />
              <TextField
                size="small"
                label="NIP nabywcy"
                value={taxIdValue}
                onChange={(event) => setTaxId(event.target.value)}
                helperText="Puste pole = osoba prywatna."
              />
              <LoadingButton
                variant="outlined"
                loading={isPending}
                disabled={!numberDirty && !taxIdDirty}
                onClick={async () => {
                  const saved = await save({
                    ...(numberDirty ? { invoiceNumber: numberValue } : {}),
                    ...(taxIdDirty ? { buyerTaxId: taxIdValue } : {}),
                  });
                  if (saved) {
                    setInvoiceNumber(null);
                    setTaxId(null);
                  }
                }}
              >
                {'Zapisz'}
              </LoadingButton>
            </Stack>
            {marks.buyerTaxId === null ? (
              <Alert
                severity="warning"
                action={
                  <LoadingButton
                    size="small"
                    loading={isPending}
                    onClick={() => save({ buyerTaxId: '' })}
                  >
                    {'Osoba prywatna'}
                  </LoadingButton>
                }
              >
                {
                  'SM nie wie, czy faktura jest z NIP. Wpisz NIP i zapisz albo kliknij „Osoba prywatna”, jeśli kupujący nie podał NIP-u.'
                }
              </Alert>
            ) : null}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
};
