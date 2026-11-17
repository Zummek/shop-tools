import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { formatPrice } from '../../products/utils';
import type {
  ChannelPriceSchedule,
  PriceScheduleUnscheduledOffer,
} from '../types/priceSchedules';

export interface MovePriceScheduleDraft {
  schedules: ChannelPriceSchedule[];
  offers: PriceScheduleUnscheduledOffer[];
  scheduleId: number;
  offerId: number | null;
}

interface Props {
  draft: MovePriceScheduleDraft | null;
  pending?: boolean;
  onClose: () => void;
  onScheduleId: (id: number) => void;
  onOfferId: (id: number) => void;
  onConfirm: () => void;
}

const offerLabel = (offer: PriceScheduleUnscheduledOffer) => {
  const price =
    offer.price != null
      ? formatPrice(offer.price, offer.currency || undefined)
      : '—';
  return `${offer.externalOfferId} · ${price}`;
};

export const MovePriceScheduleDialog = ({
  draft,
  pending = false,
  onClose,
  onScheduleId,
  onOfferId,
  onConfirm,
}: Props) => {
  const schedule =
    draft?.schedules.find((item) => item.id === draft.scheduleId) ?? null;
  const offer =
    draft?.offers.find((item) => item.linkId === draft.offerId) ?? null;
  const basePrice =
    offer?.price != null
      ? formatPrice(offer.price, offer.currency || undefined)
      : '—';
  const priceWillBeCleared =
    schedule?.temporaryPrice != null &&
    offer?.price != null &&
    Number(schedule.temporaryPrice) >= Number(offer.price);
  return (
    <Dialog open={draft != null} onClose={pending ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{'Przenieś harmonogram na nową ofertę'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {draft && draft.schedules.length > 1 && (
            <TextField
              select
              label="Harmonogram"
              value={draft.scheduleId}
              onChange={(event) => onScheduleId(Number(event.target.value))}
              disabled={pending}
            >
              {draft.schedules.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.offerName || item.externalOfferId}
                </MenuItem>
              ))}
            </TextField>
          )}
          {draft && draft.offers.length > 1 && (
            <TextField
              select
              label="Nowa oferta"
              value={draft.offerId ?? ''}
              onChange={(event) => onOfferId(Number(event.target.value))}
              disabled={pending}
            >
              {draft.offers.map((item) => (
                <MenuItem key={item.linkId} value={item.linkId}>
                  {offerLabel(item)}
                </MenuItem>
              ))}
            </TextField>
          )}
          {schedule && offer && (
            <Typography variant="body2">
              {`Harmonogram oferty ${schedule.externalOfferId || schedule.offerName} zostanie przeniesiony na ofertę ${offer.externalOfferId}. Okna zostają. Cena bazowa będzie ceną nowej oferty (${basePrice}). Harmonogram pozostanie wyłączony — włączysz go ręcznie.`}
            </Typography>
          )}
          {schedule && offer && (
            <Alert severity={priceWillBeCleared ? 'warning' : 'info'}>
              {priceWillBeCleared
                ? 'Cena tymczasowa nie jest niższa od ceny bazowej nowej oferty, więc zostanie usunięta. Uzupełnisz ją w edycji przed włączeniem.'
                : 'Cena tymczasowa zostaje bez zmian.'}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={pending}>
          {'Anuluj'}
        </Button>
        <LoadingButton
          variant="contained"
          loading={pending}
          disabled={!schedule || !offer}
          onClick={onConfirm}
        >
          {'Przenieś'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};
