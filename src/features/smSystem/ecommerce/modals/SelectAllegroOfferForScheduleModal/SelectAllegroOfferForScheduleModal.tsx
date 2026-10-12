import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Modal,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

import { modalStyle } from '../../../../../components';
import { formatPrice } from '../../../products/utils';
import { useGetAllegroOffers } from '../../api';
import { ChannelProductLink } from '../../types/channelLinks';
import { PRICE_SCHEDULE_BULK_MAX_IDS } from '../../types/priceSchedules';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (links: ChannelProductLink[]) => void;
  /** Restored when returning from the settings step. */
  initialSelected?: ChannelProductLink[];
}

const scheduledPriceLabel = (count: number) => {
  if (count === 1) return '1 zaplanowana cena';
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return `${count} zaplanowane ceny`;
  return `${count} zaplanowanych cen`;
};

export const SelectAllegroOfferForScheduleModal = ({
  open,
  onClose,
  onConfirm,
  initialSelected = [],
}: Props) => {
  const {
    offers,
    isLoading,
    setQuery,
    page,
    setPage,
    hasNextPage,
    totalCount,
  } = useGetAllegroOffers({ activeOnly: true, enabled: open });

  const [searchInput, setSearchInput] = useState('');
  const [selected, setSelected] = useState<Map<number, ChannelProductLink>>(
    () => new Map(initialSelected.map((link) => [link.id, link])),
  );
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput, setQuery, setPage]);

  const selectableOffers = offers.filter((offer) => offer.price != null);
  const selectedLinks = [...selected.values()];
  const allVisibleSelected =
    selectableOffers.length > 0 &&
    selectableOffers.every((offer) => selected.has(offer.id));

  const toggleOffer = (offer: ChannelProductLink) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(offer.id)) {
        next.delete(offer.id);
        setLimitReached(false);
        return next;
      }
      if (next.size >= PRICE_SCHEDULE_BULK_MAX_IDS) {
        setLimitReached(true);
        return prev;
      }
      next.set(offer.id, offer);
      return next;
    });
  };

  const toggleVisible = () => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (allVisibleSelected) {
        selectableOffers.forEach((offer) => next.delete(offer.id));
        setLimitReached(false);
        return next;
      }
      let hitLimit = false;
      for (const offer of selectableOffers) {
        if (next.has(offer.id)) continue;
        if (next.size >= PRICE_SCHEDULE_BULK_MAX_IDS) {
          hitLimit = true;
          break;
        }
        next.set(offer.id, offer);
      }
      setLimitReached(hitLimit);
      return next;
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Stack
        sx={{
          ...modalStyle({ width: 720 }),
          height: 'min(90vh, 860px)',
          maxHeight: '90vh',
          overflow: 'hidden',
          paddingY: 2.5,
        }}
        spacing={1.25}
      >
        <Stack spacing={0.25}>
          <Typography variant="h5" align="center">
            {'Wybierz oferty Allegro'}
          </Typography>
          <Typography variant="caption" color="text.secondary" align="center">
            {
              'Te same okna dla każdej oferty. Szkic jest nieaktywny, cena bazowa to aktualna cena oferty.'
            }
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            label="Szukaj oferty"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Nazwa, ID oferty, SKU…"
            size="small"
            autoFocus
            sx={{ flex: 1, minWidth: 0 }}
          />
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            {`Wybrano ${selected.size}`}
          </Typography>
          <Button
            size="small"
            disabled={selectableOffers.length === 0 || isLoading}
            onClick={toggleVisible}
            sx={{ flexShrink: 0 }}
          >
            {allVisibleSelected ? 'Odznacz widoczne' : 'Zaznacz widoczne'}
          </Button>
        </Stack>

        {limitReached && (
          <Typography variant="caption" color="warning.main">
            {`Można wybrać najwyżej ${PRICE_SCHEDULE_BULK_MAX_IDS} ofert naraz.`}
          </Typography>
        )}

        {isLoading && offers.length === 0 ? (
          <Box display="flex" justifyContent="center" flex={1} py={4}>
            <CircularProgress size={28} />
          </Box>
        ) : selectableOffers.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ flex: 1, py: 4 }}
          >
            {offers.length > 0
              ? 'Brak ofert z ceną — uruchom synchronizację Allegro.'
              : 'Nie znaleziono aktywnych ofert.'}
          </Typography>
        ) : (
          <List
            dense
            disablePadding
            sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
          >
            {selectableOffers.map((offer) => {
              const checked = selected.has(offer.id);
              return (
                <ListItemButton
                  key={offer.id}
                  selected={checked}
                  onClick={() => toggleOffer(offer)}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 0.5,
                    py: 0.25,
                  }}
                >
                  <Checkbox
                    edge="start"
                    checked={checked}
                    tabIndex={-1}
                    disableRipple
                    size="small"
                    inputProps={{
                      'aria-label': `Zaznacz ${
                        offer.offerName || offer.externalOfferId
                      }`,
                    }}
                    onClick={(event) => event.stopPropagation()}
                    onChange={() => toggleOffer(offer)}
                    sx={{ py: 0.5 }}
                  />
                  <ListItemText
                    primary={offer.offerName || offer.externalOfferId}
                    secondary={
                      <>
                        {offer.priceScheduleCount ? (
                          <Box
                            component="span"
                            sx={{ color: 'warning.dark', fontWeight: 700 }}
                          >
                            {`${scheduledPriceLabel(offer.priceScheduleCount)} · `}
                          </Box>
                        ) : null}
                        {[
                          `Oferta ${offer.externalOfferId}`,
                          offer.marketplace,
                          offer.productName
                            ? `Produkt: ${offer.productName}`
                            : 'Bez dopasowanego produktu',
                          formatPrice(
                            offer.price!,
                            offer.currency || undefined,
                          ),
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </>
                    }
                    primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      noWrap: true,
                    }}
                    sx={{ my: 0 }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          gap={1}
          flexWrap="wrap"
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {totalCount != null
                ? `Strona ${page + 1} · ${totalCount} ofert`
                : `Strona ${page + 1}`}
            </Typography>
            <Button
              size="small"
              disabled={page === 0 || isLoading}
              onClick={() => setPage(page - 1)}
            >
              {'Poprzednia'}
            </Button>
            <Button
              size="small"
              disabled={!hasNextPage || isLoading}
              onClick={() => setPage(page + 1)}
            >
              {'Następna'}
            </Button>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={onClose}>
              {'Anuluj'}
            </Button>
            <Button
              variant="contained"
              disabled={selected.size === 0}
              onClick={() => onConfirm(selectedLinks)}
            >
              {selected.size > 0 ? `Dalej (${selected.size})` : 'Dalej'}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Modal>
  );
};
