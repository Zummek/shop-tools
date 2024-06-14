import { Alert, Box, Button, Stack, Typography } from '@mui/material';

import { VisuallyHiddenInput } from '../../../../components/inputs';
import { useAppDispatch, useNotify } from '../../../../hooks';
import { updatePricesAndAddMissingProducts } from '../../store/priceListSlice';
import { readProductsFromCsv } from '../../utils/readProductsFromCsv';

export const UpdatePricesByUploadingFileSection = () => {
  const dispatch = useAppDispatch();
  const { notify } = useNotify();

  const updatePrices = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const products = await readProductsFromCsv(file);

      dispatch(updatePricesAndAddMissingProducts({ products }));
      notify('success', 'Ceny zaktualizowane pomyślnie');
    } catch (error) {
      notify('error', 'Błąd podczas aktualizacji cen');
    }

    event.target.value = '';
  };

  return (
    <Box>
      <Alert severity="info">
        <Stack spacing={1} alignItems="flex-start">
          <Typography variant="body1">{'Aktulizacja cen'}</Typography>
          <Typography variant="caption">
            {
              'Wybierz plik z cenami produktów w formacie .csv tak jak przy pierwszym importowaniu.'
            }
          </Typography>
          <Typography variant="caption">
            {
              'Ceny zostaną zaktualizowane dla produktów, po ich identyfikatorze. Inne kolumny zostaną zignorowane.'
            }
          </Typography>
          <Typography variant="caption">
            {
              'Produkty, dla których nie zostaną znalezione rekody w pliku, nie zostaną zaktualizowane. A produkty, które nie istnieją w aplikacji zostaną dodane do listy.'
            }
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            component="label"
            role={undefined}
            tabIndex={-1}
          >
            {'Aktualizuj ceny'}
            <VisuallyHiddenInput type="file" onChange={updatePrices} />
          </Button>
        </Stack>
      </Alert>
    </Box>
  );
};
