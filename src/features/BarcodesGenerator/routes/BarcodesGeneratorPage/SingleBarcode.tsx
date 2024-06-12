import { Box, Stack, Typography } from '@mui/material';
import JsBarcode from 'jsbarcode';
import { useEffect } from 'react';

import { ProductBarcode } from '../../types';

interface SingleBarcodeProps {
  barcode: ProductBarcode;
}

export const SingleBarcode = ({ barcode }: SingleBarcodeProps) => {
  const barcodeId = `ean-${barcode.eanCode}`;

  useEffect(() => {
    JsBarcode(`#${barcodeId}`, barcode.eanCode, {
      format: 'EAN13',
      height: 50,
      width: 1.5,
    });
  }, [barcode.eanCode, barcodeId]);

  return (
    <Box
      sx={{
        border: '1px solid #e0e0e0',
        p: 1,
        maxWidth: '45mm',
        height: '35mm',
      }}
    >
      <Stack
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
        height="100%"
      >
        <Typography variant="body1" lineHeight={1.1} textAlign="center">
          {barcode.name}
        </Typography>
        <svg id={barcodeId}></svg>
      </Stack>
    </Box>
  );
};
