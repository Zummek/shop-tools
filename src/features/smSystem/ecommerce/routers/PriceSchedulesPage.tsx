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
  REFRESH_PRICE_SCHEDULE_MAX_IDS,
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
  formatPriceScheduleWindows,
  isPriceScheduleChannelMismatch,
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
    schedule: ChannelPriceSchedule;
    mode: PriceScheduleDisableMode;
    force?: boolean;
  } | null>(null);
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
  const { disablePriceSchedule, isPending: isDisabling } =
    useDisablePriceSchedule();
  const { enablePriceSchedule, isPending: isEnabling } =
    useEnablePriceSchedule();
  const { deletePriceSchedule, isPending: isDeleting } =
    useDeletePriceSchedule();
  const { refreshPriceSchedulePrices, isPending: isRefreshing } =
    useRefreshPriceSchedulePrices();

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
    const { schedule, mode, force } = confirmDisable;
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

  const handleRefreshPrices = async () => {
    const ids =
      selectedIds.length > 0
        ? selectedIds
        : visibleSchedules.map((schedule) => schedule.id);
    if (ids.length === 0) return;
    if (ids.length > REFRESH_PRICE_SCHEDULE_MAX_IDS) {
      notify(
        'error',
        `Można pobrać maksymalnie ${REFRESH_PRICE_SCHEDULE_MAX_IDS} ofert na raz. Zaznacz mniej wierszy.`,
      );
      return;
    }
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
                  params.row.isApplied
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
      headerName: 'Następne okno',
      width: 150,
      valueGetter: (_value, row) =>
        row.isApplied
          ? row.currentWindowEndsAt
            ? `do ${dayjs(row.currentWindowEndsAt).format('DD.MM HH:mm')}`
            : '—'
          : row.nextWindowStartsAt
            ? dayjs(row.nextWindowStartsAt).format('DD.MM HH:mm')
            : '—',
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
              onClick={() => setHistorySchedule(schedule)}
            >
              <HistoryOutlinedIcon fontSize="small" />
            </IconButton>
            <Button size="small" onClick={() => setEditedSchedule(schedule)}>
              {'Edytuj'}
            </Button>
            {schedule.isEnabled ? (
              <Button
                size="small"
                color="error"
                disabled={isDisabling}
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
                  disabled={isEnabling}
                  onClick={() => handleEnable(schedule)}
                >
                  {'Włącz'}
                </Button>
                <IconButton
                  size="small"
                  aria-label="Usuń harmonogram"
                  disabled={isDeleting}
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
        <LoadingButton
          variant="outlined"
          onClick={handleRefreshPrices}
          loading={isRefreshing}
          disabled={visibleSchedules.length === 0}
          sx={{ flexShrink: 0 }}
        >
          {'Pobierz aktualne ceny'}
        </LoadingButton>
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
          disableRowSelectionOnClick
          rowSelectionModel={selectedIds}
          onRowSelectionModelChange={(ids: GridRowSelectionModel) =>
            setSelectedIds(ids as number[])
          }
          getRowClassName={(params) =>
            isPriceScheduleChannelMismatch(params.row)
              ? 'price-schedule-mismatch'
              : ''
          }
          pageSizeOptions={[25]}
          initialState={{
            pagination: { paginationModel: { page: 0, pageSize: 25 } },
          }}
          sx={{
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
            },
            '& .price-schedule-mismatch': {
              backgroundColor: 'warning.light',
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

      <Dialog
        open={!!confirmDisable}
        onClose={() => setConfirmDisable(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{'Wyłączenie harmonogramu'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{disableConfirmText()}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDisable(null)}>{'Anuluj'}</Button>
          <Button
            color="error"
            variant="contained"
            disabled={isDisabling}
            onClick={handleDisable}
          >
            {'Wyłącz'}
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
                        {dayjs(event.createdAt).format('DD.MM.YYYY HH:mm:ss')}
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
