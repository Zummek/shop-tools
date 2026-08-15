import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, Stack, Tooltip, Typography } from '@mui/material';

import {
  criticalStockDays,
  StockUrgencyThresholds,
  warningStockDays,
} from '../utils/stockUrgency';

interface Props {
  thresholds: StockUrgencyThresholds;
}

const Swatch = ({ color }: { color: string }) => (
  <Box
    sx={{
      width: 12,
      height: 12,
      borderRadius: 0.5,
      backgroundColor: color,
      flexShrink: 0,
    }}
  />
);

export const StockUrgencyLegend = ({ thresholds }: Props) => {
  const critical = criticalStockDays(thresholds);
  const warning = warningStockDays(thresholds);

  const tooltip = [
    'Kolory oznaczają, jak pilny jest stan magazynowy (kolumna „Stan starczy na”).',
    `Czerwony: poniżej ${critical} dni (czas dostawy ${thresholds.leadTimeDays} + zapas ${thresholds.safetyDays}).`,
    `Pomarańczowy: poniżej ${warning} dni (powyżej + okres przeglądu ${thresholds.reviewPeriodDays}).`,
    'Na liście produktów używany jest najniższy stan wśród sklepów.',
  ].join(' ');

  return (
    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Typography variant="caption" color="text.secondary">
          {'Pilność stanu:'}
        </Typography>
        <Tooltip title={tooltip}>
          <InfoOutlinedIcon
            fontSize="small"
            color="action"
            sx={{ cursor: 'help', fontSize: 16 }}
          />
        </Tooltip>
      </Stack>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Swatch color="rgba(211, 47, 47, 0.35)" />
        <Typography variant="caption" color="text.secondary">
          {`krytyczny (< ${critical} dni)`}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Swatch color="rgba(237, 108, 2, 0.35)" />
        <Typography variant="caption" color="text.secondary">
          {`ostrzeżenie (< ${warning} dni)`}
        </Typography>
      </Stack>
    </Stack>
  );
};
