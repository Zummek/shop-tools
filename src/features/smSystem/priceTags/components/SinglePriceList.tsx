import { Box, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';

import { BranchListItem } from '../../branches/api';
import { Product, ProductUnit } from '../../products/types';
import { calcGrossPrice, formatPrice } from '../../products/utils';
import { calcPricePerFullUnit } from '../utils';

interface Props {
  product: Product | null;
  branch: BranchListItem | null;
}

export const SinglePriceList = ({ product, branch }: Props) => {
  const branchNetPrice = product?.branches.find(
    (b) => b.branch.id === branch?.id
  )?.netPrice;
  const branchPrice = calcGrossPrice(branchNetPrice, product?.vat);
  const price = branchPrice ? formatPrice(branchPrice) : 'Brak ceny';

  const formattedPricePerFullUnit = useMemo(() => {
    const fullUnitPrice = calcPricePerFullUnit({
      price: branchPrice || 0,
      productSizeInUnit: product?.unitScaleValue || 0,
      unit: product?.unit || ProductUnit.pc,
      unitScale: product?.unitScale || null,
    });
    return fullUnitPrice
      ? `${formatPrice(fullUnitPrice)} zł/${
          product?.unit === ProductUnit.pc ? 'szt' : product?.unit
        }`
      : '';
  }, [branchPrice, product?.unit, product?.unitScale, product?.unitScaleValue]);

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
            {product.priceTagName}
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
              {formattedPricePerFullUnit}
            </Typography>
          </Stack>
        </Stack>
      )}
    </Box>
  );
};
