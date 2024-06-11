import { Stack, Typography } from '@mui/material';

import { Product } from '../../types/product';
import { convertNumberToPrice } from '../../utils/price';

interface Props {
  product: Product;
}

export const SinglePriceList = ({ product }: Props) => {
  return (
    <Stack
      key={product.name}
      sx={{
        border: '1px solid #d0d0d0',
        height: '19.5mm',
        minWidth: '40mm',
        maxWidth: '60mm',
        width: 'fit-content',
        px: 1,
      }}
      justifyContent="space-between"
    >
      <Typography variant="body2">{product.name}</Typography>
      <Stack
        direction="row"
        alignItems="flex-end"
        justifyContent="space-between"
        spacing={1}
      >
        <Typography variant="h4" noWrap>
          {convertNumberToPrice(product.price)}
          {'zł'}
        </Typography>
        {product.pricePerFullUnit && (
          <Typography variant="caption" pb={0.5} noWrap>
            {`${convertNumberToPrice(product.pricePerFullUnit)}zł / 1${product.unit}`}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
};
