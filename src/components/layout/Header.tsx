import { Button, Stack } from '@mui/material';

export const Header = () => {
  return (
    <Stack spacing={4} direction="row">
      <Button variant="text" href="generate-price-list">
        Generuj cenówki
      </Button>
      <Button variant="text" disabled>
        Generuj kody kreskowe
      </Button>
      <Button variant="text" disabled>
        Konwenter faktur
      </Button>
    </Stack>
  );
};
