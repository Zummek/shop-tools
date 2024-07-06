import { Box, Stack, Typography } from '@mui/material';

import { useAppSelector } from '../../../hooks';
import { Product } from '../types/product';
import { convertNumberToPrice } from '../utils/price';

interface Props {
  product: Product | null;
}

export const SinglePriceList = ({ product }: Props) => {
  const priceType = useAppSelector((state) => state.priceList.priceType);
  const selectedPrice = product?.prices[priceType];
  const price = selectedPrice
    ? convertNumberToPrice(selectedPrice)
    : 'Brak ceny';

  return (
    <Box
      sx={{
        border: '1px solid #d0d0d0',
        height: '14mm',
        width: '43mm',
        maxWidth: '43mm',
        minWidth: '43mm',
        px: 0.75,
        pb: '3mm',
      }}
    >
      {product === null ? (
        <Typography variant="body1" textAlign="center">
          {'Nic do druku'}
        </Typography>
      ) : (
        <Stack key={product.id} justifyContent="space-between" height="100%">
          <Typography variant="body1" lineHeight={1} pt={0.25} fontSize={14}>
            {product.name}
          </Typography>
          <Stack
            direction="row"
            alignItems="flex-end"
            justifyContent="space-between"
            spacing={1}
          >
            <Typography
              variant="h5"
              noWrap
              textOverflow="unset"
              overflow="visible"
              fontWeight={600}
              fontSize={24}
              lineHeight={1.1}
            >
              {price}
              <span style={{ fontSize: '0.6em', fontWeight: 400 }}>{'zł'}</span>
            </Typography>
            <Typography
              variant="caption"
              noWrap
              overflow="visible"
              textOverflow="unset"
              fontSize={12}
              sx={{ bgcolor: 'white' }}
            >
              {`${convertNumberToPrice(product.pricePerFullUnit || 0)}zł/1${product.unit}`}
            </Typography>
          </Stack>
        </Stack>
      )}
    </Box>
  );
};
