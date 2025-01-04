import { Button, Stack } from '@mui/material';

import { Pages } from '../../utils/pages';

export const Header = () => {
  return (
    <Stack spacing={4} direction="row">
      <Button variant="text" href={Pages.barcodesGenerator}>
        {'Generuj cenówki'}
      </Button>
      <Button variant="text" href={Pages.generatePriceList}>
        {'Generuj kody kreskowe'}
      </Button>
      <Button variant="text" href={Pages.invoiceConverter}>
        {'Konwenter faktur'}
      </Button>
      <Button variant="text" href={Pages.smSystem}>
        {'SM System'}
      </Button>
    </Stack>
  );
};
