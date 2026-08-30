import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { LabelData } from '../../../../../components';
import { useAppSelector, useNotify } from '../../../../../hooks';
import { Pages } from '../../../../../utils';
import {
  ChannelPriceSchedule,
  ChannelProductLink,
  useDisablePriceSchedule,
  useEnablePriceSchedule,
  useGetPriceSchedules,
  useGetProductChannelLinks,
} from '../../../ecommerce/api';
import { SchedulePriceChangeModal } from '../../../ecommerce/modals';
import { isPriceScheduleSnoozed } from '../../../ecommerce/utils';
import { useGetProductDetails } from '../../api';
import { formatPrice } from '../../utils';

const allegroOfferUrl = (offerId: string, marketplace?: string | null) => {
  if (marketplace?.includes('cz'))
    return `https://allegro.cz/oferta/${offerId}`;
  if (marketplace?.includes('sk'))
    return `https://allegro.sk/oferta/${offerId}`;
  if (marketplace?.includes('hu'))
    return `https://allegro.hu/oferta/${offerId}`;
  return `https://allegro.pl/oferta/${offerId}`;
};

const channelOfferUrl = (link: ChannelProductLink) => {
  if (link.externalUrl) return link.externalUrl;
  if (link.channel === 'allegro')
    return allegroOfferUrl(link.externalOfferId, link.marketplace);
  return null;
};

const channelOpenLabel = (channel: string) => {
  if (channel === 'woocommerce') return 'Otwórz w WooCommerce';
  if (channel === 'allegro') return 'Otwórz na Allegro';
  if (channel === 'erli') return 'Otwórz na Erli';
  return 'Otwórz';
};

const channelDisplayName = (channel: string) => {
  if (channel === 'woocommerce') return 'WooCommerce';
  if (channel === 'allegro') return 'Allegro';
  if (channel === 'erli') return 'Erli';
  return channel.toUpperCase();
};

const statusColor = (status?: string | null) => {
  if (!status) return 'default' as const;
  if (status === 'ACTIVE' || status === 'publish' || status === 'active')
    return 'success' as const;
  if (status === 'ENDED' || status === 'draft' || status === 'pending')
    return 'warning' as const;
  return 'default' as const;
};

const isEndedOffer = (link: ChannelProductLink) =>
  link.offerStatus === 'ENDED' ||
  link.offerStatus === 'trash' ||
  link.offerStatus === 'inactive' ||
  !link.isActive;

