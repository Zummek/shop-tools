import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import LinkIcon from '@mui/icons-material/Link';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { DataGrid, GridColDef, useGridApiRef } from '@mui/x-data-grid';
import { plPL } from '@mui/x-data-grid/locales';
import dayjs from 'dayjs';
import { MouseEvent, useMemo, useRef, useState } from 'react';

import { formatPrice } from '../../products/utils';
import { usePinDataGridColumns } from '../../reports/utils/usePinDataGridColumn';
import type {
  ChannelPriceSchedule,
  PriceScheduleUnscheduledOffer,
} from '../types/priceSchedules';
import {
  formatPriceScheduleEventLabel,
  formatPriceScheduleNextChange,
  formatPriceScheduleOneOff,
  formatPriceScheduleWindow,
  summarizePriceScheduleWindows,
  isPriceScheduleChannelMismatch,
  isPriceScheduleExpectingTemporary,
  isPriceScheduleOfferClosed,
  isPriceScheduleOfferEnded,
  isPriceScheduleSnoozed,
  priceScheduleOfferClosedHint,
} from '../utils';
import {
  foldedUnscheduledOfferLabel,
  isSchedulableUnscheduledOffer,
  NO_PRODUCT_GROUP_KEY,
  priceScheduleGridRows,
  type PriceScheduleGridRow,
  type PriceScheduleProductGroup,
} from '../utils/priceScheduleGroups';

// Product summary starts at temporaryPrice and covers the seven columns
// before the pinned actions column.
const PRODUCT_SUMMARY_SPAN = 7;

const ROW_HEIGHT_BY_KIND: Record<
  PriceScheduleGridRow['kind'],
  number | 'auto'
> = {
  product: 'auto',
  schedule: 72,
  offer: 36,
  endedToggle: 40,
  endedOffer: 36,
};

const scheduleNoun = (count: number) => {
  if (count === 1) return 'harmonogram';
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return 'harmonogramy';
  return 'harmonogramów';
};

const productGroupTitle = (group: PriceScheduleProductGroup) =>
  group.key === NO_PRODUCT_GROUP_KEY
    ? 'Oferty bez przypisanego produktu'
    : group.productName || `Produkt #${group.productId}`;

const WindowsCell = ({ schedule }: { schedule: ChannelPriceSchedule }) => {
  const oneOffs = schedule.oneOffs ?? [];
  const summary = summarizePriceScheduleWindows(schedule.windows);
  if (!summary && oneOffs.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {'—'}
      </Typography>
    );
  }
  const line = summary || `Jednorazowo ${oneOffs.length}`;
  return (
    <Tooltip
      placement="top-start"
      slotProps={{ tooltip: { sx: { maxWidth: 360 } } }}
      title={
        <Stack spacing={0.25} sx={{ py: 0.5 }}>
          {schedule.windows.map((window, index) => (
            <Typography
              key={window.id ?? index}
              variant="caption"
              component="div"
            >
              {formatPriceScheduleWindow(window)}
            </Typography>
          ))}
          {oneOffs.length > 0 && (
            <Typography variant="caption" fontWeight={600} sx={{ mt: 0.5 }}>
              {'Jednorazowe'}
            </Typography>
          )}
          {oneOffs.map((oneOff) => (
            <Typography key={oneOff.id} variant="caption" component="div">
              {formatPriceScheduleOneOff(oneOff)}
            </Typography>
          ))}
        </Stack>
      }
    >
      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
        sx={{ minWidth: 0, width: '100%' }}
      >
        <Typography variant="body2" noWrap sx={{ minWidth: 0 }}>
          {line}
        </Typography>
        {summary && oneOffs.length > 0 && (
          <Chip size="small" variant="outlined" label={oneOffs.length} />
        )}
        <InfoOutlinedIcon fontSize="small" color="action" />
      </Stack>
    </Tooltip>
  );
};

