import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  IconButton,
  MenuItem,
  Modal,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

import { modalStyle } from '../../../../../components';
import { useNotify } from '../../../../../hooks';
import { formatPrice } from '../../../products/utils';
import {
  ChannelPriceSchedule,
  ChannelProductLink,
  PriceScheduleWindow,
  useCreatePriceSchedule,
  useUpdatePriceSchedule,
} from '../../api';
import { WEEKDAY_LABELS } from '../../utils';

const NIGHTS_PRESET: PriceScheduleWindow[] = [0, 1, 2, 3, 4].map((weekday) => ({
  startWeekday: weekday,
  startTime: '17:00',
  endWeekday: (weekday + 1) % 7,
  endTime: '07:00',
}));

const WEEKEND_PRESET: PriceScheduleWindow[] = [
  { startWeekday: 5, startTime: '00:00', endWeekday: 0, endTime: '07:00' },
];

const NIGHTS_AND_WEEKEND_PRESET: PriceScheduleWindow[] = [
  ...NIGHTS_PRESET,
  ...WEEKEND_PRESET,
];

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

  const { createPriceSchedule, isPending: isCreating } =
    useCreatePriceSchedule();
  const { updatePriceSchedule, isPending: isUpdating } =
    useUpdatePriceSchedule();
  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;
    setApiError(null);
    if (schedule) {
      setPriceInput((schedule.temporaryPrice / 100).toFixed(2));
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

  const updateWindow = (index: number, patch: Partial<PriceScheduleWindow>) => {
    setWindows((prev) =>
      prev.map((w, i) => (i === index ? { ...w, ...patch } : w)),
    );
  };

  const addWindow = () => {
    setWindows((prev) => [
      ...prev,
      { startWeekday: 0, startTime: '17:00', endWeekday: 1, endTime: '07:00' },
    ]);
  };

  const removeWindow = (index: number) => {
    setWindows((prev) => prev.filter((_, i) => i !== index));
  };

  const priceCents = Math.round(parseFloat(priceInput) * 100);
  const originalPriceCents = Math.round(parseFloat(originalPriceInput) * 100);
  const isPriceValid = Number.isFinite(priceCents) && priceCents > 0;
  const isOriginalPriceValid =
    Number.isFinite(originalPriceCents) && originalPriceCents > 0;
  const pricesDiffer = priceCents !== originalPriceCents;
  const canSubmit =
    isPriceValid &&
    isOriginalPriceValid &&
    pricesDiffer &&
    windows.length > 0 &&
    !isPending;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setApiError(null);
    try {
      if (isEdit) {
        await updatePriceSchedule({
          id: schedule.id,
          payload: {
            temporaryPrice: priceCents,
            originalPrice: originalPriceCents,
            windows,
          },
        });
        notify('success', 'Harmonogram ceny zaktualizowany');
      } else {
        await createPriceSchedule({
          linkId: link.id,
          temporaryPrice: priceCents,
          originalPrice: originalPriceCents,
          windows,
        });
        notify('success', 'Harmonogram ceny utworzony');
      }
      onClose();
    } catch (err) {
      const data = err as Record<string, unknown>;
      const windowsError = Array.isArray(data?.windows)
        ? data.windows.join(' ')
        : null;
      const linkError = Array.isArray(data?.linkId)
        ? data.linkId.join(' ')
        : null;
      const originalError = Array.isArray(data?.originalPrice)
        ? data.originalPrice.join(' ')
        : null;
      setApiError(
        windowsError ||
          linkError ||
          originalError ||
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
          type="number"
          value={priceInput}
          onChange={(e) => setPriceInput(e.target.value)}
          inputProps={{ min: 0.01, step: 0.01 }}
          error={priceInput !== '' && !isPriceValid}
          helperText={
            priceInput !== '' && !isPriceValid
              ? 'Podaj dodatnią cenę'
              : 'Cena obowiązująca w aktywnych oknach'
          }
          fullWidth
        />

        <TextField
          label="Cena bazowa (PLN)"
          type="number"
          value={originalPriceInput}
          onChange={(e) => setOriginalPriceInput(e.target.value)}
          inputProps={{ min: 0.01, step: 0.01 }}
          error={
            originalPriceInput !== '' &&
            (!isOriginalPriceValid || !pricesDiffer)
          }
          helperText={
            !isOriginalPriceValid
              ? 'Podaj dodatnią cenę'
              : !pricesDiffer
                ? 'Cena bazowa musi różnić się od tymczasowej'
                : isEdit
                  ? 'Obowiązuje poza oknami. Nowa kwota zostanie ustawiona na ofercie przy następnym powrocie z ceny tymczasowej.'
                  : 'Po zakończeniu okna oferta wraca do tej kwoty. Domyślnie aktualna cena oferty.'
          }
          fullWidth
        />

        <Stack spacing={1.5}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={1}
          >
            <Typography variant="subtitle2" fontWeight={600}>
              {'Okna tygodniowe (cykliczne)'}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button size="small" onClick={() => setWindows(NIGHTS_PRESET)}>
                {'Noce (pn–pt 17:00–07:00)'}
              </Button>
              <Button size="small" onClick={() => setWindows(WEEKEND_PRESET)}>
                {'Weekend (sob 00:00 – pon 07:00)'}
              </Button>
              <Button
                size="small"
                onClick={() => setWindows(NIGHTS_AND_WEEKEND_PRESET)}
              >
                {'Noce + weekend'}
              </Button>
            </Stack>
          </Stack>

          {windows.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              {'Dodaj co najmniej jedno okno albo użyj gotowca.'}
            </Typography>
          )}

          {windows.map((window, index) => (
            <Stack
              key={index}
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              <Select
                size="small"
                value={window.startWeekday}
                onChange={(e) =>
                  updateWindow(index, {
                    startWeekday: Number(e.target.value),
                  })
                }
              >
                {WEEKDAY_LABELS.map((label, weekday) => (
                  <MenuItem key={label} value={weekday}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
              <TextField
                size="small"
                type="time"
                value={window.startTime}
                onChange={(e) =>
                  updateWindow(index, { startTime: e.target.value })
                }
                sx={{ width: 110 }}
              />
              <Typography color="text.secondary">{'→'}</Typography>
              <Select
                size="small"
                value={window.endWeekday}
                onChange={(e) =>
                  updateWindow(index, { endWeekday: Number(e.target.value) })
                }
              >
                {WEEKDAY_LABELS.map((label, weekday) => (
                  <MenuItem key={label} value={weekday}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
              <TextField
                size="small"
                type="time"
                value={window.endTime}
                onChange={(e) =>
                  updateWindow(index, { endTime: e.target.value })
                }
                sx={{ width: 110 }}
              />
              <IconButton
                size="small"
                onClick={() => removeWindow(index)}
                aria-label="Usuń okno"
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}

          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={addWindow}
            sx={{ alignSelf: 'flex-start' }}
          >
            {'Dodaj okno'}
          </Button>
        </Stack>

        {apiError && <Alert severity="error">{apiError}</Alert>}

        {isEdit && schedule.isApplied && (
          <Alert severity="info">
            {
              'Cena tymczasowa jest teraz aktywna — nowa cena tymczasowa od następnego okna, nowa cena bazowa przy następnym powrocie.'
            }
          </Alert>
        )}

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
