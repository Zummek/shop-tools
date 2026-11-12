import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import LinkIcon from '@mui/icons-material/Link';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Box,
  Checkbox,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import { DataGrid, GridColDef, useGridApiRef } from '@mui/x-data-grid';
import { plPL } from '@mui/x-data-grid/locales';
import dayjs from 'dayjs';
import { MouseEvent, useMemo, useRef, useState } from 'react';

import { formatPrice } from '../../products/utils';
import { usePinDataGridColumns } from '../../reports/utils/usePinDataGridColumn';
import type { ChannelPriceSchedule } from '../types/priceSchedules';
import {
  formatPriceScheduleEventLabel,
  formatPriceScheduleNextChange,
  formatPriceScheduleOneOff,
  formatPriceScheduleWindows,
  isPriceScheduleChannelMismatch,
  isPriceScheduleExpectingTemporary,
  isPriceScheduleSnoozed,
} from '../utils';
import {
  NO_PRODUCT_GROUP_KEY,
  priceScheduleGridRows,
  type PriceScheduleGridRow,
  type PriceScheduleProductGroup,
} from '../utils/priceScheduleGroups';

// Product summary starts at temporaryPrice and covers the seven columns
// before the pinned actions column.
const PRODUCT_SUMMARY_SPAN = 7;

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

const statusChip = (schedule: ChannelPriceSchedule) => {
  if (!schedule.isEnabled) {
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
    });

const isScheduleRow = (
  row: GridRow,
): row is Extract<GridRow, { kind: 'schedule' }> => row.kind === 'schedule';

const ScheduleRowActions = ({
  schedule,
  disabled,
  onEdit,
  onHistory,
  onEnable,
  onDisableMenu,
  onDelete,
}: {
  schedule: ChannelPriceSchedule;
  disabled: boolean;
  onEdit: (schedule: ChannelPriceSchedule) => void;
  onHistory: (schedule: ChannelPriceSchedule) => void;
  onEnable: (schedule: ChannelPriceSchedule) => void;
  onDisableMenu: (schedule: ChannelPriceSchedule, anchor: HTMLElement) => void;
  onDelete: (schedule: ChannelPriceSchedule) => void;
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
  disabled = false,
}: Props) => {
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
    onSelectedIdsChange,
  };
  const rows = useMemo<GridRow[]>(
    () =>
      priceScheduleGridRows(groups, collapsedKeys).map((row) => {
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
        return { ...row, selected: selected.has(row.id), busy: disabled };
      }),
    [collapsedKeys, disabled, groups, selected],
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
          if (!isScheduleRow(row)) {
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
          if (!isScheduleRow(params.row)) {
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
          if (!isScheduleRow(params.row))
            return <ProductGroupSummary group={params.row.group} />;
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
        flex: 1.6,
        minWidth: 280,
        sortable: false,
        renderCell: (params) => {
          if (!isScheduleRow(params.row)) return null;
          const schedule = params.row.schedule;
          const weekly = formatPriceScheduleWindows(schedule.windows);
          const oneOffs = schedule.oneOffs ?? [];
          if (!weekly && oneOffs.length === 0) {
            return (
              <Typography variant="body2" color="text.secondary">
                {'—'}
              </Typography>
            );
          }
          return (
            <Stack
              direction="row"
              gap={0.5}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
              sx={{ minWidth: 0, py: 0.5 }}
            >
              {weekly && (
                <Typography variant="body2" sx={{ minWidth: 0 }}>
                  {weekly}
                </Typography>
              )}
              {oneOffs.map((oneOff) => (
                <Chip
                  key={oneOff.id}
                  size="small"
                  variant="outlined"
                  color="info"
                  label={`Jednorazowo ${formatPriceScheduleOneOff(oneOff)}`}
                />
              ))}
            </Stack>
          );
        },
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
        width: 96,
        minWidth: 96,
        sortable: false,
        renderCell: (params) => {
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
        getRowHeight={() => 'auto'}
        getRowClassName={(params) =>
          params.row.kind === 'product' ? 'price-schedule-product-row' : ''
        }
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