const ProductGroupSummary = ({
  group,
}: {
  group: PriceScheduleProductGroup;
}) => {
  const disabledCount = group.schedules.filter(
    (schedule) => !schedule.isEnabled,
  ).length;
  return (
    <Stack
      direction="row"
      alignItems="center"
      flexWrap="wrap"
      useFlexGap
      gap={0.75}
      sx={{ py: 0.5, width: '100%', minWidth: 0 }}
    >
      <Chip
        size="small"
        variant="outlined"
        label={`${group.schedules.length} ${scheduleNoun(group.schedules.length)}`}
      />
      {disabledCount > 0 && (
        <Chip
          size="small"
          variant="outlined"
          label={`Wyłączone: ${disabledCount}`}
        />
      )}
      {group.appliedCount > 0 && (
        <Chip
          size="small"
          color="success"
          label={`Aktywna zmiana: ${group.appliedCount}`}
        />
      )}
      {group.failingCount > 0 && (
        <Chip
          size="small"
          color="error"
          label={`Błąd: ${group.failingCount}`}
        />
      )}
      {group.nextChangeAt && (
        <Typography variant="caption" color="text.secondary">
          {`Najbliższa zmiana ${dayjs(group.nextChangeAt).format('DD.MM HH:mm')}`}
        </Typography>
      )}
    </Stack>
  );
};

const OfferSubrow = ({
  offer,
  canMove,
  disabled,
  onMove,
}: {
  offer: PriceScheduleUnscheduledOffer;
  canMove: boolean;
  disabled: boolean;
  onMove: () => void;
}) => {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{ minWidth: 0, width: '100%' }}
    >
      <FoldedOfferLine offer={offer} />
      {canMove && (
        <Button
          size="small"
          color="inherit"
          disabled={disabled}
          onClick={onMove}
          sx={{ color: 'text.secondary', flexShrink: 0, py: 0 }}
        >
          {'Przenieś'}
        </Button>
      )}
    </Stack>
  );
};

const unscheduledOfferStatusLabel = (offer: PriceScheduleUnscheduledOffer) => {
  if (isPriceScheduleOfferEnded(offer.offerStatus)) return 'zakończona';
  if (offer.isActive === false) return 'nieaktywna';
  if (offer.price == null) return 'brak ceny';
  return 'bez harmonogramu';
};

const FoldedOfferLine = ({
  offer,
}: {
  offer: PriceScheduleUnscheduledOffer;
}) => {
  const statusLabel = unscheduledOfferStatusLabel(offer);
  const price =
    offer.price != null
      ? formatPrice(offer.price, offer.currency || undefined)
      : '—';
  const label = `Oferta ${offer.externalOfferId} · ${statusLabel} · ${price}`;
  return (
    <Typography
      component="a"
      href={allegroOfferUrl(offer.externalOfferId, offer.marketplace)}
      target="_blank"
      rel="noopener noreferrer"
      variant="body2"
      noWrap
      title={label}
      sx={{ color: 'text.secondary', textDecoration: 'none', pl: 1 }}
    >
      {label}
    </Typography>
  );
};

