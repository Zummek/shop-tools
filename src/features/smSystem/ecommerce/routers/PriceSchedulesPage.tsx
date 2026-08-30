import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { MouseEvent, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { useAppSelector, useNotify } from '../../../../hooks';
import { Pages } from '../../../../utils';
import { formatPrice } from '../../products/utils';
import {
  ChannelPriceSchedule,
  ChannelProductLink,
  PriceScheduleDisableMode,
  PriceScheduleEvent,
  useBulkDisablePriceSchedules,
  useBulkEnablePriceSchedules,
  useDeletePriceSchedule,
  useDisablePriceSchedule,
  useEnablePriceSchedule,
  useGetPriceSchedules,
  useRefreshPriceSchedulePrices,
} from '../api';
import {
  SchedulePriceChangeModal,
  SelectAllegroOfferForScheduleModal,
} from '../modals';
import {
  formatPriceScheduleEventLabel,
  formatPriceScheduleNextChange,
  formatPriceScheduleWindows,
  isPriceScheduleChannelMismatch,
  isPriceScheduleExpectingTemporary,
  isPriceScheduleSnoozed,
} from '../utils';

const statusChip = (schedule: ChannelPriceSchedule) => {
  if (!schedule.isEnabled)
    return <Chip size="small" label="Wyłączona" color="default" />;
  if (schedule.consecutiveFailures > 0) {
    return (
      <Chip
        size="small"
        label="Błąd — ponawiam"
        color="error"
        title={schedule.lastError ?? undefined}
      />
    );
  }
  if (schedule.disableAfterRevert)
    return <Chip size="small" label="Wyłączanie po oknie" color="warning" />;
  if (schedule.isApplied)
    return <Chip size="small" label="Zmiana ceny aktywna" color="success" />;
  if (isPriceScheduleSnoozed(schedule)) {
    return (
      <Chip
        size="small"
        label={`Wstrzymana do ${dayjs(schedule.snoozedUntil).format(
          'DD.MM HH:mm',
        )}`}
        color="warning"
        title="Cena bazowa zastosowana od razu — cena tymczasowa wróci przy następnym oknie"
      />
    );
  }
  return <Chip size="small" label="Zaplanowana" color="info" />;
};

const allegroOfferUrl = (offerId: string, marketplace?: string | null) => {
  if (marketplace?.includes('cz'))
    return `https://allegro.cz/oferta/${offerId}`;
  if (marketplace?.includes('sk'))
    return `https://allegro.sk/oferta/${offerId}`;
  if (marketplace?.includes('hu'))
    return `https://allegro.hu/oferta/${offerId}`;
  return `https://allegro.pl/oferta/${offerId}`;
};

const scheduleOfferUrl = (schedule: ChannelPriceSchedule) => {
  if (schedule.channel === 'allegro' && schedule.externalOfferId)
    return allegroOfferUrl(schedule.externalOfferId, schedule.marketplace);
  return null;
};

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

const latestEvent = (schedule: ChannelPriceSchedule) =>
  schedule.events?.[0] ?? null;

const scheduleNoun = (count: number) => {
  if (count === 1) return 'harmonogram';
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return 'harmonogramy';

  return 'harmonogramów';
};

const NameWithEyeButton = ({
  name,
  ariaLabel,
  href,
  onClick,
}: {
  name: string | null;
  ariaLabel: string;
  href?: string;
  onClick?: () => void;
}) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={0.5}
    sx={{ minWidth: 0, width: '100%' }}
  >
    <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
      {name || '—'}
    </Typography>
    {(href || onClick) && (
      <IconButton
        size="small"
        component={href ? 'a' : 'button'}
        href={href}
        target={href ? '_blank' : undefined}
        rel={href ? 'noopener noreferrer' : undefined}
        aria-label={ariaLabel}
        onClick={(event: MouseEvent) => {
          event.stopPropagation();
          onClick?.();
        }}
      >
        <VisibilityOutlinedIcon fontSize="small" />
      </IconButton>
    )}
  </Stack>
);

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
  offerStatus: null,
  lastSyncedAt: null,
  externalUrl: null,
  productId: schedule.productId,
  productName: schedule.productName,
  productInternalId: null,
});

