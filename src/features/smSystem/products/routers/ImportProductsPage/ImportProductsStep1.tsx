import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { Box, Button, Stack, Typography } from '@mui/material';
import { ChangeEvent } from 'react';

import { VisuallyHiddenInput } from '../../../../../components/inputs';
import { useAppDispatch, useAppSelector } from '../../../../../hooks';
import { clearStateAndSetNewFile } from '../../store';

interface Props {
  onNextStep: () => void;
}

export const ImportProductsStep1 = ({ onNextStep }: Props) => {
  const dispatch = useAppDispatch();

  const selectedFile = useAppSelector(
    (state) => state.smImportProducts.productsFile
  );

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const productsFile = event.target.files?.[0];
    if (!productsFile) return;

    dispatch(clearStateAndSetNewFile({ productsFile }));
  };

  return (
    <Stack spacing={2} maxWidth={800}>
      <Typography variant="h6">{'Jak to działa?'}</Typography>
      <Typography>
        {
          'Po przesłaniu pliku przygotujemy zestawienie przed importem. Będziesz miał(a) wybór np. co zrobić z produkami nie objętymi importem. Produkty identyfikujemy po ich wewnętrznych identyfikatorach (Id) w Twoim systemie.'
        }
      </Typography>
      <Typography>
        {
          'Prosimy załączyć plik z wyeksportowanymi produkatmi z PC-Market o rozszerzeniu .txt. Wymagane kolumny  przy eksporcie to: "Id", "Nazwa", "Kod", "Asortyment", "Cena det.", "VAT %"'
        }
      </Typography>
      <Stack spacing={2} direction="row" alignItems="center" pt={4}>
        <Button
          component="label"
          role={undefined}
          variant="contained"
          tabIndex={-1}
          startIcon={<CloudUploadIcon />}
        >
          {'Wybierz plik'}
          <VisuallyHiddenInput
            type="file"
            onChange={handleFileChange}
            multiple
          />
        </Button>
        {!!selectedFile && (
          <Typography>
            {'Wybrany plik: '}
            {selectedFile.name}
          </Typography>
        )}
      </Stack>
      <Box>
        <Button
          variant="contained"
          disabled={!selectedFile}
          onClick={onNextStep}
        >
          {'Przejdź dalej'}
        </Button>
      </Box>
    </Stack>
  );
};
