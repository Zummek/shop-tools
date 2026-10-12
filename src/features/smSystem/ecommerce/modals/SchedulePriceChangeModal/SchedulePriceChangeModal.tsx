import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Modal,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { isAxiosError } from 'axios';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { modalStyle } from '../../../../../components';
import { useNotify } from '../../../../../hooks';
import { formatPrice } from '../../../products/utils';
import {
  ChannelPriceSchedule,
  ChannelProductLink,
  PriceScheduleApplyMode,
  PriceScheduleOriginalApplyMode,
  PriceScheduleWindow,
  useCreatePriceSchedule,
  useUpdatePriceSchedule,
} from '../../api';
import {
  formatPriceScheduleWindows,
  isPriceScheduleWindowValid,
} from '../../utils';
import { PriceScheduleWindowsEditor } from '../PriceScheduleWindowsEditor/PriceScheduleWindowsEditor';

/** Digits with an optional single decimal part, comma or dot. */
const PRICE_INPUT_RE = /^\d+([.,]\d{1,2})?$/;

const parsePriceInput = (value: string): number => {
  const trimmed = value.trim();
  if (!PRICE_INPUT_RE.test(trimmed)) return NaN;
  return Math.round(parseFloat(trimmed.replace(',', '.')) * 100);
};

interface Props {
  open: boolean;
  onClose: () => void;
  link: ChannelProductLink;
  /** Existing schedule → edit mode; otherwise create. */
  schedule?: ChannelPriceSchedule | null;
}

