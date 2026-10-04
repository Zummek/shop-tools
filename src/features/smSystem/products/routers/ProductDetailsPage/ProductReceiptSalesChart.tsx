import {
  Box,
  CircularProgress,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import dayjs from 'dayjs';
import { useMemo } from 'react';

import { useGetProductHistory } from '../../api';
import {
  buildReceiptSalesSeries,
  formatSaleQuantity,
  RECEIPT_SALES_DAYS,
} from '../../utils/receiptSalesSeries';

const CHART_HEIGHT = 148;

export const ProductReceiptSalesChart = ({
  productId,
}: {
  productId: number;
}) => {
  const theme = useTheme();
  const { history, isLoading, isError } = useGetProductHistory(
    productId,
    RECEIPT_SALES_DAYS,
  );
  const series = useMemo(
    () => buildReceiptSalesSeries(history?.salesDaily ?? []),
    [history],
  );
  const tickEvery = Math.ceil(series.dates.length / 6);

  return (
    <Stack spacing={0.5} sx={{ minWidth: 0, width: '100%' }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="baseline"
        gap={1}
      >
        <Typography variant="subtitle2" color="text.secondary" fontWeight={500}>
          {'Sprzedaż z paragonów'}
        </Typography>
        <Typography variant="body2" fontWeight={600} sx={{ flexShrink: 0 }}>
          {isLoading || isError
            ? `${RECEIPT_SALES_DAYS} dni`
            : `${formatSaleQuantity(series.total)} szt. / ${RECEIPT_SALES_DAYS} dni`}
        </Typography>
      </Stack>
      {isError ? (
        <Box display="flex" alignItems="center" height={CHART_HEIGHT}>
          <Typography variant="body2" color="error">
            {'Nie udało się pobrać sprzedaży'}
          </Typography>
        </Box>
      ) : isLoading || !history ? (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          height={CHART_HEIGHT}
        >
          <CircularProgress size={22} />
        </Box>
      ) : (
        <LineChart
          height={CHART_HEIGHT}
          tooltip={{ trigger: 'axis' }}
          grid={{ horizontal: true }}
          xAxis={[
            {
              data: series.dates,
              scaleType: 'point',
              tickLabelStyle: { fontSize: 11 },
              tickLabelInterval: (_value, index) => index % tickEvery === 0,
              valueFormatter: (value: string, context) =>
                dayjs(value).format(
                  context.location === 'tick' ? 'DD.MM' : 'DD.MM.YYYY',
                ),
            },
          ]}
          yAxis={[
            {
              tickLabelStyle: { fontSize: 11 },
              valueFormatter: (value: number | null) =>
                formatSaleQuantity(value ?? 0),
            },
          ]}
          series={[
            {
              data: series.quantities,
              label: 'Sztuki',
              showMark: false,
              area: true,
              color: theme.palette.primary.main,
              valueFormatter: (value: number | null) =>
                `${formatSaleQuantity(value ?? 0)} szt.`,
            },
          ]}
          margin={{ top: 8, right: 8, bottom: 24, left: 40 }}
          slotProps={{ legend: { hidden: true } }}
        />
      )}
    </Stack>
  );
};
