import { Button, Modal, Stack, TextField, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

import { modalStyle } from '../../../../components';
import { formatPrice } from '../../products/utils';
import type { AllegroPriceSimRow } from '../api/useGetAllegroPriceSim';
import {
  buildOfferCalculation,
  parseGrossPlnInput,
  simulateAllegroOffer,
} from '../utils/simulateAllegroOffer';

import { MarginCalculationBreakdown } from './MarginCalculationBreakdown';

interface Props {
  open: boolean;
  onClose: () => void;
  row: AllegroPriceSimRow | null;
  currency: string;
  buyerDeliveryCents: number;
  shippingRate: number;
  targetMargin: number;
  onApplyPrice: (offerId: string, priceGrossCents: number) => Promise<void>;
}

export const AllegroPriceSimOfferModal = ({
  open,
  onClose,
  row,
  currency,
  buyerDeliveryCents,
  shippingRate,
  targetMargin,
  onApplyPrice,
}: Props) => {
  const [whatIf, setWhatIf] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const rowBuyerCents = row?.buyerDeliveryCents ?? buyerDeliveryCents;

  useEffect(() => {
    setWhatIf('');
    setIsApplying(false);
  }, [row?.offerId]);

  const offerCents = row?.offerGrossCents ?? null;

  const currentSim = useMemo(() => {
    if (!row || offerCents == null) return null;
    return simulateAllegroOffer(row, offerCents, {
      buyerDeliveryCents: rowBuyerCents,
      shippingRate,
      targetMargin,
    });
  }, [row, offerCents, rowBuyerCents, shippingRate, targetMargin]);

  const currentCalc = useMemo(() => {
    if (!row || !currentSim || offerCents == null) return null;
    return buildOfferCalculation(row, currentSim, offerCents, rowBuyerCents);
  }, [row, currentSim, offerCents, rowBuyerCents]);

  const whatIfCents = parseGrossPlnInput(whatIf);
  const whatIfSim = useMemo(() => {
    if (!row || whatIfCents == null) return null;
    return simulateAllegroOffer(row, whatIfCents, {
      buyerDeliveryCents: rowBuyerCents,
      shippingRate,
      targetMargin,
    });
  }, [row, whatIfCents, rowBuyerCents, shippingRate, targetMargin]);

  const whatIfCalc = useMemo(() => {
    if (!row || !whatIfSim || whatIfCents == null) return null;
    return buildOfferCalculation(row, whatIfSim, whatIfCents, rowBuyerCents);
  }, [row, whatIfSim, whatIfCents, rowBuyerCents]);

  if (!row) return null;

  const categoryLabel = row.categoryPath.length
    ? row.categoryPath.map((part) => part.name).join(' → ')
    : row.allegroCategoryId || 'brak kategorii';
  const simulatedAtLabel = row.simulatedAt
    ? dayjs(row.simulatedAt).format('DD.MM.YYYY HH:mm')
    : null;

  const close = () => {
    setWhatIf('');
    onClose();
  };

  return (
    <Modal open={open} onClose={close}>
      <Stack sx={modalStyle({ width: 920 })} spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h6">{row.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {`${categoryLabel} · ${(row.commissionRateNet * 100).toFixed(2)}% netto`}
          </Typography>
          {row.simulatedGrossCents != null ? (
            <Typography variant="body2" color="text.secondary">
              {`W tabeli liczymy z symulacji ${formatPrice(row.simulatedGrossCents, currency)}${
                simulatedAtLabel ? ` (wprowadzona ${simulatedAtLabel})` : ''
              }.`}
            </Typography>
          ) : null}
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Stack spacing={1} flex={1}>
            <Typography variant="subtitle2">{'Cena oferty'}</Typography>
            {currentCalc ? (
              <MarginCalculationBreakdown
                calculation={currentCalc}
                currency={currency}
                dense
              />
            ) : (
              <Typography color="text.secondary">
                {'Brak danych do wyliczenia.'}
              </Typography>
            )}
            {currentSim?.markupOnCost != null ? (
              <Typography variant="caption" color="text.secondary">
                {`Narzut od zakupu: ${currentSim.markupOnCost.toFixed(1)}%`}
              </Typography>
            ) : null}
          </Stack>

          <Stack spacing={1} flex={1}>
            <Typography variant="subtitle2">{'A gdybym dał'}</Typography>
            <TextField
              size="small"
              label="Cena brutto"
              value={whatIf}
              onChange={(event) => setWhatIf(event.target.value)}
              placeholder="np. 89.90"
            />
            {whatIfCalc && whatIfSim ? (
              <>
                <MarginCalculationBreakdown
                  calculation={whatIfCalc}
                  currency={currency}
                  dense
                />
                {whatIfSim.markupOnCost != null ? (
                  <Typography variant="caption" color="text.secondary">
                    {`Narzut od zakupu: ${whatIfSim.markupOnCost.toFixed(1)}%`}
                  </Typography>
                ) : null}
                <Button
                  variant="contained"
                  disabled={whatIfCents == null || isApplying}
                  onClick={() => {
                    if (whatIfCents == null) return;
                    setIsApplying(true);
                    void onApplyPrice(row.offerId, whatIfCents)
                      .then(() => {
                        setWhatIf('');
                        onClose();
                      })
                      .finally(() => setIsApplying(false));
                  }}
                >
                  {`Zastosuj ${formatPrice(whatIfCents ?? 0, currency)} w tabeli (tylko symulacja)`}
                </Button>
              </>
            ) : (
              <Typography variant="caption" color="text.secondary">
                {'Wpisz brutto, żeby zobaczyć drugi waterfall.'}
              </Typography>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Modal>
  );
};
