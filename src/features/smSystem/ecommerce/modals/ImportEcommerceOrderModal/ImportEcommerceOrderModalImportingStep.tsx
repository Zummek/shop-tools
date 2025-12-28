import AddIcon from '@mui/icons-material/Add';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';

import { useNotify } from '../../../../../hooks';

export type OnImportFn = ({
  dateFrom,
  dateTo,
}: {
  dateFrom: Dayjs;
  dateTo: Dayjs;
}) => Promise<void>;

interface Props {
  onClose: () => void;
  onImport: OnImportFn;
  isPending: boolean;
}

enum ImportRangeDays {
  lastDay = 1,
  last3Days = 3,
  last7Days = 7,
  last14Days = 14,
  last30Days = 30,
  other = 'custom',
}

export const ImportEcommerceOrderModalImportingStep = ({
  onClose,
  onImport,
  isPending,
}: Props) => {
  const { notify } = useNotify();
  const [selectedRange, setSelectedRange] = useState<ImportRangeDays>(
    ImportRangeDays.lastDay
  );
  const [customDateRange, setCustomDateRange] = useState<{
    from: Dayjs | null;
    to: Dayjs | null;
  }>({
    from: dayjs(),
    to: dayjs().subtract(30, 'day'),
  });

  const handleImportEcommerceOrders = async () => {
    if (selectedRange === ImportRangeDays.other && !customDateRange) {
      notify('error', 'Data początkowa i końcowa są wymagane');
      return;
    }
    if (selectedRange === ImportRangeDays.other) {
      if (!customDateRange.from || !customDateRange.to) {
        notify('error', 'Data początkowa i końcowa są wymagane');
        return;
      }
      if (customDateRange.from.isAfter(customDateRange.to)) {
        notify(
          'error',
          'Data początkowa nie może być późniejsza od daty końcowej'
        );
        return;
      }
      await onImport({
        dateFrom: customDateRange.from
          .set('hour', 0)
          .set('minute', 0)
          .set('second', 0)
          .set('millisecond', 0),
        dateTo: customDateRange.to
          .set('hour', 23)
          .set('minute', 59)
          .set('second', 59)
          .set('millisecond', 999),
      });
    } else {
      await onImport({
        dateFrom: dayjs()
          .subtract(selectedRange as number, 'day')
          .set('hour', 0)
          .set('minute', 0)
          .set('second', 0)
          .set('millisecond', 0),
        dateTo: dayjs(),
      });
    }
  };

  return (
    <Stack spacing={8} alignItems="center">
      <Stack spacing={2} alignItems="center">
        <Typography variant="body1">{'Wybierz zakres dat'}</Typography>
        <RadioGroup
          row
          value={selectedRange}
          onChange={(e) => setSelectedRange(e.target.value as ImportRangeDays)}
        >
          <FormControlLabel
            value={ImportRangeDays.lastDay}
            control={<Radio />}
            label="1 dzien"
            disabled={isPending}
          />
          <FormControlLabel
            value={ImportRangeDays.last3Days}
            control={<Radio />}
            label="3 dni"
            disabled={isPending}
          />
          <FormControlLabel
            value={ImportRangeDays.last7Days}
            control={<Radio />}
            label="7 dni"
            disabled={isPending}
          />
          <FormControlLabel
            value={ImportRangeDays.last14Days}
            control={<Radio />}
            label="14 dni"
            disabled={isPending}
          />
          <FormControlLabel
            value={ImportRangeDays.last30Days}
            control={<Radio />}
            label="30 dni"
            disabled={isPending}
          />
          <FormControlLabel
            value={ImportRangeDays.other}
            control={<Radio />}
            label="inne"
            disabled={isPending}
          />
        </RadioGroup>
        {selectedRange === ImportRangeDays.other && (
          <Stack direction="row" spacing={2}>
            <DatePicker
              label="Data początkowa"
              value={customDateRange.from}
              onChange={(value) =>
                setCustomDateRange({ ...customDateRange, from: value })
              }
              disabled={isPending}
            />
            <DatePicker
              label="Data końcowa"
              value={customDateRange.to}
              onChange={(value) =>
                setCustomDateRange({ ...customDateRange, to: value })
              }
              disabled={isPending}
            />
          </Stack>
        )}
      </Stack>
      <Box display="flex" gap={2}>
        <Button variant="outlined" onClick={onClose}>
          {'Anuluj'}
        </Button>
        <LoadingButton
          variant="contained"
          endIcon={<AddIcon />}
          onClick={handleImportEcommerceOrders}
          loading={isPending}
        >
          {'Zaimportuj'}
        </LoadingButton>
      </Box>
    </Stack>
  );
};