export const SchedulePriceChangeModal = ({
  open,
  onClose,
  link,
  schedule,
}: Props) => {
  const { notify } = useNotify();
  const isEdit = !!schedule;

  const [priceInput, setPriceInput] = useState('');
  const [originalPriceInput, setOriginalPriceInput] = useState('');
  const [windows, setWindows] = useState<PriceScheduleWindow[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [applyMode, setApplyMode] =
    useState<PriceScheduleApplyMode>('apply_now');
  const [originalApplyMode, setOriginalApplyMode] =
    useState<PriceScheduleOriginalApplyMode>('apply_now');

  const { createPriceSchedule, isPending: isCreating } =
    useCreatePriceSchedule();
  const { updatePriceSchedule, isPending: isUpdating } =
    useUpdatePriceSchedule();
  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;
    setApiError(null);
    setApplyMode('apply_now');
    setOriginalApplyMode(schedule?.isApplied ? 'next_revert' : 'apply_now');
    if (schedule) {
      setPriceInput(
        schedule.temporaryPrice != null
          ? (schedule.temporaryPrice / 100).toFixed(2)
          : '',
      );
      setOriginalPriceInput((schedule.originalPrice / 100).toFixed(2));
      setWindows(schedule.windows.map((w) => ({ ...w })));
    } else {
      setPriceInput('');
      setOriginalPriceInput(
        link.price != null ? (link.price / 100).toFixed(2) : '',
      );
      setWindows([]);
    }
  }, [open, schedule, link.price]);

  const priceCents = parsePriceInput(priceInput);
  const originalPriceCents = parsePriceInput(originalPriceInput);
  const isPriceValid = Number.isFinite(priceCents) && priceCents > 0;
  const isOriginalPriceValid =
    Number.isFinite(originalPriceCents) && originalPriceCents > 0;
  const pricesDiffer = priceCents !== originalPriceCents;
  const allWindowsValid = windows.every(isPriceScheduleWindowValid);
  const temporaryPriceChanged =
    !!schedule && isPriceValid && priceCents !== schedule.temporaryPrice;
  const originalPriceChanged =
    !!schedule &&
    isOriginalPriceValid &&
    originalPriceCents !== schedule.originalPrice;
  const showTempApplyOptions =
    isEdit && !!schedule?.isApplied && temporaryPriceChanged;
  const showOriginalApplyOptions = isEdit && originalPriceChanged;
  const originalApplyNowEndsTemp =
    !!schedule?.isApplied &&
    showOriginalApplyOptions &&
    originalApplyMode === 'apply_now';
  const canSubmit =
    isPriceValid &&
    isOriginalPriceValid &&
    pricesDiffer &&
    windows.length > 0 &&
    allWindowsValid &&
    !isPending;
  const showSummary =
    isPriceValid &&
    isOriginalPriceValid &&
    pricesDiffer &&
    windows.length > 0 &&
    allWindowsValid;
  const currency = link.currency || 'PLN';
  const showStaleBaseHint =
    link.price != null &&
    isOriginalPriceValid &&
    link.price !== originalPriceCents &&
    !schedule?.isApplied;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setApiError(null);
    try {
      if (isEdit) {
        const result = await updatePriceSchedule({
          id: schedule.id,
          payload: {
            temporaryPrice: priceCents,
            originalPrice: originalPriceCents,
            windows,
            ...(showTempApplyOptions && !originalApplyNowEndsTemp
              ? { applyMode }
              : {}),
            ...(showOriginalApplyOptions ? { originalApplyMode } : {}),
          },
        });
        if (result.applyPending) {
          notify(
            'warning',
            'Zapisano nową cenę, ale zmiana na ofercie nie powiodła się. Spróbuj ponownie albo poczekaj na następne zastosowanie harmonogramu.',
          );
        } else {
          notify('success', 'Harmonogram ceny zaktualizowany');
        }
      } else {
        const created = await createPriceSchedule({
          linkId: link.id,
          temporaryPrice: priceCents,
          originalPrice: originalPriceCents,
          windows,
        });
        if (created.isInsideWindowNow) {
          notify(
            'info',
            'Harmonogram utworzony — jesteś w aktywnym oknie, cena tymczasowa zmieni się w ciągu minuty',
          );
        } else if (created.nextWindowStartsAt) {
          notify(
            'success',
            `Harmonogram utworzony — najbliższa zmiana ceny: ${dayjs(
              created.nextWindowStartsAt,
            ).format('DD.MM HH:mm')}`,
          );
        } else {
          notify('success', 'Harmonogram ceny utworzony');
        }
      }
      onClose();
    } catch (err) {
      const data = (isAxiosError(err) ? err.response?.data : err) as
        | Record<string, unknown>
        | undefined;
      const windowsError = Array.isArray(data?.windows)
        ? data.windows.join(' ')
        : null;
      const linkError = Array.isArray(data?.linkId)
        ? data.linkId.join(' ')
        : null;
      const originalError = Array.isArray(data?.originalPrice)
        ? data.originalPrice.join(' ')
        : null;
      const applyModeError = Array.isArray(data?.applyMode)
        ? data.applyMode.join(' ')
        : null;
      const originalApplyModeError = Array.isArray(data?.originalApplyMode)
        ? data.originalApplyMode.join(' ')
        : null;
      setApiError(
        windowsError ||
          linkError ||
          originalError ||
          applyModeError ||
          originalApplyModeError ||
          'Nie udało się zapisać harmonogramu',
      );
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Stack
        sx={{
          ...modalStyle({ width: 640 }),
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        spacing={3}
      >
        <Typography variant="h4" align="center">
          {isEdit ? 'Edytuj harmonogram ceny' : 'Zaplanuj zmianę ceny'}
        </Typography>

        <Stack spacing={0.5}>
          <Typography fontWeight={600}>{link.offerName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {`Oferta ${link.externalOfferId}`}
            {link.marketplace ? ` · ${link.marketplace}` : ''}
            {link.price != null
              ? ` · obecna cena: ${formatPrice(
                  link.price,
                  link.currency || undefined,
                )}`
              : ''}
          </Typography>
        </Stack>

        <TextField
          label="Cena tymczasowa (PLN)"
          type="text"
          inputMode="decimal"
          placeholder="np. 79,99"
          value={priceInput}
          onChange={(e) => setPriceInput(e.target.value)}
          error={priceInput !== '' && !isPriceValid}
          helperText={
            priceInput !== '' && !isPriceValid
              ? 'Podaj dodatnią cenę, np. 79,99'
              : 'Cena obowiązująca w aktywnych oknach'
          }
          fullWidth
        />

        {showTempApplyOptions && (
          <FormControl>
            <FormLabel sx={{ fontWeight: 600 }}>
              {'Cena tymczasowa jest teraz na ofercie'}
            </FormLabel>
            <RadioGroup
              value={originalApplyNowEndsTemp ? 'next_window' : applyMode}
              onChange={(e) =>
                setApplyMode(e.target.value as PriceScheduleApplyMode)
              }
            >
              <FormControlLabel
                value="apply_now"
                control={<Radio />}
                disabled={isPending || originalApplyNowEndsTemp}
                label="Zastosuj nową cenę tymczasową na ofercie teraz"
              />
              <FormControlLabel
                value="next_window"
                control={<Radio />}
                disabled={isPending}
                label="Zastosuj od następnego okna — obecna cena zostaje do końca tego okna"
              />
            </RadioGroup>
          </FormControl>
        )}

        <TextField
          label="Cena bazowa (PLN)"
          type="text"
          inputMode="decimal"
          placeholder="np. 99,99"
          value={originalPriceInput}
          onChange={(e) => setOriginalPriceInput(e.target.value)}
          error={
            originalPriceInput !== '' &&
            (!isOriginalPriceValid || !pricesDiffer)
          }
          helperText={
            !isOriginalPriceValid
              ? 'Podaj dodatnią cenę, np. 99,99'
              : !pricesDiffer
                ? 'Cena bazowa musi różnić się od tymczasowej'
                : isEdit
                  ? 'Obowiązuje poza oknami tymczasowej ceny'
                  : 'Po zakończeniu okna oferta wraca do tej kwoty. Domyślnie aktualna cena oferty.'
          }
          fullWidth
        />

        {showStaleBaseHint && (
          <Alert
            severity="warning"
            action={
              <Button
                size="small"
                color="inherit"
                onClick={() =>
                  setOriginalPriceInput(((link.price ?? 0) / 100).toFixed(2))
                }
              >
                {'Ustaw jako bazową'}
              </Button>
            }
          >
            {`Aktualna cena na ofercie to ${formatPrice(
              link.price ?? 0,
              currency,
            )} — różni się od ceny bazowej harmonogramu. Po zakończeniu okna oferta wróci do ceny bazowej.`}
          </Alert>
        )}

        {showOriginalApplyOptions && (
          <FormControl>
            <FormLabel sx={{ fontWeight: 600 }}>
              {schedule?.isApplied
                ? 'Cena tymczasowa jest teraz na ofercie'
                : 'Cena bazowa jest teraz na ofercie'}
            </FormLabel>
            <RadioGroup
              value={originalApplyMode}
              onChange={(e) =>
                setOriginalApplyMode(
                  e.target.value as PriceScheduleOriginalApplyMode,
                )
              }
            >
              <FormControlLabel
                value="apply_now"
                control={<Radio />}
                disabled={isPending}
                label={
                  schedule?.isApplied
                    ? 'Zastosuj nową cenę bazową na ofercie teraz — kończy bieżące okno, cena tymczasowa wróci dopiero przy następnym oknie'
                    : 'Zastosuj nową cenę bazową na ofercie teraz'
                }
              />
              <FormControlLabel
                value="next_revert"
                control={<Radio />}
                disabled={isPending}
                label="Zastosuj przy następnym powrocie z ceny tymczasowej"
              />
            </RadioGroup>
          </FormControl>
        )}

        <PriceScheduleWindowsEditor
          windows={windows}
          onChange={setWindows}
          disabled={isPending}
          active={open}
        />

        {showSummary && (
          <Alert severity="info">
            {`Podsumowanie: cena ${formatPrice(priceCents, currency)} ` +
              `będzie obowiązywać ${formatPriceScheduleWindows(windows)}. ` +
              `Poza oknami oferta wróci do ${formatPrice(
                originalPriceCents,
                currency,
              )}. Godziny wg czasu polskiego.`}
          </Alert>
        )}

        {apiError && <Alert severity="error">{apiError}</Alert>}

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={onClose} disabled={isPending}>
            {'Anuluj'}
          </Button>
          <LoadingButton
            variant="contained"
            onClick={handleSubmit}
            loading={isPending}
            disabled={!canSubmit}
          >
            {isEdit ? 'Zapisz' : 'Utwórz'}
          </LoadingButton>
        </Stack>
      </Stack>
    </Modal>
  );
};
