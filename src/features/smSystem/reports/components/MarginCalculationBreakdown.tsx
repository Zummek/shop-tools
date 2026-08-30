import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from '@mui/material';

import { formatPrice } from '../../products/utils';
import type { MarginCalculation } from '../api/useGetChannelMarginReport';

const sourceLabel = (source: string) => {
  const map: Record<string, string> = {
    order_line: 'cena z zamówienia',
    pcmarket_line: 'cena z paragonu PC-Market (PozDok.Cena)',
    ksef_last_purchase: 'ostatnia przyjęta FV KSeF',
    invoice_as_of: 'FV przyjęta na dzień sprzedaży',
    invoice_line: 'FV (data faktury, pozycja nieprzyjęta)',
    allegro_billing_suc: 'billing Allegro (prowizja SUC)',
    allegro_billing_smart: 'billing Allegro (Smart HB*)',
    allegro_billing_other: 'billing Allegro (inne opłaty)',
    delivery_group_estimate: 'szacunek z grupy dostawy',
    erli_fee_config: 'konfiguracja % Erli',
    woo_fee_config: 'konfiguracja % Woo / dostawa',
    buyer_delivery: 'dostawa zapłacona przez kupującego',
    nbp_table_a: 'kurs średni NBP tabela A (szacunek ± vs wypłata Allegro)',
    missing: 'brak danych',
    derived: 'wyliczone',
  };
  return map[source] ?? source;
};

interface Props {
  calculation: MarginCalculation;
  currency?: string;
  dense?: boolean;
}

export const MarginCalculationBreakdown = ({
  calculation,
  currency = 'PLN',
  dense = false,
}: Props) => {
  return (
    <Stack spacing={dense ? 0.5 : 1}>
      <Typography variant={dense ? 'caption' : 'body2'} color="text.secondary">
        {calculation.formula}
      </Typography>
      {calculation.components.map((component) => (
        <Stack
          key={component.key}
          direction="row"
          justifyContent="space-between"
          spacing={2}
        >
          <Typography variant={dense ? 'caption' : 'body2'}>
            {component.label}
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
              sx={{ ml: 1 }}
            >
              {`(${sourceLabel(component.source)}${
                component.asOf ? `, ${component.asOf}` : ''
              })`}
            </Typography>
          </Typography>
          <Typography variant={dense ? 'caption' : 'body2'} fontWeight={600}>
            {formatPrice(component.amountCents, currency)}
          </Typography>
        </Stack>
      ))}
      {calculation.notes?.map((note) => (
        <Typography key={note} variant="caption" color="text.secondary">
          {note}
        </Typography>
      ))}
    </Stack>
  );
};

export const HowWeCalculateAccordion = ({
  calculation,
  currency = 'PLN',
}: {
  calculation?: MarginCalculation | null;
  currency?: string;
}) => {
  return (
    <Accordion disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={1} alignItems="center">
          <InfoOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle1">{'Jak liczymy'}</Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1.5}>
          <Typography variant="body2">
            {
              'Raport ma dwie niezależne soczewki: paragony PC-Market oraz kanały e-commerce. Nie sumuj ich — zamówienia e-commerce fiskalizowane w kasie pojawiają się w obu źródłach.'
            }
          </Typography>
          <Typography variant="body2">
            {
              'Marża = przychód + dostawa od kupującego − koszt zakupu − prowizja − koszt dostawy sprzedawcy − inne opłaty. Anulowane zamówienia e-commerce są wykluczone. Sumy są w PLN: pozycje CZK/HUF/EUR przeliczamy kursem średnim NBP (tabela A) z dnia zamówienia. To szacunek ± — rzeczywista wypłata Allegro Finance idzie po EBC + marża, nie po NBP. Allegro bez Smart (HB*): koszt dostawy z grupy dostawy, jeśli ustawiony.'
            }
          </Typography>
          {calculation ? (
            <MarginCalculationBreakdown
              calculation={calculation}
              currency={currency}
            />
          ) : null}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};
