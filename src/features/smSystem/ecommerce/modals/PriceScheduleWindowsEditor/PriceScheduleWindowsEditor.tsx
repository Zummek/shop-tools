import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  Alert,
  Button,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

import { PriceScheduleWindow } from '../../types/priceSchedules';
import { WEEKDAY_LABELS, isPriceScheduleWindowValid } from '../../utils';

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
  windows: PriceScheduleWindow[];
  onChange: (windows: PriceScheduleWindow[]) => void;
  disabled?: boolean;
  /** When this flips to true, a leftover "replace windows?" prompt is cleared. */
  active?: boolean;
}

export const PriceScheduleWindowsEditor = ({
  windows,
  onChange,
  disabled = false,
  active = true,
}: Props) => {
  const [pendingPreset, setPendingPreset] = useState<
    PriceScheduleWindow[] | null
  >(null);

  useEffect(() => {
    if (active) setPendingPreset(null);
  }, [active]);

  const updateWindow = (index: number, patch: Partial<PriceScheduleWindow>) => {
    onChange(
      windows.map((window, i) =>
        i === index ? { ...window, ...patch } : window,
      ),
    );
  };

  const addWindow = () => {
    onChange([
      ...windows,
      { startWeekday: 0, startTime: '17:00', endWeekday: 1, endTime: '07:00' },
    ]);
  };

  const removeWindow = (index: number) => {
    onChange(windows.filter((_, i) => i !== index));
  };

  const applyPreset = (preset: PriceScheduleWindow[]) => {
    if (windows.length === 0) onChange(preset);
    else setPendingPreset(preset);
  };

  return (
    <Stack spacing={1.5}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1}
      >
        <Typography variant="subtitle2" fontWeight={600}>
          {'Okna tygodniowe (cykliczne, godziny wg czasu polskiego)'}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            size="small"
            disabled={disabled}
            onClick={() => applyPreset(NIGHTS_PRESET)}
          >
            {'Noce (pn–pt 17:00–07:00)'}
          </Button>
          <Button
            size="small"
            disabled={disabled}
            onClick={() => applyPreset(WEEKEND_PRESET)}
          >
            {'Weekend (sob 00:00 – pon 07:00)'}
          </Button>
          <Button
            size="small"
            disabled={disabled}
            onClick={() => applyPreset(NIGHTS_AND_WEEKEND_PRESET)}
          >
            {'Noce + weekend'}
          </Button>
        </Stack>
      </Stack>

      {pendingPreset && (
        <Alert
          severity="warning"
          action={
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                color="inherit"
                disabled={disabled}
                onClick={() => {
                  onChange(pendingPreset);
                  setPendingPreset(null);
                }}
              >
                {'Zastąp'}
              </Button>
              <Button
                size="small"
                color="inherit"
                disabled={disabled}
                onClick={() => setPendingPreset(null)}
              >
                {'Anuluj'}
              </Button>
            </Stack>
          }
        >
          {`Gotowiec zastąpi obecne okna (${windows.length}).`}
        </Alert>
      )}

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
            disabled={disabled}
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
            disabled={disabled}
            onChange={(e) => updateWindow(index, { startTime: e.target.value })}
            inputProps={{ step: 60 }}
            sx={{ width: 110 }}
          />
          <Typography color="text.secondary">{'→'}</Typography>
          <Select
            size="small"
            value={window.endWeekday}
            disabled={disabled}
            onChange={(e) =>
              updateWindow(index, { endWeekday: Number(e.target.value) })
            }
          >
            {WEEKDAY_LABELS.map((label, weekday) => (
              <MenuItem key={`end-${label}`} value={weekday}>
                {label}
              </MenuItem>
            ))}
          </Select>
          <TextField
            size="small"
            type="time"
            value={window.endTime}
            disabled={disabled}
            onChange={(e) => updateWindow(index, { endTime: e.target.value })}
            inputProps={{ step: 60 }}
            error={!isPriceScheduleWindowValid(window)}
            helperText={
              !isPriceScheduleWindowValid(window)
                ? 'Koniec musi różnić się od startu'
                : undefined
            }
            sx={{ width: 110 }}
          />
          <IconButton
            size="small"
            onClick={() => removeWindow(index)}
            disabled={disabled}
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
        disabled={disabled}
        sx={{ alignSelf: 'flex-start' }}
      >
        {'Dodaj okno'}
      </Button>
    </Stack>
  );
};
