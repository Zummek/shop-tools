import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  Modal,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

import { modalStyle } from '../../../../../components';
import { useNotify } from '../../../../../hooks';
import { useBulkAddPriceScheduleOneOffs } from '../../api';
import {
  ChannelPriceSchedule,
  PriceScheduleOneOffBulkResponse,
} from '../../types/priceSchedules';
import { notifyPriceScheduleFailure } from '../../utils';

const wallTime = (value: Dayjs) => value.format('YYYY-MM-DDTHH:mm:ss');
const defaultStart = () =>
  dayjs().add(1, 'day').hour(8).minute(0).second(0).millisecond(0);
const defaultEnd = () => dayjs().add(2, 'day').startOf('day');

interface Props {
  open: boolean;
  schedules: ChannelPriceSchedule[];
  onClose: () => void;
}

export const SchedulePriceOneOffModal = ({
  open,
  schedules,
  onClose,
}: Props) => {
  const { notify } = useNotify();
  const { bulkAddPriceScheduleOneOffs, isPending } =
    useBulkAddPriceScheduleOneOffs();
  const [startsAt, setStartsAt] = useState<Dayjs | null>(defaultStart);
  const [endsAt, setEndsAt] = useState<Dayjs | null>(defaultEnd);
  const [label, setLabel] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [outcome, setOutcome] =
    useState<PriceScheduleOneOffBulkResponse | null>(null);

  useEffect(() => {
    if (!open) return;
    setStartsAt(defaultStart());
    setEndsAt(defaultEnd());
    setLabel('');
    setFormError(null);
    setOutcome(null);
  }, [open]);

  const saved = outcome !== null && outcome.errors.length === 0;

  const offers = useMemo(() => {
    const byLink = new Map<number, string>();
    for (const schedule of schedules) {
      if (!byLink.has(schedule.linkId)) {
        byLink.set(
          schedule.linkId,
          schedule.offerName || schedule.externalOfferId,
        );
      }
    }
    return [...byLink.entries()];
  }, [schedules]);

  const rangeInvalid =
    !startsAt?.isValid() || !endsAt?.isValid() || !endsAt.isAfter(startsAt);

  const handleClose = () => {
    if (isPending) return;
    setOutcome(null);
    setFormError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (rangeInvalid || !startsAt || !endsAt || schedules.length === 0) return;
    setFormError(null);
    setOutcome(null);
    try {
      const result = await bulkAddPriceScheduleOneOffs({
        ids: schedules.map((schedule) => schedule.id),
        startsAt: wallTime(startsAt),
        endsAt: wallTime(endsAt),
        label: label.trim(),
      });
      setOutcome(result);
      if (result.errors.length === 0) {
        const duplicates = result.results.filter((row) => row.duplicate).length;
        const created = result.results.length - duplicates;
        const hasWarnings = result.results.some(
          (row) => row.warnings.length > 0,
        );
        notify(
          'success',
          duplicates > 0 && created === 0
            ? 'To okno było już ustawione na wybranych ofertach.'
            : `Zapisano jednorazowe okno dla ${result.results.length} ${
                result.results.length === 1 ? 'oferty' : 'ofert'
              }.`,
        );
        if (!hasWarnings) {
          setOutcome(null);
          setFormError(null);
          onClose();
        }
      }
    } catch (err) {
      const parsed = notifyPriceScheduleFailure(
        notify,
        err,
        'Nie udało się dodać jednorazowego okna',
      );
      setFormError(parsed.message || 'Nie udało się dodać jednorazowego okna');
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Stack
        sx={{
          ...modalStyle({ width: 640 }),
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        spacing={2.5}
      >
        <Typography variant="h4" align="center">
          {'Jednorazowe okno'}
        </Typography>
        <Alert severity="info">
          {
            'Okno nie ma własnej ceny. W jego trakcie oferta ma cenę okna regularnego, które już się zaczęło albo właśnie trwa. Godziny są wg czasu polskiego.'
          }
        </Alert>
        <Typography variant="body2" color="text.secondary">
          {offers.length === 1
            ? `Oferta: ${offers[0][1]}`
            : `Oferty (${offers.length}): ${offers
                .map(([, name]) => name)
                .join(', ')}`}
        </Typography>
        <DateTimePicker
          label="Początek"
          ampm={false}
          value={startsAt}
          onChange={setStartsAt}
          disabled={isPending}
          slotProps={{ textField: { size: 'small', fullWidth: true } }}
        />
        <DateTimePicker
          label="Koniec"
          ampm={false}
          value={endsAt}
          onChange={setEndsAt}
          disabled={isPending}
          slotProps={{ textField: { size: 'small', fullWidth: true } }}
        />
        <TextField
          size="small"
          label="Nazwa (opcjonalnie)"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          disabled={isPending}
          slotProps={{ htmlInput: { maxLength: 255 } }}
        />
        {rangeInvalid && (
          <Alert severity="warning">
            {'Koniec musi być późniejszy niż początek.'}
          </Alert>
        )}
        {outcome && outcome.errors.length > 0 && (
          <Alert severity="error">
            <Stack spacing={0.5}>
              {outcome.results.length > 0 && (
                <Typography variant="body2">
                  {`Zapisano ${outcome.results.length}. Poniższe oferty pominięto.`}
                </Typography>
              )}
              {outcome.errors.map((error) => (
                <Typography
                  key={`${error.scheduleId ?? ''}-${error.linkId ?? ''}`}
                  variant="body2"
                >
                  {`${error.offerName || `#${error.id}`}: ${error.error}`}
                </Typography>
              ))}
            </Stack>
          </Alert>
        )}
        {saved && (
          <Alert severity="success">
            {'Okno zapisane. Zwróć uwagę na ostrzeżenia poniżej.'}
          </Alert>
        )}
        {outcome && outcome.results.some((row) => row.warnings.length > 0) && (
          <Alert severity="warning">
            <Stack spacing={0.5}>
              {outcome.results.flatMap((row) =>
                row.warnings.map((warning) => (
                  <Typography key={`${row.id}-${warning}`} variant="body2">
                    {`${row.offerName}: ${warning}`}
                  </Typography>
                )),
              )}
            </Stack>
          </Alert>
        )}
        {formError && <Alert severity="error">{formError}</Alert>}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={handleClose} disabled={isPending}>
            {saved ? 'Zamknij' : 'Anuluj'}
          </Button>
          {!saved && (
            <LoadingButton
              variant="contained"
              onClick={handleSubmit}
              loading={isPending}
              disabled={rangeInvalid || schedules.length === 0}
            >
              {'Dodaj okno'}
            </LoadingButton>
          )}
        </Stack>
      </Stack>
    </Modal>
  );
};