export const PriceSchedulesPage = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.smSystemUser);
  const { notify } = useNotify();
  const [tab, setTab] = useState<'active' | 'inactive'>('active');
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [editedSchedule, setEditedSchedule] =
    useState<ChannelPriceSchedule | null>(null);
  const [createLink, setCreateLink] = useState<ChannelProductLink | null>(null);
  const [pickOfferOpen, setPickOfferOpen] = useState(false);
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
  const [deleteTarget, setDeleteTarget] = useState<ChannelPriceSchedule | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const isActiveTab = tab === 'active';
  const { schedules, isLoading, isPlaceholderData } = useGetPriceSchedules({
    isEnabled: isActiveTab,
    ...(query ? { query } : {}),
  });
  const visibleSchedules = schedules.filter(
    (schedule) => schedule.isEnabled === isActiveTab,
  );
  const selectedSchedules = visibleSchedules.filter((schedule) =>
    selectedIds.includes(schedule.id),
  );
  const anySelectedApplied = selectedSchedules.some(
    (schedule) => schedule.isApplied,
  );
  const allVisibleSelected =
    visibleSchedules.length > 0 &&
    visibleSchedules.every((schedule) => selectedIds.includes(schedule.id));
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
  const { refreshPriceSchedulePrices, isPending: isRefreshing } =
    useRefreshPriceSchedulePrices();
  const isMutationBusy =
    isBulkDisabling ||
    isBulkEnabling ||
    isRefreshing ||
    isDisabling ||
    isEnabling ||
    isDeleting;
  useEffect(() => {
    const timeout = setTimeout(() => setQuery(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

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
      `Cena tymczasowa ${formatPrice(
        schedule.temporaryPrice,
        schedule.currency,
      )} będzie obowiązywać do końca okna, potem oferta wróci do ${formatPrice(
        schedule.originalPrice,
        schedule.currency,
      )}.`
    );
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
    } catch {
      notify('error', 'Nie udało się włączyć harmonogramu');
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
      if (completed === 0) {
        notify('error', `Nie udało się włączyć (${result.failed})`);
        return;
      }
      const pendingPart = result.applyPending
        ? ` (w tym ${result.applyPending} z ponawianiem zmiany ceny)`
        : '';
      const failedPart = result.failed ? `, ${result.failed} nieudane` : '';
      notify(
        result.failed || result.applyPending ? 'warning' : 'success',
        `Włączono ${completed} z ${total}${pendingPart}${failedPart}`,
      );
    } catch {
      notify('error', 'Nie udało się włączyć zaznaczonych harmonogramów');
    }
  };

  const handleRefreshPrices = async () => {
    if (selectedIds.length === 0) return;
    try {
      const result = await refreshPriceSchedulePrices(selectedIds);
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

  const columns: GridColDef<ChannelPriceSchedule>[] = [
    {
      field: 'offerName',
      headerName: 'Oferta',
      flex: 1.4,
      minWidth: 220,
      renderCell: (params) => {
        const url = scheduleOfferUrl(params.row);
        return (
          <NameWithEyeButton
            name={params.row.offerName}
            ariaLabel="Otwórz ofertę"
            href={url ?? undefined}
          />
        );
      },
    },
    {
      field: 'productName',
      headerName: 'Produkt',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <NameWithEyeButton
          name={params.row.productName}
          ariaLabel="Otwórz produkt"
          onClick={
            params.row.productId
              ? () =>
                  navigate(
                    Pages.smSystemProductDetails.replace(
                      ':productId',
                      String(params.row.productId),
                    ),
                  )
              : undefined
          }
        />
      ),
    },
    {
      field: 'temporaryPrice',
      headerName: 'Cena tymczasowa',
      width: 130,
      valueGetter: (_value, row) =>
        formatPrice(row.temporaryPrice, row.currency),
    },
    {
      field: 'originalPrice',
      headerName: 'Cena bazowa',
      width: 120,
      valueGetter: (_value, row) =>
        formatPrice(row.originalPrice, row.currency),
    },
    {
      field: 'linkPrice',
      headerName: 'Cena na kanale',
      width: 200,
      renderCell: (params) => {
        const mismatch = isPriceScheduleChannelMismatch(params.row);
        return (
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            sx={{ minWidth: 0 }}
          >
            <Typography
              variant="body2"
              noWrap
              title="Ostatnia znana cena na ofercie"
            >
              {params.row.linkPrice != null
                ? formatPrice(params.row.linkPrice, params.row.currency)
                : '—'}
            </Typography>
            {mismatch && (
              <Chip
                size="small"
                color="warning"
                label={
                  isPriceScheduleExpectingTemporary(params.row)
                    ? 'Inna niż tymczasowa'
                    : 'Inna niż bazowa'
                }
              />
            )}
          </Stack>
        );
      },
    },
    {
      field: 'windows',
      headerName: 'Okna',
      flex: 1.6,
      minWidth: 240,
      sortable: false,
      valueGetter: (_value, row) => formatPriceScheduleWindows(row.windows),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 170,
      sortable: false,
      renderCell: (params) => statusChip(params.row),
    },
    {
      field: 'lastEvent',
      headerName: 'Ostatnie zdarzenie',
      flex: 1.2,
      minWidth: 220,
      sortable: false,
      renderCell: (params) => {
        const event = latestEvent(params.row);
        if (!event) {
          return (
            <Typography variant="body2" color="text.secondary">
              {'Brak'}
            </Typography>
          );
        }
        return (
          <Stack spacing={0} sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap>
              {formatPriceScheduleEventLabel(event)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {dayjs(event.createdAt).format('DD.MM HH:mm')}
            </Typography>
          </Stack>
        );
      },
    },
    {
      field: 'nextWindowStartsAt',
      headerName: 'Następna zmiana',
      width: 160,
      valueGetter: (_value, row) => {
        const { primary, secondary } = formatPriceScheduleNextChange(
          row,
          (iso) => dayjs(iso).format('DD.MM HH:mm'),
        );
        return secondary ? `${primary} (${secondary})` : primary;
      },
      renderCell: (params) => {
        const { primary, secondary } = formatPriceScheduleNextChange(
          params.row,
          (iso) => dayjs(iso).format('DD.MM HH:mm'),
        );
        return (
          <Stack spacing={0} sx={{ minWidth: 0, justifyContent: 'center' }}>
            <Typography variant="body2" noWrap>
              {primary}
            </Typography>
            {secondary && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {secondary}
              </Typography>
            )}
          </Stack>
        );
      },
    },
    {
      field: 'actions',
      headerName: '',
      width: 280,
      sortable: false,
      renderCell: (params) => {
        const schedule = params.row;
        return (
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              size="small"
              aria-label="Historia zmian ceny"
              disabled={isMutationBusy}
              onClick={() => setHistorySchedule(schedule)}
            >
              <HistoryOutlinedIcon fontSize="small" />
            </IconButton>
            <Button
              size="small"
              disabled={isMutationBusy}
              onClick={() => setEditedSchedule(schedule)}
            >
              {'Edytuj'}
            </Button>
            {schedule.isEnabled ? (
              <Button
                size="small"
                color="error"
                disabled={isMutationBusy}
                onClick={(e) =>
                  setMenuState({ anchor: e.currentTarget, schedule })
                }
              >
                {'Wyłącz'}
              </Button>
            ) : (
              <>
                <Button
                  size="small"
                  disabled={isMutationBusy}
                  onClick={() => handleEnable(schedule)}
                >
                  {'Włącz'}
                </Button>
                <IconButton
                  size="small"
                  aria-label="Usuń harmonogram"
                  disabled={isMutationBusy}
                  onClick={() => setDeleteTarget(schedule)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </Stack>
        );
      },
    },
  ];

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
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
          onClick={() => setPickOfferOpen(true)}
          sx={{ flexShrink: 0 }}
        >
          {'Zaplanuj zmianę ceny'}
        </Button>
      </Stack>

      <Tabs
        value={tab}
        onChange={(_event, value: 'active' | 'inactive') => {
          setTab(value);
          setSelectedIds([]);
        }}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="active" label="Aktywne" />
        <Tab value="inactive" label="Nieaktywne" />
      </Tabs>

      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <TextField
          size="small"
          label="Szukaj po nazwie, kodzie kreskowym lub ID wewnętrznym"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ maxWidth: 480, flex: 1 }}
        />
        {visibleSchedules.length > 0 && (
          <Button
            size="small"
            disabled={isMutationBusy}
            onClick={() =>
              setSelectedIds(
                allVisibleSelected
                  ? []
                  : visibleSchedules.map((schedule) => schedule.id),
              )
            }
            sx={{ flexShrink: 0 }}
          >
            {allVisibleSelected
              ? 'Odznacz wszystkie'
              : `Zaznacz wszystkie (${visibleSchedules.length})`}
          </Button>
        )}
        <LoadingButton
          variant="outlined"
          onClick={handleRefreshPrices}
          loading={isRefreshing}
          disabled={selectedIds.length === 0 || isMutationBusy}
          sx={{ flexShrink: 0 }}
          title={
            selectedIds.length === 0
              ? 'Zaznacz wiersze (lub „Zaznacz wszystkie”), aby pobrać aktualne ceny'
              : undefined
          }
        >
          {selectedIds.length > 0
            ? `Pobierz aktualne ceny (${selectedIds.length})`
            : 'Pobierz aktualne ceny'}
        </LoadingButton>
        {selectedIds.length > 0 && isActiveTab && (
          <LoadingButton
            variant="outlined"
            color="error"
            loading={isBulkDisabling}
            disabled={isMutationBusy}
            onClick={(e) => setBulkDisableMenuAnchor(e.currentTarget)}
            sx={{ flexShrink: 0 }}
          >
            {`Wyłącz zaznaczone (${selectedIds.length})`}
          </LoadingButton>
        )}
        {selectedIds.length > 0 && !isActiveTab && (
          <LoadingButton
            variant="outlined"
            loading={isBulkEnabling}
            disabled={isMutationBusy}
            onClick={() => setConfirmBulkEnableIds([...selectedIds])}
            sx={{ flexShrink: 0 }}
          >
            {`Włącz zaznaczone (${selectedIds.length})`}
          </LoadingButton>
        )}
      </Stack>

      {(isLoading || isPlaceholderData) && visibleSchedules.length === 0 ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress size={28} />
        </Box>
      ) : visibleSchedules.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {query
            ? 'Brak harmonogramów pasujących do wyszukiwania.'
            : isActiveTab
              ? 'Brak aktywnych harmonogramów cenowych.'
              : 'Brak nieaktywnych harmonogramów cenowych.'}
        </Typography>
      ) : (
        <DataGrid
          key={tab}
          rows={visibleSchedules}
          columns={columns}
          loading={isLoading}
          autoHeight
          checkboxSelection
          disableColumnFilter
          disableRowSelectionOnClick
          rowSelectionModel={selectedIds}
          onRowSelectionModelChange={(ids: GridRowSelectionModel) =>
            setSelectedIds(ids as number[])
          }
          pageSizeOptions={[25]}
          initialState={{
            pagination: { paginationModel: { page: 0, pageSize: 25 } },
            sorting: {
              sortModel: [{ field: 'productName', sort: 'asc' }],
            },
          }}
          sx={{
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
            },
          }}
        />
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
        anchorEl={bulkDisableMenuAnchor}
        open={!!bulkDisableMenuAnchor}
        onClose={() => setBulkDisableMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            setConfirmDisable({
              ids: selectedIds,
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
              ids: selectedIds,
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
              ids: selectedIds,
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
          <Typography variant="body2">
            {`Włączyć ${confirmBulkEnableIds?.length ?? 0} ${scheduleNoun(
              confirmBulkEnableIds?.length ?? 0,
            )}? Jeśli bieżący czas przypada w oknie, cena tymczasowa zostanie zastosowana od razu.`}
          </Typography>
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

      <SelectAllegroOfferForScheduleModal
        open={pickOfferOpen}
        onClose={() => setPickOfferOpen(false)}
        onSelect={(link) => {
          setPickOfferOpen(false);
          setCreateLink(link);
        }}
      />

      {createLink && (
        <SchedulePriceChangeModal
          open={!!createLink}
          onClose={() => setCreateLink(null)}
          link={createLink}
        />
      )}

      {editedSchedule && (
        <SchedulePriceChangeModal
          open={!!editedSchedule}
          onClose={() => setEditedSchedule(null)}
          link={scheduleToLink(editedSchedule)}
          schedule={editedSchedule}
        />
      )}
    </Stack>
  );
};
