import { Grid } from '@mui/material';

import { BranchListItem } from '../../branches/api';
import { Product } from '../../products/types';

import { SinglePriceList } from './SinglePriceList';

interface Props {
  products: Product[];
  branch: BranchListItem | null;
}

export const PdfFullPriceList = ({ products, branch }: Props) => {
  return (
    <Grid container spacing={0} justifyContent="center">
      {products.map((product) => (
        <Grid item key={product.id} width="fit-content">
          <SinglePriceList product={product} branch={branch} />
        </Grid>
      ))}
    </Grid>
  );
};
