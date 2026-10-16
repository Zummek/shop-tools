import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  Typography,
} from '@mui/material';

const STEPS = [
  'Raz na początku: uzupełnij „Firma i rozliczenia” – dane firmy, oświadczenie o zwolnieniu z kasy i ustawienia uzgodnione z księgową.',
  'Gdy skończy się okres (zwykle miesiąc), wybierz kanał i okres. Każdy kanał ma osobny dowód i numerację, np. DW/ALL/2026/09/1.',
  'Kliknij „Dociągnij dane za okres” – SM pobierze z kanału wpłaty, daty wysyłki, zwroty i informacje o fakturach.',
  'Wyjaśnij pozycje z listy „Do wyjaśnienia” (np. produkt bez stawki VAT, kupon). Każda ma przycisk, który ją naprawia.',
  'Wystaw dowód, pobierz PDF i XLSX, wyślij księgowej i oznacz dowód jako „przekazany do księgowości”.',
  'Raz w miesiącu wyślij też „Zestawienie zbiorcze” – wszystkie kanały w jednym pliku, z kolumnami do JPK.',
];

const FACTS: { title: string; text: string }[] = [
  {
    title: 'Co wchodzi do dowodu',
    text: 'Każda wpłata kupującego, z dniem sprzedaży = wcześniejsza z dat: wpłata albo nadanie paczki. Zwrot pieniędzy pomniejsza dowód okresu, w którym oddałeś pieniądze. Jeśli kupujący zażąda faktury do sprzedaży już ujętej w dowodzie, jej kwota trafi z minusem do kolejnego dowodu.',
  },
  {
    title: 'Co nie wchodzi',
    text: 'Zamówienia z fakturą na firmę (z NIP), pobrania nabijane na kasie, zamówienia oznaczone „paragon wystawiony na kasie”, eksport poza UE i sprzedaż w OSS. Widać je niżej w sekcjach „Na kasie” i „Poza dowodem”.',
  },
  {
    title: 'Faktury',
    text: 'Faktura z NIP zawsze wyłącza zamówienie z dowodu – księgowa rozlicza ją jako fakturę. Faktura dla osoby prywatnej (bez NIP) domyślnie też, ale w „Firma i rozliczenia” możesz ustawić, że zostaje w dowodzie (z uwagą „faktura bez NIP”). Zrób to tylko po uzgodnieniu z księgową, bo inaczej VAT policzy się dwa razy. NIP SM bierze z danych kanału. Gdy kanał błędnie podaje żądanie faktury, w szczegółach zamówienia włącz „Faktury nie wystawiono”.',
  },
  {
    title: 'Jak liczymy VAT',
    text: 'Od kwoty brutto każdej transakcji w danej stawce: VAT = brutto × stawka / (100 + stawka), zaokrąglony do grosza – tak jak na paragonie. Stawka pochodzi z karty produktu. Kwoty w EUR, CZK czy HUF przeliczamy kursem średnim NBP z ostatniego dnia roboczego przed dniem sprzedaży.',
  },
  {
    title: 'Po wystawieniu',
    text: 'Dowód jest zamrożony i ma sumę kontrolną – późniejsza zmiana produktu, stawki czy ustawień go nie zmienia. Gdy dane się zmienią, zobaczysz to w historii. Przed przekazaniem do księgowości anulujesz dowód i wystawiasz go ponownie, po przekazaniu – wystawiasz dowód korygujący.',
  },
];

export const HowItWorks = () => (
  <Accordion variant="outlined" disableGutters>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography fontWeight={500}>{'Jak to działa?'}</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Stack spacing={2}>
        <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
          {STEPS.map((step) => (
            <li key={step}>
              <Typography variant="body2">{step}</Typography>
            </li>
          ))}
        </Box>
        {FACTS.map((fact) => (
          <Box key={fact.title}>
            <Typography variant="subtitle2">{fact.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {fact.text}
            </Typography>
          </Box>
        ))}
      </Stack>
    </AccordionDetails>
  </Accordion>
);
