import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { ReactNode, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Pages } from '../../../../utils';
import {
  useSalesEvidenceActions,
  useSalesEvidenceDocuments,
  useSalesEvidenceDownload,
  useSalesEvidencePreview,
  useSalesEvidenceSync,
} from '../api';
import { DocumentHistory } from '../components/DocumentHistory';
import { HowItWorks } from '../components/HowItWorks';
import { MonthCoverage } from '../components/MonthCoverage';
import { RateTable } from '../components/RateTable';
import { ReviewSection } from '../components/ReviewSection';
import { SideEntries } from '../components/SideEntries';
import type {
  EvidenceBlocker,
  SalesEvidenceChannel,
  SalesEvidencePreview,
} from '../types';
import {
  countLabel,
  formatDay,
  formatMoment,
  formatPeriod,
  formatPln,
  monthName,
  monthRangeOf,
  parseEvidenceSearch,
  previousMonthRange,
  sameMonth,
  warsawToday,
} from '../utils/format';

const CHANNELS: { value: SalesEvidenceChannel; label: string }[] = [
  { value: 'allegro', label: 'Allegro' },
  { value: 'erli', label: 'Erli' },
  { value: 'woocommerce', label: 'WooCommerce' },
];

const SETUP_BLOCKERS = new Set([
  'company_incomplete',
  'exemption_not_confirmed',
]);

