import AddIcon from '@mui/icons-material/Add';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { MouseEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { useAppSelector, useNotify } from '../../../../hooks';
import { Pages } from '../../../../utils';
import { formatPrice } from '../../products/utils';
import {
  ChannelPriceSchedule,
  ChannelProductLink,
  PriceScheduleEvent,
  useDisablePriceSchedule,
  useGetPriceSchedules,
} from '../api';
import {
  SchedulePriceChangeModal,
  SelectAllegroOfferForScheduleModal,
} from '../modals';
import {
  formatPriceScheduleEventLabel,
  formatPriceScheduleWindows,
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
  price: schedule.originalPrice,
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
  const { schedules, isLoading } = useGetPriceSchedules();
  const { disablePriceSchedule, isPending: isDisabling } =
    useDisablePriceSchedule();

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

  if (!user?.permissions?.canAccessEcommerce)
    return <Navigate to={Pages.smSystem} replace />;

  const handleDisable = async (mode: 'revert_now' | 'revert_at_window_end') => {
    const schedule = menuState?.schedule;
    setMenuState(null);
    if (!schedule) return;
    try {
      const result = await disablePriceSchedule({ id: schedule.id, mode });
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
          ? null
          : row.nextWindowStartsAt
            ? dayjs(row.nextWindowStartsAt).format('DD.MM HH:mm')
            : '—',
    },
    {
      field: 'actions',
      headerName: '',
      width: 230,
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
            {schedule.isEnabled && (
              <>
                <Button
                  size="small"
                  onClick={() => setEditedSchedule(schedule)}
                >
                  {'Edytuj'}
                </Button>
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

      {isLoading && schedules.length === 0 ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress size={28} />
        </Box>
      ) : schedules.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {'Brak harmonogramów cenowych.'}
        </Typography>
      ) : (
        <DataGrid
          rows={schedules}
          columns={columns}
          loading={isLoading}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[25]}
          initialState={{
            pagination: { paginationModel: { page: 0, pageSize: 25 } },
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
        <MenuItem onClick={() => handleDisable('revert_now')}>
          {'Wyłącz i przywróć cenę bazową teraz'}
        </MenuItem>
        <MenuItem
          onClick={() => handleDisable('revert_at_window_end')}
          disabled={!menuState?.schedule.isApplied}
        >
          {'Wyłącz — cena wróci po zakończeniu okna'}
        </MenuItem>
      </Menu>

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
