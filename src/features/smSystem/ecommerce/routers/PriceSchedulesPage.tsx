import AddIcon from '@mui/icons-material/Add';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Menu,
  MenuItem,
  Pagination,
  Stack,
  Table,
  ToggleButton,
  ToggleButtonGroup,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import { useAppSelector, useNotify } from '../../../../hooks';
import { Pages } from '../../../../utils';
import { formatPrice } from '../../products/utils';
import {
  ChannelPriceSchedule,
  ChannelProductLink,
  PriceScheduleDisableMode,
  PriceScheduleEvent,
  useBulkDeletePriceSchedules,
  useBulkDisablePriceSchedules,
  useBulkEnablePriceSchedules,
  useDeletePriceSchedule,
  useDisablePriceSchedule,
  useEnablePriceSchedule,
  useGetPriceSchedules,
  useRefreshPriceSchedulePrices,
} from '../api';
import { PriceScheduleProductGroups } from '../components';
import {
  SchedulePriceChangeModal,
  SchedulePriceDraftWizard,
  SchedulePriceOneOffModal,
} from '../modals';
import {
  applyPriceScheduleListParams,
  formatPriceScheduleEventLabel,
  groupSchedulesByProduct,
  isPriceScheduleChannelMismatch,
  notifyPriceScheduleConflictText,
  notifyPriceScheduleFailure,
  pageOfGroups,
  parsePriceScheduleListParams,
  resolveScheduleDeepLink,
  type PriceScheduleEnabledFilter,
} from '../utils';

const PAGE_SIZE = 25;

const formatEventPriceChange = (
  event: PriceScheduleEvent,
  currency: string,
) => {
  if (event.priceBefore == null && event.priceAfter == null) return '—';
  if (event.priceBefore != null && event.priceAfter != null) {
    return `${formatPrice(event.priceBefore, currency)} → ${formatPrice(
      event.priceAfter,
      currency,
    )}`;
  }
  if (event.priceAfter != null) return formatPrice(event.priceAfter, currency);
  return formatPrice(event.priceBefore as number | string, currency);
};

const scheduleNoun = (count: number) => {
  if (count === 1) return 'harmonogram';
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return 'harmonogramy';

  return 'harmonogramów';
};

/** Minimal link shape the modal needs, reconstructed from schedule context. */
const scheduleToLink = (
  schedule: ChannelPriceSchedule,
): ChannelProductLink => ({
  id: schedule.linkId,
  channel: schedule.channel,
  externalOfferId: schedule.externalOfferId,
  externalProductId: null,
  sku: null,
  ean: null,
  marketplace: schedule.marketplace,
  offerName: schedule.offerName,
  matchType: 'NONE',
  matchStatus: 'confirmed',
  isActive: true,
  price: schedule.linkPrice ?? schedule.originalPrice,
  currency: schedule.currency,
  stockAvailable: null,
  stockSold: null,
  stockPublishEnabled: false,
  unitsInOffer: 1,
  offerStatus: null,
  lastSyncedAt: null,
  externalUrl: null,
  productId: schedule.productId,
  productName: schedule.productName,
  productInternalId: null,
});