export const ProductDetailsPage = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.smSystemUser);
  const { productId: rawProductId } = useParams<{ productId: string }>();
  const productId = Number(rawProductId);

  const { product, isLoading } = useGetProductDetails(productId);
  const { channelLinks, isLoading: isLoadingLinks } =
    useGetProductChannelLinks(productId);
  const { schedules } = useGetPriceSchedules({ productId });

  const schedulesByLinkId = useMemo(() => {
    const map = new Map<number, ChannelPriceSchedule[]>();
    for (const schedule of schedules) {
      const list = map.get(schedule.linkId) ?? [];
      list.push(schedule);
      map.set(schedule.linkId, list);
    }
    return map;
  }, [schedules]);

  const { activeLinks, endedLinks } = useMemo(() => {
    const active: ChannelProductLink[] = [];
    const ended: ChannelProductLink[] = [];
    for (const link of channelLinks) {
      if (isEndedOffer(link)) ended.push(link);
      else active.push(link);
    }
    return { activeLinks: active, endedLinks: ended };
  }, [channelLinks]);

  const endedChannelsLabel = useMemo(() => {
    const channels = Array.from(
      new Set(endedLinks.map((link) => channelDisplayName(link.channel))),
    );
    if (channels.length === 0) return 'Zakończone';
    if (channels.length === 1) return `${channels[0]} — zakończone`;
    return 'Kanały — zakończone';
  }, [endedLinks]);

  if (!user?.permissions?.canAccessEcommerce)
    return <Navigate to={Pages.smSystem} replace />;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (!product) {
    return (
      <Stack spacing={2}>
        <Typography>{'Nie znaleziono produktu'}</Typography>
        <Button
          variant="outlined"
          onClick={() => navigate(Pages.smSystemProducts)}
        >
          {'Wróć do listy'}
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
      >
        <Typography variant="subtitle1" component="h1" fontWeight={600} noWrap>
          {product.name}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate(Pages.smSystemProducts)}
          sx={{ flexShrink: 0 }}
        >
          {'Wróć do listy'}
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Stack direction="row" flexWrap="wrap" gap={4}>
          <LabelData label="ID" value={product.id} />
          <LabelData label="SKU / ID wewnętrzne" value={product.internalId} />
          <LabelData
            label="VAT"
            value={product.vat != null ? `${product.vat}%` : '—'}
          />
          <LabelData
            label="Kody EAN"
            value={(product.barcodes || []).join(', ') || '—'}
          />
        </Stack>
      </Paper>

      <Stack spacing={2}>
        <Typography variant="h6">{'Stany i ceny (oddziały)'}</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{'Oddział'}</TableCell>
              <TableCell align="right">{'Stan'}</TableCell>
              <TableCell align="right">{'Cena netto'}</TableCell>
              <TableCell align="right">{'Cena brutto'}</TableCell>
              <TableCell>{'Aktualizacja stanu'}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(product.branches || []).map((branch) => (
              <TableRow key={branch.branch.id}>
                <TableCell>{branch.branch.name}</TableCell>
                <TableCell align="right">{branch.stock}</TableCell>
                <TableCell align="right">
                  {formatPrice(branch.netPrice, 'PLN')}
                </TableCell>
                <TableCell align="right">
                  {formatPrice(branch.grossPrice, 'PLN')}
                </TableCell>
                <TableCell>
                  {branch.stockUpdatedAt
                    ? dayjs(branch.stockUpdatedAt).format('DD.MM.YYYY HH:mm')
                    : '—'}
                </TableCell>
              </TableRow>
            ))}
            {(!product.branches || product.branches.length === 0) && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">
                    {'Brak danych oddziałowych'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h6">{'Kanały e-commerce'}</Typography>

        {isLoadingLinks ? (
          <CircularProgress size={28} />
        ) : channelLinks.length === 0 ? (
          <Typography color="text.secondary">
            {
              'Brak powiązanych ofert. Uzupełnij SKU/EAN w Allegro, WooCommerce lub Erli i uruchom synchronizację.'
            }
          </Typography>
        ) : (
          <Stack spacing={2}>
            {activeLinks.length === 0 && endedLinks.length > 0 && (
              <Typography color="text.secondary">
                {'Brak aktywnych ofert — zakończone poniżej.'}
              </Typography>
            )}
            {activeLinks.map((link) => (
              <ChannelOfferCard
                key={link.id}
                link={link}
                schedules={schedulesByLinkId.get(link.id) ?? []}
              />
            ))}
            {endedLinks.length > 0 && (
              <Accordion
                disableGutters
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>
                    {`${endedChannelsLabel} (${endedLinks.length})`}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    {endedLinks.map((link) => (
                      <ChannelOfferCard
                        key={link.id}
                        link={link}
                        schedules={schedulesByLinkId.get(link.id) ?? []}
                      />
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            )}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
};

interface ChannelOfferCardProps {
  link: ChannelProductLink;
  schedules: ChannelPriceSchedule[];
}

const pickPrimarySchedule = (schedules: ChannelPriceSchedule[]) => {
  const enabled = schedules.filter((s) => s.isEnabled);
  const fromEnabled =
    enabled.find((s) => s.isApplied) ??
    enabled
      .filter((s) => s.nextWindowStartsAt)
      .sort((a, b) =>
        (a.nextWindowStartsAt ?? '').localeCompare(b.nextWindowStartsAt ?? ''),
      )[0] ??
    enabled[0] ??
    null;
  if (fromEnabled) return fromEnabled;
  return (
    [...schedules].filter((s) => !s.isEnabled).sort((a, b) => b.id - a.id)[0] ??
    null
  );
};

const scheduleChipLabel = (schedule: ChannelPriceSchedule) => {
  if (!schedule.isEnabled) return 'Harmonogram wyłączony';
  if (schedule.isApplied && schedule.currentWindowEndsAt) {
    return `Aktywna do ${dayjs(schedule.currentWindowEndsAt).format(
      'DD.MM HH:mm',
    )} → cena bazowa`;
  }
  if (schedule.isApplied) return 'Zmiana ceny aktywna';
  if (isPriceScheduleSnoozed(schedule)) {
    return `Wstrzymana do ${dayjs(schedule.snoozedUntil).format(
      'DD.MM HH:mm',
    )}`;
  }
  if (schedule.nextWindowStartsAt) {
    return `Następna zmiana: ${dayjs(schedule.nextWindowStartsAt).format(
      'DD.MM HH:mm',
    )}`;
  }
  return 'Harmonogram bez nadchodzących okien';
};

const ChannelOfferCard = ({ link, schedules }: ChannelOfferCardProps) => {
  const openUrl = channelOfferUrl(link);
  const { notify } = useNotify();
  const { disablePriceSchedule, isPending: isDisabling } =
    useDisablePriceSchedule();
  const { enablePriceSchedule, isPending: isEnabling } =
    useEnablePriceSchedule();

  const [modalOpen, setModalOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [confirmDisable, setConfirmDisable] = useState<{
    mode: 'revert_now' | 'revert_at_window_end';
    force?: boolean;
  } | null>(null);

  const schedule = pickPrimarySchedule(schedules);
  const canSchedule =
    link.channel === 'allegro' && !isEndedOffer(link) && link.price != null;

  const handleDisable = async () => {
    if (!schedule || !confirmDisable) return;
    setConfirmDisable(null);
    try {
      const result = await disablePriceSchedule({
        id: schedule.id,
        mode: confirmDisable.mode,
        force: confirmDisable.force,
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

  const disableConfirmText = () => {
    if (!schedule || !confirmDisable) return '';
    if (confirmDisable.force)
      return 'Cena na ofercie NIE zostanie zmieniona — użyj tej opcji tylko, gdy oferta nie odpowiada (np. została usunięta). Harmonogram zostanie wyłączony.';
    if (confirmDisable.mode === 'revert_now') {
      return schedule.isApplied
        ? `Oferta od razu wróci do ceny bazowej ${formatPrice(
            schedule.originalPrice,
            schedule.currency,
          )}, a harmonogram zostanie wyłączony.`
        : 'Harmonogram zostanie wyłączony. Cena na ofercie nie ulegnie zmianie.';
    }
    return `Cena tymczasowa będzie obowiązywać do końca bieżącego okna, potem oferta wróci do ${formatPrice(
      schedule.originalPrice,
      schedule.currency,
    )} i harmonogram się wyłączy.`;
  };

  const handleEnable = async () => {
    if (!schedule) return;
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

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        opacity: isEndedOffer(link) ? 0.75 : 1,
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          gap={2}
        >
          <Stack spacing={0.5}>
            <Typography fontWeight={600}>{link.offerName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {`${channelDisplayName(link.channel)} · oferta ${link.externalOfferId}`}
              {link.marketplace ? ` · ${link.marketplace}` : ''}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              label={link.offerStatus || '—'}
              color={statusColor(link.offerStatus)}
            />
            <Chip size="small" label={link.matchType} variant="outlined" />
          </Stack>
        </Stack>

        <Stack direction="row" flexWrap="wrap" gap={3}>
          <LabelData
            label="Cena"
            value={
              link.price != null
                ? formatPrice(link.price, link.currency || undefined)
                : '—'
            }
          />
          <LabelData
            label="Stan"
            value={
              link.stockAvailable != null ? String(link.stockAvailable) : '—'
            }
          />
          <LabelData
            label="Sprzedano"
            value={link.stockSold != null ? String(link.stockSold) : '—'}
          />
          <LabelData
            label="Ostatnia aktualizacja"
            value={
              link.lastSyncedAt
                ? dayjs(link.lastSyncedAt).format('DD.MM.YYYY HH:mm')
                : '—'
            }
          />
        </Stack>

        {schedule && (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
            <Chip
              size="small"
              color={
                !schedule.isEnabled
                  ? 'default'
                  : schedule.consecutiveFailures > 0
                    ? 'error'
                    : schedule.isApplied
                      ? 'success'
                      : isPriceScheduleSnoozed(schedule)
                        ? 'warning'
                        : 'info'
              }
              variant={schedule.isApplied ? 'filled' : 'outlined'}
              label={
                !schedule.isEnabled
                  ? 'Harmonogram wyłączony'
                  : schedule.consecutiveFailures > 0
                    ? 'Błąd zmiany ceny — ponawiam'
                    : schedule.disableAfterRevert
                      ? 'Wyłączanie po zakończeniu okna'
                      : scheduleChipLabel(schedule)
              }
            />
            {schedule.isApplied && (
              <Typography variant="body2" color="text.secondary">
                {`tymczasowa: ${formatPrice(
                  schedule.temporaryPrice,
                  schedule.currency,
                )} · bazowa: ${formatPrice(
                  schedule.originalPrice,
                  schedule.currency,
                )}`}
              </Typography>
            )}
          </Stack>
        )}

        {canSchedule && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              size="small"
              onClick={() => setModalOpen(true)}
              sx={{ alignSelf: 'flex-start' }}
            >
              {schedule ? 'Edytuj harmonogram ceny' : 'Zaplanuj zmianę ceny'}
            </Button>
            {schedule?.isEnabled && (
              <>
                <Button
                  size="small"
                  color="error"
                  onClick={(e) => setMenuAnchor(e.currentTarget)}
                  disabled={isDisabling}
                >
                  {'Wyłącz'}
                </Button>
                <Menu
                  anchorEl={menuAnchor}
                  open={!!menuAnchor}
                  onClose={() => setMenuAnchor(null)}
                >
                  <MenuItem
                    onClick={() => {
                      setConfirmDisable({ mode: 'revert_now' });
                      setMenuAnchor(null);
                    }}
                  >
                    {schedule.isApplied
                      ? 'Wyłącz i przywróć cenę bazową teraz'
                      : 'Wyłącz'}
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setConfirmDisable({ mode: 'revert_at_window_end' });
                      setMenuAnchor(null);
                    }}
                    disabled={!schedule.isApplied}
                  >
                    {'Wyłącz — cena wróci po zakończeniu okna'}
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setConfirmDisable({ mode: 'revert_now', force: true });
                      setMenuAnchor(null);
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
                    <Typography variant="body2">
                      {disableConfirmText()}
                    </Typography>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setConfirmDisable(null)}>
                      {'Anuluj'}
                    </Button>
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
              </>
            )}
            {schedule && !schedule.isEnabled && (
              <Button size="small" onClick={handleEnable} disabled={isEnabling}>
                {'Włącz'}
              </Button>
            )}
          </Stack>
        )}

        {openUrl && (
          <Button
            size="small"
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ alignSelf: 'flex-start' }}
          >
            {channelOpenLabel(link.channel)}
          </Button>
        )}
      </Stack>

      {canSchedule && (
        <SchedulePriceChangeModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          link={link}
          schedule={schedule}
        />
      )}
    </Paper>
  );
};
