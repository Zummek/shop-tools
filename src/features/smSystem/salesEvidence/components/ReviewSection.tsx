import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { LoadingButton } from '@mui/lab';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Divider,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import { Pages } from '../../../../utils';
import type { ReviewItem, ReviewKind } from '../types';
import { countLabel, monthRangeOf } from '../utils/format';

import {
  AmountMismatchDialog,
  BundleSharesDialog,
  ManualRefundDialog,
} from './ReviewDialogs';

interface KindMeta {
  title: string;
  hint: string;
  syncFixes?: boolean;
}

const KIND_META: Record<ReviewKind, KindMeta> = {
  missing_date: {
    title: 'Brak daty wpłaty lub nadania',
    hint: 'Data decyduje, do którego dnia i okresu należy sprzedaż. Zwykle wystarczy raz kliknąć „Dociągnij dane za okres” – SM pobierze daty z kanału dla wszystkich zamówień naraz.',
    syncFixes: true,
  },
  missing_country: {
    title: 'Brak kraju dostawy',
    hint: 'Kraj decyduje, czy to sprzedaż krajowa, do UE czy eksport. Dociągnij dane z kanału.',
    syncFixes: true,
  },
  no_product: {
    title: 'Pozycja bez przypisanego produktu',
    hint: 'Bez produktu z katalogu nie znamy stawki VAT. Przypisz produkt w szczegółach zamówienia.',
  },
  missing_vat: {
    title: 'Produkt bez stawki VAT',
    hint: 'Uzupełnij stawkę na karcie produktu (0% to też stawka). Poprawka obejmie wszystkie zamówienia z tym produktem.',
  },
  similarity: {
    title: 'Produkt dopasowany po podobieństwie nazwy',
    hint: 'SM zgadł produkt po nazwie oferty, więc stawka pochodzi ze zgadniętego produktu. Jeśli produkt się zgadza – potwierdź. Jeśli nie – zmień go w zamówieniu.',
  },
  bundle_split: {
    title: 'Zestaw z towarami w różnych stawkach VAT',
    hint: 'Podaj raz dla oferty, jaką część ceny stanowi każdy towar. Podział obejmie wszystkie zamówienia tej oferty.',
  },
  amount_mismatch: {
    title: 'Kwota wpłaty różni się od sumy pozycji',
    hint: 'Zwykle przez kupon albo dopłatę platformy. Wskaż, od której kwoty liczyć VAT.',
  },
  missing_fx: {
    title: 'Brak kursu NBP',
    hint: 'Kwoty w obcej walucie przeliczamy kursem średnim NBP z ostatniego dnia roboczego przed dniem sprzedaży. Spróbuj pobrać kurs ponownie.',
  },
  wsto_unset: {
    title: 'Sprzedaż do innego kraju UE bez wybranego rozliczenia',
    hint: 'Wybierz w „Firma i rozliczenia”, czy taką sprzedaż rozliczasz polskim VAT, czy w OSS. Ustawienie obejmie wszystkie takie zamówienia.',
  },
  export: {
    title: 'Wysyłka poza Unię Europejską',
    hint: 'Eksport nie wchodzi do dowodu – księgowa rozlicza go osobno. Oznacz zamówienie jako eksport.',
  },
  refund_without_order: {
    title: 'Zwrot bez zamówienia w systemie',
    hint: 'Kanał zgłosił zwrot do zamówienia, którego nie mamy. Dociągnij dane za okres albo pomiń zwrot, jeśli nie dotyczy sprzedaży w dowodach.',
    syncFixes: true,
  },
  refund_original_not_issued: {
    title: 'Zwrot do sprzedaży z okresu bez dowodu',
    hint: 'Zwrot pomniejsza sprzedaż, która musi już być w dowodzie. Najpierw wystaw dowód za okres wpłaty, potem wróć do tego okresu.',
  },
  refund_currency: {
    title: 'Zwrot w innej walucie niż wpłata',
    hint: 'Sprawdź zwrot w kanale. Jeśli to pomyłka kanału, możesz go pominąć.',
  },
  refund_exceeds: {
    title: 'Zwrot większy niż wpłata',
    hint: 'Dowód nie odejmie więcej, niż kupujący zapłacił – inaczej VAT wyszedłby za niski. Sprawdź kwotę w kanale. Jeśli to pomyłka, pomiń zwrot.',
  },
  returned_without_refund: {
    title: 'Zamówienie zwrócone, ale bez zwrotu pieniędzy',
    hint: 'Wpisz zwrot ręcznie albo potwierdź, że pieniądze nie wróciły do kupującego.',
  },
  invoice_buyer_unknown: {
    title: 'Faktura – nie wiadomo, czy z NIP',
    hint: 'Faktury bez NIP wchodzą u Ciebie do dowodu, faktury z NIP – nie. SM nie wie, którą jest ta faktura (np. zamówienie pobrane przed tą funkcją). Kliknij „Dociągnij dane za okres” albo w szczegółach zamówienia wpisz NIP lub zostaw puste pole dla osoby prywatnej.',
    syncFixes: true,
  },
};

