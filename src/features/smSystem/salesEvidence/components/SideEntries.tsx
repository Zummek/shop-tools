import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Link,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { Pages } from '../../../../utils';
import type { SideEntry, SideReason } from '../types';
import { formatDay, formatMoney } from '../utils/format';

const REASON_LABELS: Record<SideReason, string> = {
  cod: 'pobranie – paragon na kasie',
  receipt: 'oznaczone „paragon wystawiony na kasie”',
  before_evidence: 'zwrot do sprzedaży sprzed pierwszego dowodu',
  invoice: 'faktura',
  oss: 'sprzedaż do UE w procedurze OSS',
  export: 'eksport poza UE',
  already_issued: 'ujęte w innym dowodzie',
};

const VISIBLE_LIMIT = 300;

interface Props {
  title: string;
  description: string;
  entries: SideEntry[];
}

export const SideEntries = ({ title, description, entries }: Props) => (
  <Accordion variant="outlined" disableGutters>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography fontWeight={500}>{`${title} (${entries.length})`}</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {description}
      </Typography>
      {entries.length === 0 ? (
        <Typography variant="body2">{'Brak takich zamówień w tym okresie.'}</Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{'Zamówienie'}</TableCell>
              <TableCell>{'Data'}</TableCell>
              <TableCell>{'Powód'}</TableCell>
              <TableCell align="right">{'Kwota'}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.slice(0, VISIBLE_LIMIT).map((entry) => (
              <TableRow key={`${entry.kind}-${entry.orderId}-${entry.date}`}>
                <TableCell>
                  <Link
                    href={`#${Pages.smSystemEcommerceOrderDetails.replace(':orderId', String(entry.orderId))}`}
                    target="_blank"
                    rel="noopener"
                  >
                    {entry.orderExternalId}
                  </Link>
                </TableCell>
                <TableCell>{formatDay(entry.date)}</TableCell>
                <TableCell>
                  {entry.reason === 'already_issued' && entry.documentNumber
                    ? `ujęte w dowodzie ${entry.documentNumber}`
                    : (REASON_LABELS[entry.reason] ?? entry.reason)}
                  {entry.invoiceNumber ? ` ${entry.invoiceNumber}` : ''}
                  {entry.kind === 'refund' ? ' (zwrot)' : ''}
                  {entry.country && entry.country !== 'PL' ? ` · ${entry.country}` : ''}
                </TableCell>
                <TableCell align="right">
                  {formatMoney(entry.amount, entry.currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {entries.length > VISIBLE_LIMIT ? (
        <Typography variant="caption" color="text.secondary">
          {`Pokazujemy pierwsze ${VISIBLE_LIMIT}. Pełna lista jest w pliku XLSX wystawionego dowodu.`}
        </Typography>
      ) : null}
    </AccordionDetails>
  </Accordion>
);
