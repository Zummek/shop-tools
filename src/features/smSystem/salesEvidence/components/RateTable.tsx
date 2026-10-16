import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import type { RateBucket } from '../types';
import { formatPln } from '../utils/format';

interface Props {
  buckets: RateBucket[];
  showRows?: boolean;
  emptyText?: string;
}

export const RateTable = ({ buckets, showRows = true, emptyText }: Props) => {
  const total = buckets.reduce(
    (sum, bucket) => ({
      gross: sum.gross + bucket.gross,
      net: sum.net + bucket.net,
      vat: sum.vat + bucket.vat,
      rows: sum.rows + (bucket.rows ?? 0),
    }),
    { gross: 0, net: 0, vat: 0, rows: 0 },
  );

  if (emptyText && total.rows === 0 && total.gross === 0)
    {return (
      <Typography variant="body2" color="text.secondary">
        {emptyText}
      </Typography>
    );}

  return (
    <Table size="small" sx={{ maxWidth: 720 }}>
      <TableHead>
        <TableRow>
          <TableCell>{'Stawka VAT'}</TableCell>
          <TableCell align="right">{'Brutto'}</TableCell>
          <TableCell align="right">{'Netto'}</TableCell>
          <TableCell align="right">{'VAT'}</TableCell>
          {showRows ? <TableCell align="right">{'Wierszy'}</TableCell> : null}
        </TableRow>
      </TableHead>
      <TableBody>
        {buckets.map((bucket) => (
          <TableRow key={bucket.rate}>
            <TableCell>{`${bucket.rate}%`}</TableCell>
            <TableCell align="right">{formatPln(bucket.gross)}</TableCell>
            <TableCell align="right">{formatPln(bucket.net)}</TableCell>
            <TableCell align="right">{formatPln(bucket.vat)}</TableCell>
            {showRows ? (
              <TableCell align="right">{bucket.rows ?? 0}</TableCell>
            ) : null}
          </TableRow>
        ))}
        <TableRow sx={{ '& td': { fontWeight: 600 } }}>
          <TableCell>{'Razem'}</TableCell>
          <TableCell align="right">{formatPln(total.gross)}</TableCell>
          <TableCell align="right">{formatPln(total.net)}</TableCell>
          <TableCell align="right">{formatPln(total.vat)}</TableCell>
          {showRows ? <TableCell align="right">{total.rows}</TableCell> : null}
        </TableRow>
      </TableBody>
    </Table>
  );
};
