import {
  Box,
  Button,
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

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (link: ChannelProductLink) => void;
}

export const SelectAllegroOfferForScheduleModal = ({
  open,
  onClose,
  onSelect,
}: Props) => {
  const {
    offers,
    isLoading,
    query,
    setQuery,
    page,
    setPage,
    hasNextPage,
    totalCount,
  } = useGetAllegroOffers({ activeOnly: true, enabled: open });

  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(() => {
      setQuery(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(timeout);
  }, [open, searchInput, setQuery, setPage]);

  useEffect(() => {
    if (!open) {
      setSearchInput('');
      setQuery('');
      setPage(0);
    }
  }, [open, setQuery, setPage]);

  const selectableOffers = offers.filter((offer) => offer.price != null);

  return (
    <Modal open={open} onClose={onClose}>
      <Stack
        sx={{
          ...modalStyle({ width: 640 }),
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        spacing={2}
      >
        <Typography variant="h4" align="center">
          {'Wybierz ofertę Allegro'}
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          {
            'Harmonogram ceny tworzony jest dla aktywnej oferty Allegro z zsynchronizowaną ceną.'
          }
        </Typography>

        <TextField
          label="Szukaj oferty"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Nazwa, ID oferty, SKU…"
          fullWidth
          autoFocus
        />

        {isLoading && offers.length === 0 ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={28} />
          </Box>
        ) : selectableOffers.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center">
            {offers.length > 0
              ? 'Brak ofert z ceną — uruchom synchronizację Allegro.'
              : 'Nie znaleziono aktywnych ofert.'}
          </Typography>
        ) : (
          <List dense disablePadding sx={{ maxHeight: 360, overflowY: 'auto' }}>
            {selectableOffers.map((offer) => (
              <ListItemButton
                key={offer.id}
                onClick={() => onSelect(offer)}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemText
                  primary={offer.offerName || offer.externalOfferId}
                  secondary={[
                    `Oferta ${offer.externalOfferId}`,
                    offer.marketplace,
                    offer.productName
                      ? `Produkt: ${offer.productName}`
                      : 'Bez dopasowanego produktu',
                    formatPrice(offer.price!, offer.currency || undefined),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                />
              </ListItemButton>
            ))}
          </List>
        )}

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="caption" color="text.secondary">
            {totalCount != null
              ? `Strona ${page + 1} · ${totalCount} ofert`
              : `Strona ${page + 1}`}
          </Typography>
          <Stack direction="row" spacing={1}>
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
        </Stack>

        <Stack direction="row" justifyContent="flex-end">
          <Button variant="outlined" onClick={onClose}>
            {'Anuluj'}
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
};
