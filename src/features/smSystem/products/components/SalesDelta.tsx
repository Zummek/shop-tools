import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Stack, Tooltip, Typography, useTheme } from '@mui/material';

const salesDeltaLabel = (current: number, previous: number): string | null => {
  if (previous === 0) return current > 0 ? 'nowa sprzedaż' : null;
  const delta = ((current - previous) / previous) * 100;
  const rounded = Math.round(delta * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded.toString().replace('.', ',')}%`;
};

const salesPercent = (current: number, previous: number): string | null => {
  if (previous <= 0 || current === previous) return null;
  const delta = ((current - previous) / previous) * 100;
  const rounded = Math.round(delta * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded.toString().replace('.', ',')}%`;
};

type SalesDirection = 'up' | 'down' | 'flat' | 'none';

const salesDirection = (current: number, previous: number): SalesDirection => {
  if (current === 0 && previous === 0) return 'none';
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'flat';
};

export const SalesPeriodFigure = ({
  units,
  previous,
}: {
  units: number;
  previous: number;
}) => {
  const theme = useTheme();
  const direction = salesDirection(units, previous);
  const percent = salesPercent(units, previous);
  const color =
    direction === 'up'
      ? theme.palette.success.main
      : direction === 'down'
        ? theme.palette.error.main
        : theme.palette.text.secondary;
  const Icon =
    direction === 'up'
      ? TrendingUpIcon
      : direction === 'down'
        ? TrendingDownIcon
        : TrendingFlatIcon;
  const tip =
    direction === 'up' && previous === 0
      ? 'Nowa sprzedaż. W poprzednim okresie: 0.'
      : `Poprzedni okres: ${previous} szt.${percent ? `, zmiana ${percent}` : ''}`;

  return (
    <Tooltip
      title={direction === 'none' ? '' : tip}
      disableHoverListener={direction === 'none'}
    >
      <Stack spacing={0} alignItems="flex-end" sx={{ lineHeight: 1.15 }}>
        <Typography variant="body2" fontWeight={600} component="span">
          {units}
        </Typography>
        {direction === 'none' ? null : (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.25}
            sx={{ color }}
          >
            <Icon sx={{ fontSize: 16 }} />
            {percent ? (
              <Typography variant="caption" fontWeight={600} component="span">
                {percent}
              </Typography>
            ) : null}
            <Typography variant="caption" component="span" color="text.secondary">
              {`(${previous})`}
            </Typography>
          </Stack>
        )}
      </Stack>
    </Tooltip>
  );
};

export const SalesDelta = ({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) => {
  const theme = useTheme();
  const label = salesDeltaLabel(current, previous);
  if (label === null) {
    return (
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <TrendingFlatIcon fontSize="small" color="disabled" />
        <Typography variant="body2" color="text.secondary">
          {'—'}
        </Typography>
      </Stack>
    );
  }
  const isUp = current > previous;
  const isDown = current < previous;
  const color = isUp
    ? theme.palette.success.main
    : isDown
      ? theme.palette.error.main
      : theme.palette.text.secondary;
  return (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color }}>
      {isUp ? (
        <TrendingUpIcon fontSize="small" />
      ) : isDown ? (
        <TrendingDownIcon fontSize="small" />
      ) : (
        <TrendingFlatIcon fontSize="small" />
      )}
      <Typography variant="body2" fontWeight={600}>
        {label}
      </Typography>
    </Stack>
  );
};
