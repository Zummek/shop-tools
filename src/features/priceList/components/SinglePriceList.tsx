import { Box, Stack, Typography } from '@mui/material';

import { Product } from '../types/product';
import { convertNumberToPrice } from '../utils/price';

interface Props {
  product: Product;
}

export const SinglePriceList = ({ product }: Props) => {
  return (
    <Box
      sx={{
        border: '1px solid #d0d0d0',
        height: '19.5mm',
        width: '45mm',
        maxWidth: '45mm',
        minWidth: '45mm',
        px: 1,
      }}
    >
      <Stack key={product.id} justifyContent="space-between" height="100%">
        <Typography variant="body2" lineHeight={1.1} pt={0.5}>
          {product.name}
        </Typography>
        <Stack
          direction="row"
          alignItems="flex-end"
          justifyContent="space-between"
          spacing={0}
        >
          <Typography noWrap>
            <Typography variant="h4" noWrap fontWeight={600}>
              {convertNumberToPrice(product.price)}
              <span style={{ fontSize: '0.6em', fontWeight: 400 }}>{'zł'}</span>
            </Typography>
          </Typography>
          <Typography variant="caption" pb={0.5} noWrap>
            {`${convertNumberToPrice(product.pricePerFullUnit || 0)}zł/1${product.unit}`}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
};
