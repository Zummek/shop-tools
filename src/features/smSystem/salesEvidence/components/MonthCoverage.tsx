import { Box, Stack, Tooltip, Typography } from '@mui/material';

import type { DayWithoutDocument, MonthDocument } from '../types';
import { countLabel, formatDay, monthDayStates } from '../utils/format';

interface Props {
  year: number;
  month: number;
  documents: MonthDocument[];
  daysWithoutDocument: DayWithoutDocument[];
  periodFrom: string;
  periodTo: string;
}

const COLORS = {
  covered: 'success.light',
  missing: 'warning.light',
  empty: 'grey.200',
} as const;

const Legend = ({
  color,
  label,
  outlined = false,
}: {
  color: string;
  label: string;
  outlined?: boolean;
}) => (
  <Stack direction="row" spacing={0.5} alignItems="center">
    <Box
      sx={{
        width: 12,
        height: 12,
        borderRadius: 0.5,
        bgcolor: color,
        border: outlined ? '2px solid' : 'none',
        borderColor: 'primary.main',
      }}
    />
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
  </Stack>
);

export const MonthCoverage = ({
  year,
  month,
  documents,
  daysWithoutDocument,
  periodFrom,
  periodTo,
}: Props) => {
  const active = documents.filter((doc) => doc.status !== 'cancelled');
  const ordersByDay = new Map(
    daysWithoutDocument.map((entry) => [entry.day, entry.orders]),
  );
  const states = monthDayStates(year, month, active, [...ordersByDay.keys()]);

  const tooltip = (day: string, state: string) => {
    if (state === 'covered') {
      const doc = active.find(
        (item) => item.periodFrom <= day && day <= item.periodTo,
      );
      return `${formatDay(day)}: w dowodzie ${doc?.number ?? ''}`;
    }
    if (state === 'missing')
      return `${formatDay(day)}: ${countLabel(ordersByDay.get(day) ?? 0, 'opłacone zamówienie', 'opłacone zamówienia', 'opłaconych zamówień')} bez dowodu`;
    return `${formatDay(day)}: brak sprzedaży do ujęcia albo dzień jeszcze się nie skończył`;
  };

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
        {states.map(({ day, state }) => {
          const selected = periodFrom <= day && day <= periodTo;
          return (
            <Tooltip key={day} title={tooltip(day, state)} arrow>
              <Box
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: 0.75,
                  bgcolor: COLORS[state],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  typography: 'caption',
                  outline: selected ? '2px solid' : 'none',
                  outlineColor: 'primary.main',
                  outlineOffset: -2,
                }}
              >
                {Number(day.slice(8, 10))}
              </Box>
            </Tooltip>
          );
        })}
      </Stack>
      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
        <Legend color={COLORS.covered} label="objęte wystawionym dowodem" />
        <Legend color={COLORS.missing} label="sprzedaż bez dowodu" />
        <Legend color={COLORS.empty} label="nic do ujęcia" />
        <Legend color="transparent" outlined label="wybrany okres" />
      </Stack>
    </Stack>
  );
};
