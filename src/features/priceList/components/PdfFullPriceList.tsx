import { Grid } from '@mui/material';

import { Product } from '../types/product';

import { SinglePriceList } from './SinglePriceList';

interface Props {
  products: Product[];
}

export const PdfFullPriceList = ({ products }: Props) => {
  return (
    <Grid container spacing={0} justifyContent="center">
      {products.map((product) => (
        <Grid item key={product.id} width="fit-content">
          <SinglePriceList product={product} />
        </Grid>
      ))}
    </Grid>
  );
};