const statusChip = (schedule: ChannelPriceSchedule) => {
  if (!schedule.isEnabled) {
    if (isPriceScheduleOfferClosed(schedule)) {
      return (
        <Chip
          size="small"
          label={
            isPriceScheduleOfferEnded(schedule.offerStatus)
              ? 'Oferta zakończona'
              : 'Oferta nieaktywna'
          }
          color="warning"
          title={priceScheduleOfferClosedHint(schedule)}
        />
      );
    }
    if (schedule.temporaryPrice == null) {
      return (
        <Chip
          size="small"
          label="Szkic"
          color="default"
          title="Cena tymczasowa nieuzupełniona — harmonogram jest nieaktywny"
        />
      );
    }
    return <Chip size="small" label="Wyłączona" color="default" />;
  }
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

const latestEvent = (schedule: ChannelPriceSchedule) =>
  schedule.events?.[0] ?? null;

type GridRow =
  | (Extract<PriceScheduleGridRow, { kind: 'product' }> & {
      selectedCount: number;
      collapsed: boolean;
      busy: boolean;
    })
  | (Extract<PriceScheduleGridRow, { kind: 'schedule' }> & {
      selected: boolean;
      busy: boolean;
    })
  | (Extract<PriceScheduleGridRow, { kind: 'offer' }> & {
      busy: boolean;
    })
  | (Extract<PriceScheduleGridRow, { kind: 'endedToggle' }> & {
      busy: boolean;
    })
  | (Extract<PriceScheduleGridRow, { kind: 'endedOffer' }> & {
      busy: boolean;
    });

const isScheduleRow = (
  row: GridRow,
): row is Extract<GridRow, { kind: 'schedule' }> => row.kind === 'schedule';

const isProductRow = (
  row: GridRow,
): row is Extract<GridRow, { kind: 'product' }> => row.kind === 'product';

const isOfferRow = (row: GridRow): row is Extract<GridRow, { kind: 'offer' }> =>
  row.kind === 'offer';

const isEndedToggleRow = (
  row: GridRow,
): row is Extract<GridRow, { kind: 'endedToggle' }> =>
  row.kind === 'endedToggle';

const isEndedOfferRow = (
  row: GridRow,
): row is Extract<GridRow, { kind: 'endedOffer' }> => row.kind === 'endedOffer';

const ScheduleRowActions = ({
  schedule,
  disabled,
  onEdit,
  onHistory,
  onEnable,
  onDisableMenu,
  onDelete,
  onMove,
  onCopy,
}: {
  schedule: ChannelPriceSchedule;
  disabled: boolean;
  onEdit: (schedule: ChannelPriceSchedule) => void;
  onHistory: (schedule: ChannelPriceSchedule) => void;
  onEnable: (schedule: ChannelPriceSchedule) => void;
  onDisableMenu: (schedule: ChannelPriceSchedule, anchor: HTMLElement) => void;
  onDelete: (schedule: ChannelPriceSchedule) => void;
  onMove: (schedule: ChannelPriceSchedule) => void;
  onCopy: (schedule: ChannelPriceSchedule) => void;
}) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = () => setAnchor(null);
  return (
    <Stack direction="row" alignItems="center">
      <IconButton
        size="small"
        aria-label="Edytuj"
        title="Edytuj"
        disabled={disabled}
        onClick={() => onEdit(schedule)}
      >
        <EditOutlinedIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        aria-label="Więcej akcji"
        title="Więcej akcji"
        disabled={disabled}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={!!anchor} onClose={close}>
        <MenuItem
          onClick={() => {
            close();
            onHistory(schedule);
          }}
        >
          {'Historia'}
        </MenuItem>
        {schedule.isEnabled ? (
          <MenuItem
            onClick={() => {
              const button = anchor;
              close();
              if (button) onDisableMenu(schedule, button);
            }}
          >
            {'Wyłącz'}
          </MenuItem>
        ) : isPriceScheduleOfferClosed(schedule) ? (
          <Tooltip title={priceScheduleOfferClosedHint(schedule)}>
            <span>
              <MenuItem disabled>{'Włącz'}</MenuItem>
            </span>
          </Tooltip>
        ) : (
          <MenuItem
            onClick={() => {
              close();
              onEnable(schedule);
            }}
          >
            {'Włącz'}
          </MenuItem>
        )}
        {!schedule.isEnabled && (
          <MenuItem
            onClick={() => {
              close();
              onDelete(schedule);
            }}
            sx={{ color: 'error.main' }}
          >
            {'Usuń'}
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            close();
            onCopy(schedule);
          }}
        >
          {'Kopiuj na inny produkt'}
        </MenuItem>
        {(() => {
          const targets = (schedule.productOffersWithoutSchedule ?? []).filter(
            isSchedulableUnscheduledOffer,
          );
          const blocked = schedule.isEnabled || schedule.isApplied;
          const hint = blocked
            ? 'Najpierw wyłącz harmonogram. Przenieść można tylko wyłączony harmonogram bez zastosowanej ceny.'
            : 'Brak aktywnej oferty bez harmonogramu.';
          const item = (
            <MenuItem
              disabled={disabled || blocked || targets.length === 0}
              onClick={() => {
                close();
                onMove(schedule);
              }}
            >
              {'Przenieś na nową ofertę'}
            </MenuItem>
          );
          if (!blocked && targets.length > 0) return item;
          return (
            <Tooltip title={hint}>
              <span>{item}</span>
            </Tooltip>
          );
        })()}
      </Menu>
    </Stack>
  );
};