const KIND_ORDER = Object.keys(KIND_META) as ReviewKind[];
const VISIBLE_PER_GROUP = 30;
const COLLAPSE_ABOVE = 10;

type Run = (name: string, body: object) => Promise<{ ok: boolean }>;

interface Props {
  items: ReviewItem[];
  canManage: boolean;
  run: Run;
  pending: ReadonlySet<string>;
  onSync: () => void;
  syncing: boolean;
  onSelectPeriod: (from: string, to: string) => void;
}

const orderHref = (orderId: number) =>
  `#${Pages.smSystemEcommerceOrderDetails.replace(':orderId', String(orderId))}`;

const dedupe = (kind: ReviewKind, items: ReviewItem[]) => {
  if (kind !== 'bundle_split' && kind !== 'missing_fx') return items;
  const seen = new Map<string, ReviewItem & { count: number }>();
  items.forEach((item) => {
    const key =
      kind === 'bundle_split'
        ? String(item.offerId)
        : `${item.currency}-${item.day}`;
    const existing = seen.get(key);
    if (existing) existing.count += 1;
    else seen.set(key, { ...item, count: 1 });
  });
  return [...seen.values()];
};

export const ReviewSection = ({
  items,
  canManage,
  run,
  pending,
  onSync,
  syncing,
  onSelectPeriod,
}: Props) => {
  const [dialog, setDialog] = useState<{
    type: 'bundle' | 'amount' | 'refund';
    item: ReviewItem;
  } | null>(null);
  const [visibleCount, setVisibleCount] = useState<Record<string, number>>({});

  if (items.length === 0) {
    return (
      <Alert severity="success">
        {
          'Nic do wyjaśnienia – wszystkie zamówienia z okresu mają stawkę VAT, datę i kwotę.'
        }
      </Alert>
    );
  }

  const groups = KIND_ORDER.map((kind) => ({
    kind,
    items: items.filter((item) => item.kind === kind),
  })).filter((group) => group.items.length > 0);

  const busy = (name: string, body: object) =>
    pending.has(`action-${name}-${JSON.stringify(body)}`);

  const actionButton = (name: string, body: object, label: string) => (
    <LoadingButton
      size="small"
      variant="outlined"
      disabled={!canManage}
      loading={busy(name, body)}
      onClick={() => run(name, body)}
    >
      {label}
    </LoadingButton>
  );

  const actions = (item: ReviewItem) => {
    const orderId = item.orderId ?? 0;
    switch (item.kind) {
      case 'similarity':
        return (
          <>
            {actionButton(
              'confirm-match',
              { itemId: item.itemId },
              'Potwierdź dopasowanie',
            )}
            <Button size="small" href={orderHref(orderId)} target="_blank">
              {'Zmień produkt'}
            </Button>
          </>
        );
      case 'no_product':
        return (
          <Button
            size="small"
            variant="outlined"
            href={orderHref(orderId)}
            target="_blank"
          >
            {'Przypisz produkt'}
          </Button>
        );
      case 'missing_vat':
        return (
          <Button
            size="small"
            variant="outlined"
            target="_blank"
            href={`#${Pages.smSystemProductDetails.replace(':productId', String(item.productId))}`}
          >
            {'Uzupełnij stawkę na karcie produktu'}
          </Button>
        );
      case 'bundle_split':
        return (
          <Button
            size="small"
            variant="outlined"
            disabled={!canManage}
            onClick={() => setDialog({ type: 'bundle', item })}
          >
            {'Ustaw podział'}
          </Button>
        );
      case 'amount_mismatch':
        return (
          <Button
            size="small"
            variant="outlined"
            disabled={!canManage}
            onClick={() => setDialog({ type: 'amount', item })}
          >
            {'Wybierz kwotę'}
          </Button>
        );
      case 'missing_date':
      case 'missing_country':
        return actionButton(
          'refetch-order',
          { orderId },
          'Pobierz to zamówienie ponownie',
        );
      case 'invoice_buyer_unknown':
        return (
          <>
            {actionButton('refetch-order', { orderId }, 'Pobierz ponownie')}
            <Button size="small" href={orderHref(orderId)} target="_blank">
              {'Wpisz NIP'}
            </Button>
          </>
        );
      case 'missing_fx':
        return actionButton(
          'refetch-rate',
          { currency: item.currency, day: item.day },
          'Pobierz kurs ponownie',
        );
      case 'wsto_unset':
        return (
          <Button
            size="small"
            variant="outlined"
            href={`#${Pages.smSystemCompanySettings}`}
          >
            {'Wybierz rozliczenie'}
          </Button>
        );
      case 'export':
        return actionButton(
          'export-outside',
          { orderId },
          'Oznacz: poza dowodem – eksport',
        );
      case 'refund_without_order':
      case 'refund_currency':
      case 'refund_exceeds':
        return actionButton(
          'ignore-refund',
          { refundId: item.refundId },
          'Pomiń ten zwrot',
        );
      case 'refund_original_not_issued':
        return item.day ? (
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              const [from, to] = monthRangeOf(item.day as string);
              onSelectPeriod(from, to);
            }}
          >
            {'Przejdź do miesiąca wpłaty'}
          </Button>
        ) : null;
      case 'returned_without_refund':
        return (
          <>
            <Button
              size="small"
              variant="outlined"
              disabled={!canManage}
              onClick={() => setDialog({ type: 'refund', item })}
            >
              {'Wpisz zwrot'}
            </Button>
            {actionButton('no-refund', { orderId }, 'Pieniądze nie wróciły')}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Stack spacing={1}>
      <Alert severity="warning">
        {`Do wyjaśnienia: ${countLabel(items.length, 'pozycja', 'pozycje', 'pozycji')}. Dopóki ta lista nie jest pusta, dowodu nie wystawisz – inaczej VAT mógłby wyjść zły. Po każdej poprawce podgląd liczy się od nowa.`}
      </Alert>
      {canManage ? null : (
        <Typography variant="body2" color="text.secondary">
          {'Poprawki może wprowadzać osoba z uprawnieniem „Dowody sprzedaży”.'}
        </Typography>
      )}
      {groups.map(({ kind, items: groupItems }) => {
        const meta = KIND_META[kind];
        const shown = dedupe(kind, groupItems);
        const initial =
          meta.syncFixes && shown.length > COLLAPSE_ABOVE
            ? 0
            : VISIBLE_PER_GROUP;
        const visible = shown.slice(0, visibleCount[kind] ?? initial);
        return (
          <Accordion
            key={kind}
            variant="outlined"
            disableGutters
            defaultExpanded={groups.length <= 3}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography
                fontWeight={500}
              >{`${meta.title} (${groupItems.length})`}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1.5}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  alignItems={{ sm: 'center' }}
                  justifyContent="space-between"
                >
                  <Typography variant="body2" color="text.secondary">
                    {meta.hint}
                  </Typography>
                  {meta.syncFixes && canManage ? (
                    <LoadingButton
                      size="small"
                      variant="contained"
                      loading={syncing}
                      onClick={onSync}
                      sx={{ flexShrink: 0 }}
                    >
                      {'Dociągnij dane za okres'}
                    </LoadingButton>
                  ) : null}
                </Stack>
                <Divider />
                {visible.map((item) => (
                  <Box key={item.key}>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ md: 'center' }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2">
                          {item.orderId ? (
                            <Link
                              href={orderHref(item.orderId)}
                              target="_blank"
                              rel="noopener"
                            >
                              {item.orderExternalId}
                            </Link>
                          ) : (
                            item.orderExternalId || '—'
                          )}
                          {'count' in item && Number(item.count) > 1
                            ? ` i ${countLabel(Number(item.count) - 1, 'inne zamówienie', 'inne zamówienia', 'innych zamówień')}`
                            : ''}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.detail}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                        {actions(item)}
                      </Stack>
                    </Stack>
                  </Box>
                ))}
                {shown.length > visible.length ? (
                  <Button
                    size="small"
                    sx={{ alignSelf: 'flex-start' }}
                    onClick={() =>
                      setVisibleCount((prev) => ({
                        ...prev,
                        [kind]: visible.length
                          ? shown.length
                          : VISIBLE_PER_GROUP,
                      }))
                    }
                  >
                    {visible.length
                      ? `Pokaż wszystkie (${shown.length})`
                      : `Pokaż zamówienia (${shown.length})`}
                  </Button>
                ) : null}
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}

      {dialog?.type === 'bundle' ? (
        <BundleSharesDialog
          item={dialog.item}
          run={run}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog?.type === 'amount' ? (
        <AmountMismatchDialog
          item={dialog.item}
          run={run}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog?.type === 'refund' ? (
        <ManualRefundDialog
          item={dialog.item}
          run={run}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </Stack>
  );
};
