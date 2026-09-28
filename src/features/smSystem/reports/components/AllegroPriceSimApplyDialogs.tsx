import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';

import { formatPrice } from '../../products/utils';
import type { AllegroPriceSimApplyResult } from '../api/useApplyAllegroPriceSim';
import type { AllegroPriceSimRow } from '../api/useGetAllegroPriceSim';
import { allegroOfferHref } from '../utils/allegroOfferUrl';

interface ConfirmProps {
  row: AllegroPriceSimRow | null;
  currency: string;
  isApplying: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const AllegroPriceSimApplyConfirmDialog = ({
  row,
  currency,
  isApplying,
  onClose,
  onConfirm,
}: ConfirmProps) => {
  if (row == null || row.simulatedGrossCents == null) return null;

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{'Wgrać symulację na ofertę Allegro?'}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 0.5 }}>
          <Typography variant="body2">{row.name}</Typography>
          <Typography variant="body2">
            {`Cena oferty w raporcie: ${
              row.offerGrossCents == null
                ? '—'
                : formatPrice(row.offerGrossCents, currency)
            }`}
          </Typography>
          <Typography variant="body2">
            {`Wgrywamy: ${formatPrice(row.simulatedGrossCents, currency)} — od teraz, na żywej ofercie.`}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isApplying}>
          {'Anuluj'}
        </Button>
        <Button variant="contained" onClick={onConfirm} disabled={isApplying}>
          {'Wgraj na Allegro'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface StaleProps {
  result: AllegroPriceSimApplyResult | null;
  currency: string;
  onClose: () => void;
  onRefresh: () => void;
}

const allegroOfferUrl = (result: AllegroPriceSimApplyResult) =>
  allegroOfferHref(result.externalUrl, result.offerId, result.marketplace);

export const AllegroPriceSimApplyStaleDialog = ({
  result,
  currency,
  onClose,
  onRefresh,
}: StaleProps) => {
  if (result == null) return null;
  const offerUrl = allegroOfferUrl(result);

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{'Nie zmieniliśmy ceny'}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 0.5 }}>
          <Alert severity="warning">
            {
              'Cena na Allegro jest inna niż w raporcie. Żeby nie nadpisać nowszej zmiany, nic nie wgraliśmy.'
            }
          </Alert>
          <Typography variant="body2">{result.name}</Typography>
          <Typography variant="body2">
            {`W raporcie: ${
              result.expectedOfferGrossCents == null
                ? '—'
                : formatPrice(result.expectedOfferGrossCents, currency)
            }`}
          </Typography>
          <Typography variant="body2">
            {`Na ofercie teraz: ${
              result.liveOfferGrossCents == null
                ? '—'
                : formatPrice(result.liveOfferGrossCents, currency)
            }`}
          </Typography>
          <Typography variant="body2">
            {`Chcieliśmy wgrać: ${
              result.requestedGrossCents == null
                ? '—'
                : formatPrice(result.requestedGrossCents, currency)
            }`}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        {offerUrl ? (
          <Button href={offerUrl} target="_blank" rel="noopener noreferrer">
            {'Sprawdź ofertę'}
          </Button>
        ) : null}
        <Button
          onClick={() => {
            onRefresh();
            onClose();
          }}
        >
          {'Odśwież raport'}
        </Button>
        <Button variant="contained" onClick={onClose}>
          {'Zamknij'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