interface Props {
  groups: PriceScheduleProductGroup[];
  collapsedKeys: ReadonlySet<string>;
  onToggleGroup: (key: string) => void;
  selectedIds: number[];
  onSelectedIdsChange: (ids: number[]) => void;
  onOpenProduct: (productId: number) => void;
  onEdit: (schedule: ChannelPriceSchedule) => void;
  onHistory: (schedule: ChannelPriceSchedule) => void;
  onEnable: (schedule: ChannelPriceSchedule) => void;
  onDisableMenu: (schedule: ChannelPriceSchedule, anchor: HTMLElement) => void;
  onDelete: (schedule: ChannelPriceSchedule) => void;
  onPlanOffer: (
    offer: PriceScheduleUnscheduledOffer,
    neighbor: ChannelPriceSchedule | null,
  ) => void;
  onMoveSchedule: (schedule: ChannelPriceSchedule) => void;
  onMoveOntoOffer: (
    offer: PriceScheduleUnscheduledOffer,
    sources: ChannelPriceSchedule[],
  ) => void;
  onCopySchedule: (schedule: ChannelPriceSchedule) => void;
  showUnscheduledOffers?: boolean;
  disabled?: boolean;
}

export const PriceScheduleProductGroups = ({
  groups,
  collapsedKeys,
  onToggleGroup,
  selectedIds,
  onSelectedIdsChange,
  onOpenProduct,
  onEdit,
  onHistory,
  onEnable,
  onDisableMenu,
  onDelete,
  onPlanOffer,
  onMoveSchedule,
  onMoveOntoOffer,
  onCopySchedule,
  showUnscheduledOffers = true,
  disabled = false,
}: Props) => {
  const [expandedEndedKeys, setExpandedEndedKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const toggleEnded = (key: string) =>
    setExpandedEndedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const apiRef = useGridApiRef();
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;
  const handlersRef = useRef({
    onToggleGroup,
    onOpenProduct,
    onEdit,
    onHistory,
    onEnable,
    onDisableMenu,
    onDelete,
    onPlanOffer,
    onMoveSchedule,
    onMoveOntoOffer,
    onCopySchedule,
    onToggleEnded: toggleEnded,
    onSelectedIdsChange,
  });
  handlersRef.current = {
    onToggleGroup,
    onOpenProduct,
    onEdit,
    onHistory,
    onEnable,
    onDisableMenu,
    onDelete,
    onPlanOffer,
    onMoveSchedule,
    onMoveOntoOffer,
    onCopySchedule,
    onToggleEnded: toggleEnded,
    onSelectedIdsChange,
  };
  const rows = useMemo<GridRow[]>(
    () =>
      priceScheduleGridRows(groups, collapsedKeys, {
        includeUnscheduledOffers: showUnscheduledOffers,
        expandedEndedKeys,
      }).map((row) => {
        if (row.kind === 'product') {
          const selectedCount = row.group.schedules.filter((schedule) =>
            selected.has(schedule.id),
          ).length;
          return {
            ...row,
            selectedCount,
            collapsed: collapsedKeys.has(row.group.key),
            busy: disabled,
          };
        }
        if (row.kind === 'schedule')
          return { ...row, selected: selected.has(row.id), busy: disabled };
        return { ...row, busy: disabled };
      }),
    [
      collapsedKeys,
      disabled,
      expandedEndedKeys,
      groups,
      selected,
      showUnscheduledOffers,
    ],
  );
  usePinDataGridColumns(
    apiRef,
    { left: ['select', 'offerName'], right: ['actions'] },
    rows.length > 0,
  );

  // Column defs stay referentially stable. Cells read handlers and selection
  // from refs, and row data carries collapse and busy state, so resizing a
  // column survives search, selection, and the list refetch.
  const columns = useMemo<GridColDef<GridRow>[]>(() => {
    const setGroupSelection = (
      group: PriceScheduleProductGroup,
      selectAll: boolean,
    ) => {
      const current = selectedIdsRef.current;
      const groupIds = new Set(group.schedules.map((schedule) => schedule.id));
      handlersRef.current.onSelectedIdsChange(
        selectAll
          ? [...current.filter((id) => !groupIds.has(id)), ...groupIds]
          : current.filter((id) => !groupIds.has(id)),
      );
    };
    const toggleSchedule = (id: number) => {
      const current = selectedIdsRef.current;
      handlersRef.current.onSelectedIdsChange(
        current.includes(id)
          ? current.filter((item) => item !== id)
          : [...current, id],
      );
    };
    return [
      {
        field: 'select',
        headerName: '',
        width: 46,
        sortable: false,
        disableColumnMenu: true,
        renderCell: (params) => {
          const row = params.row;
          if (!isProductRow(row) && !isScheduleRow(row)) return null;
          if (isProductRow(row)) {
            const group = row.group;
            const ids = group.schedules.map((schedule) => schedule.id);
            const count = row.selectedCount;
            const title = productGroupTitle(group);
            return (
              <Checkbox
                size="small"
                disabled={row.busy || ids.length === 0}
                checked={ids.length > 0 && count === ids.length}
                indeterminate={count > 0 && count < ids.length}
                onChange={() => setGroupSelection(group, count !== ids.length)}
                inputProps={{ 'aria-label': `Zaznacz ${title}` }}
              />
            );
          }
          const scheduleId = row.id;
          return (
            <Checkbox
              size="small"
              disabled={row.busy}
              checked={row.selected}
              onChange={() => toggleSchedule(scheduleId)}
              inputProps={{ 'aria-label': 'Zaznacz harmonogram' }}
            />
          );
        },
      },
      {
        field: 'offerName',
        headerName: 'Oferta',
        flex: 1.4,
        minWidth: 240,
        sortable: false,
        renderCell: (params) => {
          if (isOfferRow(params.row)) {
            const row = params.row;
            return (
              <OfferSubrow
                offer={row.offer}
                canMove={row.moveSources.length > 0}
                disabled={row.busy}
                onMove={() =>
                  handlersRef.current.onMoveOntoOffer(
                    row.offer,
                    row.moveSources,
                  )
                }
              />
            );
          }
          if (isEndedToggleRow(params.row)) {
            const row = params.row;
            return (
              <Button
                size="small"
                color="inherit"
                startIcon={
                  row.expanded ? (
                    <KeyboardArrowDownIcon fontSize="small" />
                  ) : (
                    <KeyboardArrowRightIcon fontSize="small" />
                  )
                }
                onClick={() => handlersRef.current.onToggleEnded(row.groupKey)}
                sx={{ ml: 1 }}
              >
                {foldedUnscheduledOfferLabel(row.offers)}
              </Button>
            );
          }
          if (isEndedOfferRow(params.row))
            return <FoldedOfferLine offer={params.row.offer} />;
          if (isProductRow(params.row)) {
            const group = params.row.group;
            const title = productGroupTitle(group);
            const collapsed = params.row.collapsed;
            return (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ minWidth: 0, width: '100%' }}
              >
                <IconButton
                  size="small"
                  aria-label={collapsed ? 'Rozwiń grupę' : 'Zwiń grupę'}
                  aria-expanded={!collapsed}
                  onClick={() => handlersRef.current.onToggleGroup(group.key)}
                >
                  {collapsed ? (
                    <KeyboardArrowRightIcon fontSize="small" />
                  ) : (
                    <KeyboardArrowDownIcon fontSize="small" />
                  )}
                </IconButton>
                <Typography
                  variant="subtitle2"
                  noWrap
                  title={title}
                  sx={{ flex: 1, minWidth: 0 }}
                >
                  {title}
                </Typography>
                {group.productId != null && (
                  <IconButton
                    size="small"
                    aria-label="Otwórz produkt"
                    onClick={() =>
                      handlersRef.current.onOpenProduct(
                        group.productId as number,
                      )
                    }
                  >
                    <VisibilityOutlinedIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
            );
          }
          const schedule = params.row.schedule;
          const url = scheduleOfferUrl(schedule);
          return (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ minWidth: 0, width: '100%' }}
            >
              <Stack sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap>
                  {schedule.offerName || '—'}
                </Typography>
                {schedule.externalOfferId ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    title={schedule.externalOfferId}
                  >
                    {schedule.externalOfferId}
                  </Typography>
                ) : null}
              </Stack>
              {url && (
                <IconButton
                  size="small"
                  component="a"
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Otwórz ofertę"
                  onClick={(event: MouseEvent) => event.stopPropagation()}
                >
                  <LinkIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>
          );
        },
      },
      {
        field: 'temporaryPrice',
        headerName: 'Cena tymczasowa',
        width: 150,
        sortable: false,
        colSpan: (_value, row) =>
          row.kind === 'product' ? PRODUCT_SUMMARY_SPAN : 1,
        renderCell: (params) => {
          if (isProductRow(params.row))
            return <ProductGroupSummary group={params.row.group} />;
          if (!isScheduleRow(params.row)) return null;
          const schedule = params.row.schedule;
          return schedule.temporaryPrice == null
            ? '—'
            : formatPrice(schedule.temporaryPrice, schedule.currency);
        },
      },
      {
        field: 'originalPrice',
        headerName: 'Cena bazowa',
        width: 120,
        sortable: false,
        valueGetter: (_value, row) =>
          isScheduleRow(row)
            ? formatPrice(row.schedule.originalPrice, row.schedule.currency)
            : '',
      },
      {
        field: 'linkPrice',
        headerName: 'Cena na kanale',
        width: 200,
        sortable: false,
        renderCell: (params) => {
          if (!isScheduleRow(params.row)) return null;
          const schedule = params.row.schedule;
          const mismatch = isPriceScheduleChannelMismatch(schedule);
          return (
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
              sx={{ minWidth: 0, py: 0.5 }}
            >
              <Typography
                variant="body2"
                noWrap
                title="Ostatnia znana cena na ofercie"
              >
                {schedule.linkPrice != null
                  ? formatPrice(schedule.linkPrice, schedule.currency)
                  : '—'}
              </Typography>
              {mismatch && (
                <Chip
                  size="small"
                  color="warning"
                  label={
                    isPriceScheduleExpectingTemporary(schedule)
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
        flex: 1,
        minWidth: 180,
        sortable: false,
        renderCell: (params) =>
          isScheduleRow(params.row) ? (
            <WindowsCell schedule={params.row.schedule} />
          ) : null,
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 170,
        sortable: false,
        renderCell: (params) =>
          isScheduleRow(params.row) ? statusChip(params.row.schedule) : null,
      },
      {
        field: 'lastEvent',
        headerName: 'Ostatnie zdarzenie',
        flex: 1.2,
        minWidth: 220,
        sortable: false,
        renderCell: (params) => {
          if (!isScheduleRow(params.row)) return null;
          const event = latestEvent(params.row.schedule);
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
              {event.message ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  title={event.message}
                >
                  {event.message}
                </Typography>
              ) : null}
            </Stack>
          );
        },
      },
      {
        field: 'nextWindowStartsAt',
        headerName: 'Następna zmiana',
        width: 160,
        sortable: false,
        renderCell: (params) => {
          if (!isScheduleRow(params.row)) return null;
          const { primary, secondary } = formatPriceScheduleNextChange(
            params.row.schedule,
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
        width: 118,
        minWidth: 118,
        sortable: false,
        renderCell: (params) => {
          if (isOfferRow(params.row)) {
            const { offer, neighbor, busy } = params.row;
            return (
              <Button
                size="small"
                color="primary"
                disabled={busy}
                onClick={() => handlersRef.current.onPlanOffer(offer, neighbor)}
                sx={{ py: 0 }}
              >
                {'Zaplanuj'}
              </Button>
            );
          }
          if (!isScheduleRow(params.row)) return null;
          return (
            <ScheduleRowActions
              schedule={params.row.schedule}
              disabled={params.row.busy}
              onEdit={(schedule) => handlersRef.current.onEdit(schedule)}
              onHistory={(schedule) => handlersRef.current.onHistory(schedule)}
              onEnable={(schedule) => handlersRef.current.onEnable(schedule)}
              onDisableMenu={(schedule, anchor) =>
                handlersRef.current.onDisableMenu(schedule, anchor)
              }
              onDelete={(schedule) => handlersRef.current.onDelete(schedule)}
              onMove={(schedule) =>
                handlersRef.current.onMoveSchedule(schedule)
              }
              onCopy={(schedule) =>
                handlersRef.current.onCopySchedule(schedule)
              }
            />
          );
        },
      },
    ];
  }, []);

  return (
    <Box sx={{ height: 'calc(100vh - 280px)', minHeight: 480 }}>
      <DataGrid
        apiRef={apiRef}
        rows={rows}
        columns={columns}
        hideFooter
        disableColumnFilter
        disableColumnMenu
        disableRowSelectionOnClick
        // The render zone is translated while rows are virtualized, which
        // keeps a sticky product header from staying under the column titles.
        disableVirtualization
        getRowHeight={(params) =>
          ROW_HEIGHT_BY_KIND[(params.model as GridRow).kind]
        }
        getRowClassName={(params) => {
          if (params.row.kind === 'product')
            return 'price-schedule-product-row';
          if (
            params.row.kind === 'endedToggle' ||
            params.row.kind === 'endedOffer'
          )
            return 'price-schedule-ended-row';
          return '';
        }}
        localeText={plPL.components.MuiDataGrid.defaultProps.localeText}
        sx={{
          '& .MuiDataGrid-cell': {
            display: 'flex',
            alignItems: 'center',
            py: 0.5,
            whiteSpace: 'normal',
            lineHeight: 'normal',
          },
          '& .MuiDataGrid-cell--pinnedLeft, & .MuiDataGrid-columnHeader--pinnedLeft, & .MuiDataGrid-cell--pinnedRight, & .MuiDataGrid-columnHeader--pinnedRight':
            {
              backgroundColor: 'var(--DataGrid-pinnedBackground)',
            },
          '& .MuiDataGrid-virtualScroller--hasScrollX .MuiDataGrid-cell--pinnedLeft, & .MuiDataGrid-virtualScroller--hasScrollX .MuiDataGrid-columnHeader--pinnedLeft':
            {
              boxShadow: '4px 0 6px -2px rgba(0, 0, 0, 0.18)',
            },
          '& .MuiDataGrid-virtualScroller--hasScrollX .MuiDataGrid-cell--pinnedRight, & .MuiDataGrid-virtualScroller--hasScrollX .MuiDataGrid-columnHeader--pinnedRight':
            {
              boxShadow: '-4px 0 6px -2px rgba(0, 0, 0, 0.18)',
            },
          '& .MuiDataGrid-virtualScrollerRenderZone': {
            transform: 'none !important',
          },
          '& .price-schedule-product-row': {
            position: 'sticky',
            top: 0,
            // Above horizontally pinned cells (30), below the column headers (40).
            zIndex: 35,
            background: (theme) =>
              `linear-gradient(${theme.palette.action.hover}, ${theme.palette.action.hover}), ${theme.palette.background.paper}`,
            boxShadow: (theme) => `inset 0 -1px 0 ${theme.palette.divider}`,
          },
          '& .price-schedule-product-row .MuiDataGrid-cell--pinnedLeft, & .price-schedule-product-row .MuiDataGrid-cell--pinnedRight':
            {
              zIndex: 36,
              background: (theme) =>
                `linear-gradient(${theme.palette.action.hover}, ${theme.palette.action.hover}), ${theme.palette.background.paper}`,
            },
        }}
      />
    </Box>
  );
};
