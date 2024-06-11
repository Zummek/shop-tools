import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { Alert, Button, Stack, Typography } from '@mui/material';

import { VisuallyHiddenInput } from '../../../../components/inputs/VisuallyHiddenInput';
import { useAppDispatch, useAppSelector } from '../../../../hooks/store';
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
      <Stack spacing={4} direction="row" alignItems="center">
        <Button
          variant="contained"
          color="primary"
          component="label"
          role={undefined}
          tabIndex={-1}
          startIcon={<CloudUploadIcon />}
        >
          {'Wybierz plik'}
          <VisuallyHiddenInput type="file" onChange={onFileChange} />
        </Button>
        {fileName && (
          <Typography variant="body1">
            {'Wybrany plik: '}
            {fileName}
          </Typography>
        )}
      </Stack>
      <Alert severity="info">
        <Stack>
          <Typography variant="body1">
            {'Wybierz plik z cenami produktów w formacie .csv'}
          </Typography>
          <Typography variant="body2">
            {'Pierwsze dwie linie są pomijane z względu na nagłóweki'}
          </Typography>
          <Typography variant="body2">{'Kolumny: nazwa, cena noc.'}</Typography>
          <Typography variant="body2">{'Separator: tabulator'}</Typography>
        </Stack>
      </Alert>
    </Stack>
  );
};