export const PriceSchedulesPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const listParams = parsePriceScheduleListParams(searchParams);
  const { query, page, scheduleId, status, offerHasActive } = listParams;
  const { user } = useAppSelector((state) => state.smSystemUser);
  const { notify } = useNotify();
  const [searchInput, setSearchInput] = useState(query);
  const [editedSchedule, setEditedSchedule] =
    useState<ChannelPriceSchedule | null>(null);
  const openedScheduleIdRef = useRef<number | null>(null);
  const missingNoticeKeyRef = useRef<string | null>(null);
  const [draftWizardOpen, setDraftWizardOpen] = useState(false);
  const [oneOffOpen, setOneOffOpen] = useState(false);
  const [historySchedule, setHistorySchedule] =
    useState<ChannelPriceSchedule | null>(null);
  const [menuState, setMenuState] = useState<{
    anchor: HTMLElement;
    schedule: ChannelPriceSchedule;
  } | null>(null);
  const [confirmDisable, setConfirmDisable] = useState<{
    schedule?: ChannelPriceSchedule;
    ids?: number[];
    mode: PriceScheduleDisableMode;
    force?: boolean;
  } | null>(null);
  const [confirmBulkEnableIds, setConfirmBulkEnableIds] = useState<
    number[] | null
  >(null);
  const [bulkDisableMenuAnchor, setBulkDisableMenuAnchor] =
    useState<HTMLElement | null>(null);
  const [actionsMenuAnchor, setActionsMenuAnchor] =
    useState<HTMLElement | null>(null);
  const actionsButtonRef = useRef<HTMLButtonElement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChannelPriceSchedule | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [collapsedKeys, setCollapsedKeys] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [confirmBulkDeleteIds, setConfirmBulkDeleteIds] = useState<
    number[] | null
  >(null);

  const replaceListParams = useCallback(
    (next: Parameters<typeof applyPriceScheduleListParams>[1]) => {
      setSearchParams(
        (prev) => {
          const params = applyPriceScheduleListParams(prev, next);
          if (params.toString() === prev.toString()) return prev;
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const { schedules, isLoading, isFetching, isPlaceholderData, isError } =
    useGetPriceSchedules({
      ...(query ? { query } : {}),
      ...(offerHasActive ? { hasActiveOnOffer: true } : {}),
    });
  // keepPreviousData would otherwise leave the previous, wider list on screen
  // while a new filter is in flight. Those rows must not be selectable.
  const listReady = !isLoading && !isPlaceholderData;
  const visibleSchedules = useMemo(() => {
    if (!listReady) return [];
    if (status === 'enabled')
      return schedules.filter((schedule) => schedule.isEnabled);
    if (status === 'disabled')
      return schedules.filter((schedule) => !schedule.isEnabled);
    return schedules;
  }, [listReady, schedules, status]);
  const productGroups = useMemo(
    () => groupSchedulesByProduct(visibleSchedules),
    [visibleSchedules],
  );
  const groupPage = pageOfGroups(productGroups, page, PAGE_SIZE);
  const pageScheduleIds = useMemo(
    () =>
      groupPage.rows.flatMap((group) =>
        group.schedules.map((schedule) => schedule.id),
      ),
    [groupPage.rows],
  );
  const allGroupsCollapsed =
    productGroups.length > 0 &&
    productGroups.every((group) => collapsedKeys.has(group.key));
  useEffect(() => {
    if (!listReady || groupPage.page === page) return;
    replaceListParams({ page: groupPage.page });
  }, [groupPage.page, listReady, page, replaceListParams]);
  useEffect(() => {
    if (!listReady) return;
    const visible = new Set(visibleSchedules.map((schedule) => schedule.id));
    setSelectedIds((current) => {
      const next = current.filter((id) => visible.has(id));
      return next.length === current.length ? current : next;
    });
  }, [listReady, visibleSchedules]);
  const selectedSchedules = visibleSchedules.filter((schedule) =>
    selectedIds.includes(schedule.id),
  );
  const selectedEnabledIds = selectedSchedules
    .filter((schedule) => schedule.isEnabled)
    .map((schedule) => schedule.id);
  const selectedDisabledIds = selectedSchedules
    .filter((schedule) => !schedule.isEnabled)
    .map((schedule) => schedule.id);
  const anySelectedApplied = selectedSchedules.some(
    (schedule) => schedule.isEnabled && schedule.isApplied,
  );
  const allPageSelected =
    pageScheduleIds.length > 0 &&
    pageScheduleIds.every((id) => selectedIds.includes(id));
  const { disablePriceSchedule, isPending: isDisabling } =
    useDisablePriceSchedule();
  const { enablePriceSchedule, isPending: isEnabling } =
    useEnablePriceSchedule();
  const { bulkDisablePriceSchedules, isPending: isBulkDisabling } =
    useBulkDisablePriceSchedules();
  const { bulkEnablePriceSchedules, isPending: isBulkEnabling } =
    useBulkEnablePriceSchedules();
  const { deletePriceSchedule, isPending: isDeleting } =
    useDeletePriceSchedule();
  const { bulkDeletePriceSchedules, isPending: isBulkDeleting } =
    useBulkDeletePriceSchedules();
  const { refreshPriceSchedulePrices, isPending: isRefreshing } =
    useRefreshPriceSchedulePrices();
  const isMutationBusy =
    isBulkDisabling ||
    isBulkEnabling ||
    isRefreshing ||
    isDisabling ||
    isEnabling ||
    isDeleting ||
    isBulkDeleting;
  useEffect(() => {
    setSearchInput((current) => (current.trim() === query ? current : query));
  }, [query]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const next = searchInput.trim();
      if (next === query) return;
      replaceListParams({ query: next, page: 0 });
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput, query, replaceListParams]);

  const toggleGroup = (key: string) =>
    setCollapsedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const openSchedule = useCallback(
    (schedule: ChannelPriceSchedule) => {
      openedScheduleIdRef.current = schedule.id;
      setEditedSchedule(schedule);
      replaceListParams({ scheduleId: schedule.id });
    },
    [replaceListParams],
  );

  const closeSchedule = useCallback(() => {
    setEditedSchedule(null);
    replaceListParams({ scheduleId: null });
  }, [replaceListParams]);

  useEffect(() => {
    const action = resolveScheduleDeepLink({
      scheduleId,
      isLoading,
      isPlaceholderData,
      isFetching,
      isError,
      found: visibleSchedules.some((schedule) => schedule.id === scheduleId),
      hasFilter: query.length > 0 || status !== 'all' || offerHasActive,
    });

    if (action === 'idle') {
      openedScheduleIdRef.current = null;
      missingNoticeKeyRef.current = null;
      return;
    }
    if (action === 'wait' || scheduleId == null) return;

    if (action === 'open') {
      if (openedScheduleIdRef.current === scheduleId) return;
      const found = visibleSchedules.find(
        (schedule) => schedule.id === scheduleId,
      );
      if (!found) return;
      openedScheduleIdRef.current = scheduleId;
      setEditedSchedule(found);
      return;
    }

    if (action === 'clear-filter') {
      const noticeKey = `filter:${scheduleId}:${query}:${status}:${
        offerHasActive ? 1 : 0
      }`;
      if (missingNoticeKeyRef.current === noticeKey) return;
      missingNoticeKeyRef.current = noticeKey;
      notify(
        'warning',
        `Harmonogram #${scheduleId} nie jest na tej liście przy obecnym filtrze.`,
        {
          actionLabel: 'Wyczyść filtr',
          onAction: () =>
            replaceListParams({
              query: '',
              page: 0,
              status: 'all',
              offerHasActive: false,
            }),
        },
      );
      return;
    }

    const noticeKey = `missing:${scheduleId}`;
    if (missingNoticeKeyRef.current === noticeKey) return;
    missingNoticeKeyRef.current = noticeKey;
    notify('error', `Nie znaleziono harmonogramu #${scheduleId}.`);
    replaceListParams({ scheduleId: null });
  }, [
    isError,
    isFetching,
    isLoading,
    isPlaceholderData,
    notify,
    offerHasActive,
    query,
    replaceListParams,
    scheduleId,
    status,
    visibleSchedules,
  ]);

  if (!user?.permissions?.canAccessEcommerce)
    return <Navigate to={Pages.smSystem} replace />;

  const handleDisable = async () => {
    const target = confirmDisable;
    setConfirmDisable(null);
    if (!target) return;

    if (target.ids && target.ids.length > 0) {
      try {
        const result = await bulkDisablePriceSchedules({
          ids: target.ids,
          mode: target.mode,
          force: target.force,
        });
        setSelectedIds([]);
        const completed = result.succeeded + result.revertPending;
        const total = completed + result.failed;
        if (completed === 0) {
          notify('error', `Nie udało się wyłączyć (${result.failed})`);
          return;
        }
        const pendingPart = result.revertPending
          ? ` (w tym ${result.revertPending} z ponawianiem przywrócenia)`
          : '';
        const failedPart = result.failed ? `, ${result.failed} nieudane` : '';
        notify(
          result.failed || result.revertPending ? 'warning' : 'success',
          `Wyłączono ${completed} z ${total}${pendingPart}${failedPart}`,
        );
      } catch {
        notify('error', 'Nie udało się wyłączyć zaznaczonych harmonogramów');
      }
      return;
    }

    if (!target.schedule) return;
    try {
      const result = await disablePriceSchedule({
        id: target.schedule.id,
        mode: target.mode,
        force: target.force,
      });
      if (result.revertPending) {
        notify(
          'warning',
          'Przywracanie ceny nie powiodło się — system będzie ponawiał co minutę',
        );
      } else {
        notify('success', 'Harmonogram wyłączony');
      }
    } catch {
      notify('error', 'Nie udało się wyłączyć harmonogramu');
    }
  };

  const handleBulkDelete = async () => {
    const ids = confirmBulkDeleteIds;
    setConfirmBulkDeleteIds(null);
    if (!ids || ids.length === 0) return;
    try {
      const result = await bulkDeletePriceSchedules(ids);
      setSelectedIds([]);
      if (result.deleted === 0) {
        notify(
          'error',
          result.blocked
            ? 'Nie usunięto — cena tymczasowa jest jeszcze aktywna. Najpierw wyłącz harmonogram.'
            : 'Nie udało się usunąć zaznaczonych harmonogramów',
        );
        return;
      }
      const blockedPart = result.blocked
        ? `, ${result.blocked} pominięte (aktywna cena tymczasowa)`
        : '';
      const failedPart = result.failed ? `, ${result.failed} nieudane` : '';
      notify(
        result.failed || result.blocked ? 'warning' : 'success',
        `Usunięto ${result.deleted}${blockedPart}${failedPart}`,
      );
    } catch {
      notify('error', 'Nie udało się usunąć zaznaczonych harmonogramów');
    }
  };

  const handleDelete = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    if (!target) return;
    try {
      await deletePriceSchedule(target.id);
      notify('success', 'Harmonogram usunięty');
    } catch {
      notify('error', 'Nie udało się usunąć harmonogramu');
    }
  };

  const disableConfirmText = () => {
    if (!confirmDisable) return '';
    const { schedule, ids, mode, force } = confirmDisable;
    const count = ids?.length ?? 1;

    if (ids && ids.length > 0) {
      if (force) {
        return (
          `Wyłączyć ${count} ${scheduleNoun(count)} bez zmiany ceny na kanale? ` +
          'Ceny na ofertach NIE zostaną zmienione — użyj tej opcji tylko, gdy oferty nie odpowiadają (np. zostały usunięte).'
        );
      }
      if (mode === 'revert_now') {
        return (
          `Wyłączyć ${count} ${scheduleNoun(count)}? Oferty z aktywną ceną tymczasową ` +
          'od razu wrócą do ceny bazowej.'
        );
      }
      return (
        `Wyłączyć ${count} ${scheduleNoun(count)} po zakończeniu bieżącego okna? ` +
        'Cena tymczasowa będzie obowiązywać do końca okna, potem oferty wrócą do ceny bazowej.'
      );
    }

    if (!schedule) return '';
    const offer = schedule.offerName || schedule.externalOfferId;
    if (force) {
      return (
        `Wyłączyć harmonogram dla "${offer}" bez zmiany ceny na kanale? ` +
        'Cena na ofercie NIE zostanie zmieniona — użyj tej opcji tylko, gdy oferta nie odpowiada (np. została usunięta).'
      );
    }
    if (mode === 'revert_now') {
      return schedule.isApplied
        ? `Wyłączyć harmonogram dla "${offer}"? Oferta od razu wróci do ceny bazowej ${formatPrice(
            schedule.originalPrice,
            schedule.currency,
          )}.`
        : `Wyłączyć harmonogram dla "${offer}"? Cena na ofercie nie ulegnie zmianie.`;
    }
    return (
      `Wyłączyć harmonogram dla "${offer}" po zakończeniu bieżącego okna? ` +
      `Cena tymczasowa ${
        schedule.temporaryPrice != null
          ? formatPrice(schedule.temporaryPrice, schedule.currency)
          : '—'
      } będzie obowiązywać do końca okna, potem oferta wróci do ${formatPrice(
        schedule.originalPrice,
        schedule.currency,
      )}.`
    );
  };

  const bulkEnableConfirmText = () => {
    const ids = confirmBulkEnableIds ?? [];
    const count = ids.length;
    const noun = scheduleNoun(count);
    const drafts = ids.filter((id) =>
      schedules.some(
        (schedule) => schedule.id === id && schedule.temporaryPrice == null,
      ),
    ).length;
    if (count > 0 && drafts === count) {
      const missing = count === 1 ? 'Nie ma' : 'Nie mają';
      return `Włączyć ${count} ${noun}? ${missing} ceny tymczasowej. Uzupełnij ją w edycji — bez niej włączenie się nie uda.`;
    }
    if (drafts > 0) {
      const missing = drafts === 1 ? 'nie ma' : 'nie mają';
      const skipped =
        drafts === 1 ? 'nie zostanie włączony' : 'nie zostaną włączone';
      return (
        `Włączyć ${count} ${noun}? ${drafts} ${missing} ceny tymczasowej i ${skipped}. ` +
        'Uzupełnij cenę w edycji. Przy pozostałych cena tymczasowa zastosuje się od razu, jeśli trwa okno.'
      );
    }
    return `Włączyć ${count} ${noun}? Jeśli bieżący czas przypada w oknie, cena tymczasowa zostanie zastosowana od razu.`;
  };

  const handleEnable = async (schedule: ChannelPriceSchedule) => {
    try {
      const result = await enablePriceSchedule(schedule.id);
      if (result.applyPending) {
        notify(
          'warning',
          'Włączenie udało się, ale zmiana ceny nie powiodła się — system będzie ponawiał co minutę',
        );
      } else {
        notify('success', 'Harmonogram włączony');
      }
    } catch (err) {
      notifyPriceScheduleFailure(
        notify,
        err,
        'Nie udało się włączyć harmonogramu',
      );
    }
  };

  const handleBulkEnable = async () => {
    const ids = confirmBulkEnableIds ?? [];
    setConfirmBulkEnableIds(null);
    if (ids.length === 0) return;
    try {
      const result = await bulkEnablePriceSchedules(ids);
      setSelectedIds([]);
      const completed = result.succeeded + result.applyPending;
      const total = completed + result.failed;
      const reason =
        result.errors.length === 0
          ? ''
          : result.errors.length === 1
            ? `: ${result.errors[0]}`
            : `: ${result.errors[0]} (+${result.errors.length - 1})`;
      if (completed === 0) {
        notifyPriceScheduleConflictText(
          notify,
          'error',
          `Nie udało się włączyć (${result.failed})${reason}`,
        );
        return;
      }
      const pendingPart = result.applyPending
        ? ` (w tym ${result.applyPending} z ponawianiem zmiany ceny)`
        : '';
      const failedPart = result.failed
        ? `, ${result.failed} nieudane${reason}`
        : '';
      const summary = `Włączono ${completed} z ${total}${pendingPart}${failedPart}`;
      if (result.failed)
        notifyPriceScheduleConflictText(notify, 'warning', summary);
      else notify(result.applyPending ? 'warning' : 'success', summary);
    } catch (err) {
      notifyPriceScheduleFailure(
        notify,
        err,
        'Nie udało się włączyć zaznaczonych harmonogramów',
      );
    }
  };

  const handleRefreshPrices = async () => {
    const ids = visibleSchedules
      .filter((schedule) => selectedIds.includes(schedule.id))
      .map((schedule) => schedule.id);
    if (ids.length === 0) return;
    try {
      const result = await refreshPriceSchedulePrices(ids);
      const mismatchCount = result.results.filter(
        isPriceScheduleChannelMismatch,
      ).length;
      const failed = result.errors.length;
      const refreshed = result.results.length;
      if (failed && refreshed === 0) {
        notify('error', `Nie udało się pobrać cen (${failed})`);
        return;
      }
      const mismatchPart = mismatchCount
        ? `, ${mismatchCount} różni się od harmonogramu`
        : '';
      const failedPart = failed ? `, ${failed} nieudane` : '';
      notify(
        failed ? 'warning' : 'success',
        `Pobrano ceny: ${refreshed} zaktualizowane${mismatchPart}${failedPart}`,
      );
    } catch {
      notify('error', 'Nie udało się pobrać aktualnych cen');
    }
  };


  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
        gap={2}
      >
        <Stack spacing={0.5}>
          <Typography variant="h5">{'Zaplanowane zmiany cen'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {
              'Cykliczne tymczasowe ceny dla ofert Allegro. Możesz też utworzyć harmonogram z karty produktu.'
            }
          </Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDraftWizardOpen(true)}
          sx={{ flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'auto' } }}
        >
          {'Zaplanuj zmianę ceny'}
        </Button>
      </Stack>

      <Stack
        direction="row"
        gap={1}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
      >
        <ToggleButtonGroup
          size="small"
          exclusive
          value={status}
          aria-label="Status harmonogramu"
          onChange={(
            _event,
            value: PriceScheduleEnabledFilter | null,
          ) => {
            if (!value || value === status) return;
            setSelectedIds([]);
            replaceListParams({
              status: value,
              page: 0,
              ...(value !== 'disabled' ? { offerHasActive: false } : {}),
            });
          }}
          sx={{ flexShrink: 0 }}
        >
          <ToggleButton value="all">{'Wszystkie'}</ToggleButton>
          <ToggleButton value="enabled">{'Włączone'}</ToggleButton>
          <ToggleButton value="disabled">{'Wyłączone'}</ToggleButton>
        </ToggleButtonGroup>
        <TextField
          size="small"
          label="Szukaj po nazwie, kodzie kreskowym lub ID wewnętrznym"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{
            flex: '1 1 240px',
            minWidth: { xs: '100%', sm: 240 },
            maxWidth: { xs: '100%', sm: 480 },
          }}
        />
        {(status === 'disabled' || offerHasActive) && (
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={offerHasActive}
                onChange={(_event, checked) => {
                  setSelectedIds([]);
                  replaceListParams({
                    offerHasActive: checked,
                    page: 0,
                  });
                }}
              />
            }
            label="Oferta ma już aktywną zmianę"
            sx={{ flexShrink: 0, mr: 0 }}
          />
        )}
        <Button
          size="small"
          disabled={productGroups.length === 0}
          onClick={() =>
            setCollapsedKeys(
              allGroupsCollapsed
                ? new Set()
                : new Set(productGroups.map((group) => group.key)),
            )
          }
          sx={{ flexShrink: 0 }}
        >
          {allGroupsCollapsed ? 'Rozwiń wszystkie' : 'Zwiń wszystkie'}
        </Button>
        <Button
          size="small"
          disabled={pageScheduleIds.length === 0 || isMutationBusy}
          onClick={() => {
            const pageIds = new Set(pageScheduleIds);
            setSelectedIds((current) =>
              allPageSelected
                ? current.filter((id) => !pageIds.has(id))
                : [
                    ...current.filter((id) => !pageIds.has(id)),
                    ...pageScheduleIds,
                  ],
            );
          }}
          sx={{ flexShrink: 0 }}
        >
          {allPageSelected
            ? groupPage.pageCount > 1
              ? 'Odznacz stronę'
              : 'Odznacz wszystkie'
            : groupPage.pageCount > 1
              ? `Zaznacz stronę (${pageScheduleIds.length})`
              : `Zaznacz wszystkie (${pageScheduleIds.length})`}
        </Button>
        <LoadingButton
          ref={actionsButtonRef}
          size="small"
          variant="outlined"
          loading={
            isRefreshing || isBulkDisabling || isBulkEnabling || isBulkDeleting
          }
          disabled={selectedSchedules.length === 0 || isMutationBusy}
          endIcon={<ArrowDropDownIcon />}
          onClick={(event) => setActionsMenuAnchor(event.currentTarget)}
          sx={{ flexShrink: 0 }}
          title={
            selectedSchedules.length === 0
              ? 'Zaznacz harmonogramy, aby wybrać akcję'
              : undefined
          }
        >
          {selectedSchedules.length > 0
            ? `Akcje (${selectedSchedules.length})`
            : 'Akcje'}
        </LoadingButton>
      </Stack>

      {!listReady ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress size={28} />
        </Box>
      ) : visibleSchedules.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {query || status !== 'all' || offerHasActive
            ? 'Brak harmonogramów pasujących do filtrów.'
            : 'Brak harmonogramów cenowych.'}
        </Typography>
      ) : (
        <Stack spacing={2}>
          <PriceScheduleProductGroups
            groups={groupPage.rows}
            selectedIds={selectedIds}
            onSelectedIdsChange={setSelectedIds}
            collapsedKeys={collapsedKeys}
            onToggleGroup={toggleGroup}
            onOpenProduct={(productId) =>
              navigate(
                Pages.smSystemProductDetails.replace(
                  ':productId',
                  String(productId),
                ),
              )
            }
            onEdit={openSchedule}
            onHistory={setHistorySchedule}
            onEnable={handleEnable}
            onDisableMenu={(schedule, anchor) =>
              setMenuState({ anchor, schedule })
            }
            onDelete={setDeleteTarget}
            disabled={isMutationBusy}
          />
          {groupPage.pageCount > 1 && (
            <Pagination
              count={groupPage.pageCount}
              page={groupPage.page + 1}
              onChange={(_event, value) =>
                replaceListParams({ page: value - 1 })
              }
              sx={{ alignSelf: 'center' }}
            />
          )}
        </Stack>
      )}

      <Menu
        anchorEl={menuState?.anchor ?? null}
        open={!!menuState}
        onClose={() => setMenuState(null)}
      >
        <MenuItem
          onClick={() => {
            setConfirmDisable({
              schedule: menuState!.schedule,
              mode: 'revert_now',
            });
            setMenuState(null);
          }}
        >
          {menuState?.schedule.isApplied
            ? 'Wyłącz i przywróć cenę bazową teraz'
            : 'Wyłącz'}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setConfirmDisable({
              schedule: menuState!.schedule,
              mode: 'revert_at_window_end',
            });
            setMenuState(null);
          }}
          disabled={!menuState?.schedule.isApplied}
        >
          {'Wyłącz — cena wróci po zakończeniu okna'}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setConfirmDisable({
              schedule: menuState!.schedule,
              mode: 'revert_now',
              force: true,
            });
            setMenuState(null);
          }}
        >
          {'Wyłącz bez zmiany ceny na kanale (wymuszone)'}
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={actionsMenuAnchor}
        open={!!actionsMenuAnchor}
        onClose={() => setActionsMenuAnchor(null)}
      >
        <MenuItem
          disabled={selectedSchedules.length === 0 || isMutationBusy}
          onClick={() => {
            setActionsMenuAnchor(null);
            void handleRefreshPrices();
          }}
        >
          {selectedSchedules.length > 0
            ? `Pobierz aktualne ceny (${selectedSchedules.length})`
            : 'Pobierz aktualne ceny'}
        </MenuItem>
        <MenuItem
          disabled={selectedSchedules.length === 0 || isMutationBusy}
          onClick={() => {
            setActionsMenuAnchor(null);
            setOneOffOpen(true);
          }}
        >
          {selectedSchedules.length > 0
            ? `Dodaj jednorazowe okno (${selectedSchedules.length})`
            : 'Dodaj jednorazowe okno'}
        </MenuItem>
        <Divider />
        <MenuItem
          disabled={selectedEnabledIds.length === 0 || isMutationBusy}
          onClick={() => {
            setActionsMenuAnchor(null);
            setBulkDisableMenuAnchor(actionsButtonRef.current);
          }}
        >
          {selectedEnabledIds.length > 0
            ? `Wyłącz zaznaczone (${selectedEnabledIds.length})`
            : 'Wyłącz zaznaczone'}
        </MenuItem>
        <MenuItem
          disabled={selectedDisabledIds.length === 0 || isMutationBusy}
          onClick={() => {
            setActionsMenuAnchor(null);
            setConfirmBulkEnableIds([...selectedDisabledIds]);
          }}
        >
          {selectedDisabledIds.length > 0
            ? `Włącz zaznaczone (${selectedDisabledIds.length})`
            : 'Włącz zaznaczone'}
        </MenuItem>
        <MenuItem
          disabled={selectedDisabledIds.length === 0 || isMutationBusy}
          onClick={() => {
            setActionsMenuAnchor(null);
            setConfirmBulkDeleteIds([...selectedDisabledIds]);
          }}
          sx={{ color: 'error.main' }}
        >
          {selectedDisabledIds.length > 0
            ? `Usuń zaznaczone (${selectedDisabledIds.length})`
            : 'Usuń zaznaczone'}
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={bulkDisableMenuAnchor}
        open={!!bulkDisableMenuAnchor}
        onClose={() => setBulkDisableMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            setConfirmDisable({
              ids: selectedEnabledIds,
              mode: 'revert_now',
            });
            setBulkDisableMenuAnchor(null);
          }}
        >
          {anySelectedApplied
            ? 'Wyłącz i przywróć cenę bazową teraz'
            : 'Wyłącz'}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setConfirmDisable({
              ids: selectedEnabledIds,
              mode: 'revert_at_window_end',
            });
            setBulkDisableMenuAnchor(null);
          }}
          disabled={!anySelectedApplied}
        >
          {'Wyłącz — cena wróci po zakończeniu okna'}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setConfirmDisable({
              ids: selectedEnabledIds,
              mode: 'revert_now',
              force: true,
            });
            setBulkDisableMenuAnchor(null);
          }}
        >
          {'Wyłącz bez zmiany ceny na kanale (wymuszone)'}
        </MenuItem>
      </Menu>

      <Dialog
        open={!!confirmDisable}
        onClose={() => setConfirmDisable(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {confirmDisable?.ids
            ? 'Wyłączenie zaznaczonych harmonogramów'
            : 'Wyłączenie harmonogramu'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">{disableConfirmText()}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDisable(null)}>{'Anuluj'}</Button>
          <Button
            color="error"
            variant="contained"
            disabled={isDisabling || isBulkDisabling}
            onClick={handleDisable}
          >
            {'Wyłącz'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmBulkEnableIds != null}
        onClose={() => setConfirmBulkEnableIds(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{'Włączenie zaznaczonych harmonogramów'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{bulkEnableConfirmText()}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmBulkEnableIds(null)}>
            {'Anuluj'}
          </Button>
          <Button
            variant="contained"
            disabled={isBulkEnabling}
            onClick={handleBulkEnable}
          >
            {'Włącz'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmBulkDeleteIds != null}
        onClose={() => setConfirmBulkDeleteIds(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{'Usunięcie zaznaczonych harmonogramów'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {`Usunąć ${confirmBulkDeleteIds?.length ?? 0} ${scheduleNoun(
              confirmBulkDeleteIds?.length ?? 0,
            )}? Historia zdarzeń zostanie usunięta. Tej operacji nie można cofnąć. Harmonogram z aktywną ceną tymczasową zostanie pominięty.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmBulkDeleteIds(null)}>
            {'Anuluj'}
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={isBulkDeleting}
            onClick={handleBulkDelete}
          >
            {'Usuń'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{'Usunięcie harmonogramu'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {`Usunąć harmonogram dla "${
              deleteTarget?.offerName || deleteTarget?.externalOfferId
            }"? Historia zdarzeń zostanie usunięta. Tej operacji nie można cofnąć.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>{'Anuluj'}</Button>
          <Button
            color="error"
            variant="contained"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {'Usuń'}
          </Button>
        </DialogActions>
      </Dialog>

      {historySchedule && (
        <Dialog
          open={!!historySchedule}
          onClose={() => setHistorySchedule(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {`Historia — ${historySchedule.offerName || historySchedule.externalOfferId}`}
          </DialogTitle>
          <DialogContent>
            {(historySchedule.events ?? []).length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {
                  'Brak zdarzeń. Pojawią się po pierwszym zastosowaniu lub przywróceniu ceny.'
                }
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{'Czas'}</TableCell>
                    <TableCell>{'Zdarzenie'}</TableCell>
                    <TableCell>{'Cena'}</TableCell>
                    <TableCell>{'Szczegóły'}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(historySchedule.events ?? []).map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        {dayjs(event.createdAt).format('DD.MM.YYYY HH:mm')}
                      </TableCell>
                      <TableCell>
                        {formatPriceScheduleEventLabel(event)}
                      </TableCell>
                      <TableCell>
                        {formatEventPriceChange(
                          event,
                          historySchedule.currency,
                        )}
                      </TableCell>
                      <TableCell>{event.message || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DialogContent>
        </Dialog>
      )}

      <SchedulePriceDraftWizard
        open={draftWizardOpen}
        onClose={() => setDraftWizardOpen(false)}
        onCreated={() => {
          setSelectedIds([]);
          setSearchInput('');
          setEditedSchedule(null);
          replaceListParams({
            query: '',
            page: 0,
            scheduleId: null,
            status: 'all',
            offerHasActive: false,
          });
        }}
      />

      <SchedulePriceOneOffModal
        open={oneOffOpen}
        schedules={visibleSchedules.filter((schedule) =>
          selectedIds.includes(schedule.id),
        )}
        onClose={() => setOneOffOpen(false)}
      />

      {editedSchedule && (
        <SchedulePriceChangeModal
          open={!!editedSchedule}
          onClose={closeSchedule}
          link={scheduleToLink(editedSchedule)}
          schedule={editedSchedule}
        />
      )}
    </Stack>
  );
};