const Section = ({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <Paper variant="outlined" sx={{ p: 2 }}>
    <Stack spacing={1.5}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        justifyContent="space-between"
        alignItems={{ sm: 'flex-start' }}
      >
        <Box>
          <Typography variant="h6">{title}</Typography>
          {description ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          ) : null}
        </Box>
        {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
      </Stack>
      {children}
    </Stack>
  </Paper>
);

const WstoInfo = ({ preview }: { preview: SalesEvidencePreview }) => {
  const wsto = preview.wsto;
  if (!wsto || (!wsto.netPln && !preview.hasWstoRows && !preview.hasOssRows))
    return null;
  const eurText =
    wsto.netEur === null
      ? 'nie udało się przeliczyć na EUR (brak kursu NBP)'
      : `ok. ${formatPln(wsto.netEur, ' EUR')}`;
  return (
    <Alert severity={wsto.warning ? 'warning' : 'info'}>
      {`Sprzedaż do konsumentów w innych krajach UE od początku roku (wszystkie kanały): ${formatPln(wsto.netPln)} netto, ${eurText} z progu ${formatPln(wsto.thresholdEur, ' EUR')}.`}
      {wsto.warning
        ? ' Zbliżasz się do progu – po jego przekroczeniu taką sprzedaż rozlicza się VAT-em kraju kupującego (zwykle przez OSS). Porozmawiaj z księgową.'
        : ''}
      {wsto.ordersMissingRate
        ? ` ${countLabel(wsto.ordersMissingRate, 'zamówienie', 'zamówienia', 'zamówień')} bez kursu NBP nie jest wliczone.`
        : ''}
    </Alert>
  );
};

const BlockerList = ({ blockers }: { blockers: EvidenceBlocker[] }) => (
  <Stack spacing={1}>
    {blockers.map((blocker) => (
      <Alert
        key={`${blocker.code}-${blocker.documentId ?? ''}`}
        severity={blocker.code === 'period_not_ended' ? 'info' : 'warning'}
        action={
          SETUP_BLOCKERS.has(blocker.code) ? (
            <Button
              color="inherit"
              size="small"
              sx={{ whiteSpace: 'nowrap' }}
              href={`#${Pages.smSystemCompanySettings}`}
            >
              {'Uzupełnij'}
            </Button>
          ) : null
        }
      >
        {blocker.message}
      </Alert>
    ))}
  </Stack>
);

const commitDay = (value: dayjs.Dayjs | null): string | null => {
  if (!value?.isValid()) return null;
  const year = value.year();
  if (year < 2000 || year > 2100) return null;
  const iso = value.format('YYYY-MM-DD');
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
};

export const SalesEvidencePage = () => {
  const today = warsawToday();
  const [defaultFrom, defaultTo] = previousMonthRange(today);
  const [searchParams] = useSearchParams();
  const fromQuery = parseEvidenceSearch(searchParams);
  const [channel, setChannel] = useState<SalesEvidenceChannel>(
    fromQuery.channel ?? 'allegro',
  );
  const [periodFrom, setPeriodFrom] = useState(fromQuery.from ?? defaultFrom);
  const [periodTo, setPeriodTo] = useState(fromQuery.to ?? defaultTo);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [issueBlockers, setIssueBlockers] = useState<EvidenceBlocker[]>([]);

  const periodError =
    periodFrom > periodTo
      ? 'Data „od” jest późniejsza niż „do”.'
      : !sameMonth(periodFrom, periodTo)
        ? 'Okres musi mieścić się w jednym miesiącu – dowód ma numer z miesiącem, np. DW/ALL/2026/09/1.'
        : null;

  const preview = useSalesEvidencePreview(
    channel,
    periodFrom,
    periodTo,
    !periodError,
  );
  const documents = useSalesEvidenceDocuments(channel);
  const actions = useSalesEvidenceActions(channel);
  const syncState = useSalesEvidenceSync(channel);
  const downloads = useSalesEvidenceDownload();
  const data = preview.data;
  const canManage = data?.canManage ?? documents.data?.canManage ?? false;
  const [year, month] = periodFrom.split('-').map(Number);
  const channelLabel =
    CHANNELS.find((item) => item.value === channel)?.label ?? channel;

  const selectPeriod = (from: string, to: string) => {
    setPeriodFrom(from);
    setPeriodTo(to);
  };

  const sync = () => syncState.start(periodFrom, periodTo);

  const issue = async () => {
    const result = await actions.issue(periodFrom, periodTo);
    if (result.ok) {
      setIssueBlockers([]);
      setConfirmOpen(false);
      return;
    }
    setIssueBlockers(result.blockers ?? []);
    if (result.blockers?.length) setConfirmOpen(false);
  };

  const setupBlockers =
    data?.blockers.filter((blocker) => SETUP_BLOCKERS.has(blocker.code)) ?? [];
  const otherBlockers =
    data?.blockers.filter(
      (blocker) =>
        !SETUP_BLOCKERS.has(blocker.code) &&
        blocker.code !== 'review_not_empty',
    ) ?? [];
  const monthMissing = (data?.monthDaysWithoutDocument ?? []).filter(
    (entry) => entry.channel === channel,
  );

  return (
    <Stack spacing={2} sx={{ maxWidth: 1100 }}>
      <Box>
        <Typography variant="h5">{'Dowód sprzedaży bezrachunkowej'}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {
            'Zbiorczy dokument wewnętrzny ze sprzedaży wysyłkowej bez paragonu – zamiast nabijania każdej paczki na kasę. Wybierasz kanał i okres, SM sumuje wpłaty kupujących według stawek VAT, a Ty wystawiasz PDF z wykazem transakcji (XLSX) dla księgowej.'
          }
        </Typography>
      </Box>
      <HowItWorks />

      {setupBlockers.length ? <BlockerList blockers={setupBlockers} /> : null}

      <Section
        title="Kanał i okres"
        description="Okres mieści się w jednym miesiącu. Zwykle wystawia się jeden dowód za cały miesiąc, ale możesz krócej (np. 1–15), jeśli księgowa chce częściej. Dni już objęte dowodem nie mogą wejść do drugiego."
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ md: 'center' }}
        >
          <ToggleButtonGroup
            exclusive
            size="small"
            value={channel}
            onChange={(_event, value: SalesEvidenceChannel | null) =>
              value && setChannel(value)
            }
          >
            {CHANNELS.map((item) => (
              <ToggleButton key={item.value} value={item.value}>
                {item.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <DatePicker
            label="Od"
            value={dayjs(periodFrom)}
            onChange={(value) => {
              const iso = commitDay(value);
              if (iso) setPeriodFrom(iso);
            }}
            onAccept={(value) => {
              const iso = commitDay(value);
              if (iso) setPeriodFrom(iso);
            }}
            slotProps={{ textField: { size: 'small', sx: { width: 170 } } }}
          />
          <DatePicker
            label="Do"
            value={dayjs(periodTo)}
            onChange={(value) => {
              const iso = commitDay(value);
              if (iso) setPeriodTo(iso);
            }}
            onAccept={(value) => {
              const iso = commitDay(value);
              if (iso) setPeriodTo(iso);
            }}
            slotProps={{ textField: { size: 'small', sx: { width: 170 } } }}
          />
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              onClick={() => selectPeriod(defaultFrom, defaultTo)}
            >
              {'Poprzedni miesiąc'}
            </Button>
            <Button
              size="small"
              onClick={() => selectPeriod(...monthRangeOf(today))}
            >
              {'Bieżący miesiąc'}
            </Button>
          </Stack>
        </Stack>
        {periodError ? <Alert severity="error">{periodError}</Alert> : null}
      </Section>

      {periodError ? null : (
        <>
          <Section
            title={`Pokrycie miesiąca: ${monthName(periodFrom)} – ${channelLabel}`}
            description="Każdy dzień ze sprzedażą bez paragonu powinien być w którymś dowodzie. Najedź na dzień, żeby zobaczyć szczegóły."
          >
            <MonthCoverage
              year={year}
              month={month}
              documents={data?.monthDocuments ?? []}
              daysWithoutDocument={monthMissing}
              periodFrom={periodFrom}
              periodTo={periodTo}
            />
            {monthMissing.length ? (
              <Typography variant="body2" color="warning.dark">
                {`${countLabel(monthMissing.length, 'dzień', 'dni', 'dni')} tego miesiąca ma opłacone zamówienia bez dowodu. Obejmij je dowodem, żeby żadna sprzedaż nie została pominięta.`}
              </Typography>
            ) : null}
          </Section>

          <Section
            title="Dane z kanału"
            description="SM liczy dowód z danych zapisanych w systemie. Przed wystawieniem pobierz je świeżo: zamówienia (także złożone do 45 dni przed okresem – mogły zostać opłacone lub wysłane w okresie), wpłaty, daty nadania, zwroty i informacje o fakturach. Data pobrania będzie na dowodzie."
            action={
              canManage ? (
                <LoadingButton
                  variant="contained"
                  loading={syncState.active}
                  onClick={sync}
                >
                  {'Dociągnij dane za okres'}
                </LoadingButton>
              ) : null
            }
          >
            <Typography variant="body2">
              {data?.dataAsOf
                ? `Ostatnie pobranie danych z ${channelLabel}: ${formatMoment(data.dataAsOf)}.`
                : `Nie pobierano jeszcze danych z ${channelLabel} dla dowodu.`}
            </Typography>
            {syncState.active ? (
              <Alert severity="info">
                {`Pobieramy dane z ${channelLabel} za ${formatPeriod(syncState.run?.periodFrom ?? periodFrom, syncState.run?.periodTo ?? periodTo)}. Możesz zamknąć stronę — po powrocie zobaczysz wynik.`}
              </Alert>
            ) : null}
            {syncState.run?.status === 'failed' && syncState.run.error ? (
              <Alert severity="error">
                {`Nie udało się pobrać danych z ${channelLabel}: ${syncState.run.error} Sprawdź połączenie z kanałem w ustawieniach integracji i spróbuj ponownie.`}
              </Alert>
            ) : null}
            {data?.uncoveredDays.length ? (
              <Alert severity="warning">
                {`Dla ${countLabel(data.uncoveredDays.length, 'dnia', 'dni', 'dni')} okresu nie mamy pełnego pobrania z kanału (${data.uncoveredDays
                  .slice(0, 5)
                  .map(formatDay)
                  .join(
                    ', ',
                  )}${data.uncoveredDays.length > 5 ? '…' : ''}). Kliknij „Dociągnij dane za okres”, żeby nie pominąć wpłat ani zwrotów.`}
              </Alert>
            ) : null}
          </Section>

          {preview.isLoading ? (
            <Paper variant="outlined" sx={{ p: 4 }}>
              <Stack alignItems="center" spacing={1}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary">
                  {
                    'Liczę dowód… Przy dużej liczbie zamówień może to potrwać do minuty.'
                  }
                </Typography>
              </Stack>
            </Paper>
          ) : null}
          {preview.isError ? (
            <Alert severity="error">
              {
                'Nie udało się policzyć podglądu. Odśwież stronę; jeśli błąd wraca, zgłoś go z nazwą kanału i okresem.'
              }
            </Alert>
          ) : null}

          {data ? (
            <>
              <Section
                title="Do wyjaśnienia"
                description="Zamówienia, przy których SM nie jest pewny kwoty, stawki VAT albo daty. Każde ma przycisk, który je naprawia."
              >
                <ReviewSection
                  items={data.review}
                  canManage={canManage}
                  run={actions.action}
                  pending={actions.pending}
                  onSync={sync}
                  syncing={syncState.active}
                  onSelectPeriod={selectPeriod}
                />
              </Section>

              <Section
                title={`Podgląd: ${data.channelLabel}, ${formatPeriod(data.periodFrom, data.periodTo)}`}
                description={`Tak będzie wyglądać tabela stawek na dowodzie, gdybyś wystawił go teraz${preview.isFetching ? ' (odświeżam…)' : ''}. Kwoty zmieniają się na żywo, dopóki dowodu nie wystawisz.`}
                action={
                  <Button
                    size="small"
                    onClick={() => preview.refetch()}
                    disabled={preview.isFetching}
                  >
                    {'Przelicz podgląd'}
                  </Button>
                }
              >
                <RateTable
                  buckets={data.totalsByRate}
                  emptyText="W tym okresie nie ma wpłat ani zwrotów do ujęcia w dowodzie."
                />
                <Typography variant="body2" color="text.secondary">
                  {`Wpłaty: ${data.totals.paymentsCount}, zwroty: ${data.totals.refundsCount}, wyłączenia po fakturze: ${data.totals.exclusionsCount}.`}
                  {data.totals.negativeGross
                    ? ` Kwoty ujemne (zwroty i wyłączenia) w sumie: brutto ${formatPln(data.totals.negativeGross)}, VAT ${formatPln(data.totals.negativeVat)} – są już odjęte w tabeli.`
                    : ''}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {`Ustawienia: pobrania – ${data.settings.labels.codTreatment}; dostawa – ${data.settings.labels.shippingVat}; sprzedaż do UE – ${data.settings.labels.wstoMode}; faktury bez NIP – ${data.settings.labels.consumerInvoiceTreatment}. `}
                  <Box
                    component="a"
                    href={`#${Pages.smSystemCompanySettings}`}
                    sx={{ color: 'primary.main' }}
                  >
                    {'Zmień w „Firma i rozliczenia”'}
                  </Box>
                </Typography>
                <WstoInfo preview={data} />
              </Section>

              <SideEntries
                title="Na kasie"
                description="Zamówienia, za które nabijasz paragon na kasie fiskalnej: pobrania (gdy w ustawieniach są „na kasie”) i zamówienia oznaczone „paragon wystawiony na kasie”. Nie liczą się do dowodu – sprawdź tylko, czy masz na nie paragony."
                entries={data.onRegister}
              />
              <SideEntries
                title="Poza dowodem"
                description={`${data.settings.consumerInvoiceTreatment === 'include' ? 'Zamówienia z fakturą na firmę (z NIP) – faktury bez NIP są w dowodzie' : 'Zamówienia z fakturą (z NIP i bez)'}, eksport poza UE, sprzedaż w OSS i zamówienia już ujęte w innym dowodzie. Księgowa rozlicza je na podstawie innych dokumentów – tu są do wglądu. Zwroty do sprzedaży sprzed pierwszego dowodu są w sekcji „Na kasie”.`}
                entries={data.outside}
              />

              <Section
                title="Wystawienie"
                description="Wystawiony dowód dostaje kolejny numer w miesiącu dla kanału i zostaje zamrożony – PDF i XLSX zawsze pokazują stan z chwili wystawienia."
              >
                {otherBlockers.length ? (
                  <BlockerList blockers={otherBlockers} />
                ) : null}
                {issueBlockers.length ? (
                  <BlockerList blockers={issueBlockers} />
                ) : null}
                {syncState.active ? (
                  <Alert severity="info">
                    {
                      'Poczekaj, aż skończy się pobieranie danych z kanału. Dopiero wtedy wystaw dowód, żeby nie pominąć zamówień, które właśnie dochodzą.'
                    }
                  </Alert>
                ) : null}
                {data.review.length ? (
                  <Alert severity="warning">
                    {`Najpierw wyjaśnij ${countLabel(data.review.length, 'pozycję', 'pozycje', 'pozycji')} z sekcji „Do wyjaśnienia”.`}
                  </Alert>
                ) : null}
                {canManage ? null : (
                  <Typography variant="body2" color="text.secondary">
                    {
                      'Wystawiać dowody może osoba z uprawnieniem „Dowody sprzedaży” – nadaje je administrator konta.'
                    }
                  </Typography>
                )}
                <Box>
                  <Button
                    variant="contained"
                    size="large"
                    disabled={!data.canIssue || !canManage || syncState.active}
                    onClick={() => setConfirmOpen(true)}
                  >
                    {data.review.length
                      ? `Wystaw dowód (do wyjaśnienia: ${data.review.length})`
                      : 'Wystaw dowód'}
                  </Button>
                </Box>
              </Section>
            </>
          ) : null}
        </>
      )}

      <Section
        title={`Wystawione dowody – ${channelLabel}`}
        description="PDF to sam dowód do podpisu, XLSX to załącznik z wykazem wszystkich transakcji (z sumą kontrolną na PDF). Wyślij oba pliki księgowej."
        action={
          <LoadingButton
            variant="outlined"
            size="small"
            loading={downloads.pending === `monthly-${year}-${month}`}
            onClick={() => downloads.downloadMonthlySummary(year, month)}
          >
            {`Zestawienie zbiorcze: ${monthName(periodFrom)}`}
          </LoadingButton>
        }
      >
        <Typography variant="caption" color="text.secondary">
          {
            'Zestawienie zbiorcze to jeden plik XLSX ze wszystkimi dowodami miesiąca ze wszystkich kanałów – z kolumnami do JPK (K_13–K_20) i listą dni bez dowodu. Wysyłasz je księgowej raz w miesiącu.'
          }
        </Typography>
        {documents.isLoading ? (
          <CircularProgress size={24} />
        ) : (
          <DocumentHistory
            documents={documents.data?.results ?? []}
            canManage={canManage}
            channel={channel}
            autoRecheckMonth={periodFrom.slice(0, 7)}
          />
        )}
      </Section>

      {confirmOpen && data ? (
        <Dialog
          open
          onClose={() => setConfirmOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{`Wystawić dowód: ${data.channelLabel}, ${formatPeriod(data.periodFrom, data.periodTo)}?`}</DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <RateTable buckets={data.totalsByRate} showRows={false} />
              <Typography variant="body2">
                {data.dataAsOf
                  ? `Dane z kanału pobrane: ${formatMoment(data.dataAsOf)}. Jeśli od tego czasu coś się zmieniło w kanale, najpierw kliknij „Dociągnij dane za okres”.`
                  : 'Danych z kanału nie pobierano – rozważ najpierw „Dociągnij dane za okres”.'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {
                  'Po wystawieniu dowód zostaje zamrożony. Dopóki nie oznaczysz go jako przekazany do księgowości, możesz go anulować i wystawić ponownie.'
                }
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)}>{'Wróć'}</Button>
            <LoadingButton
              variant="contained"
              loading={actions.pending.has('issue')}
              onClick={issue}
            >
              {'Wystaw dowód'}
            </LoadingButton>
          </DialogActions>
        </Dialog>
      ) : null}
    </Stack>
  );
};
