import { Grid } from '@mui/material';

import { ProductBarcode } from '../../types';

import { SingleBarcode } from './SingleBarcode';

interface Props {
  barcodes: ProductBarcode[];
}

export const BarcodeList = ({ barcodes }: Props) => {
  return (
    <Grid container spacing={2} justifyContent="center">
      {barcodes.map((barcode) => (
        <Grid item key={barcode.id} xs={3}>
          <SingleBarcode barcode={barcode} />
        </Grid>
      ))}
    </Grid>
  );
};
