import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';

import { VisuallyHiddenInput } from '../../../../components/inputs/VisuallyHiddenInput';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { setProducts } from '../../store/priceListSlice';
import { readProductsFromCsv } from '../../utils/readProductsFromCsv';

export const UploadFileSection = () => {
  const fileName = useAppSelector((state) => state.priceList.fileName);
  const dispatch = useAppDispatch();

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    dispatch(
      setProducts({
        fileName: file.name,
        products: await readProductsFromCsv(file),
      })
    );
  };

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        <Stack>
          <Typography variant="body1">
            {'Wybierz plik z cenami produktów w formacie .csv'}
          </Typography>
          <Typography variant="caption">
            {'Pierwsze dwie linie są pomijane z względu na nagłóweki'}
          </Typography>
          <Typography variant="caption">
            {'Kolumny: Id, Nazwa, Cena ew.,	Cena det.,	Cena hurt.,	Cena noc'}
          </Typography>
          <Typography variant="caption">{'Separator: tabulator'}</Typography>
        </Stack>
      </Alert>
      <Box display="flex" justifyContent="center">
        <Button
          variant={fileName ? 'outlined' : 'contained'}
          color="primary"
          component="label"
          role={undefined}
          tabIndex={-1}
          startIcon={<CloudUploadIcon />}
          sx={{ whiteSpace: 'nowrap' }}
        >
          {fileName ? 'Zmień plik' : 'Wybierz plik'}
          <VisuallyHiddenInput type="file" onChange={onFileChange} />
        </Button>
      </Box>
      {fileName && (
        <Typography variant="body1">
          {'Wybrany plik: '}
          {fileName}
        </Typography>
      )}
    </Stack>
  );
};
