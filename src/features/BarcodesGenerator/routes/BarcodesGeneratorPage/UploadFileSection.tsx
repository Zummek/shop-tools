import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';

import { VisuallyHiddenInput } from '../../../../components/inputs/VisuallyHiddenInput';
import { ProductBarcode } from '../../types';
import { readProductsFromCsv } from '../../utils';

interface Props {
  onBarcodesReadFromCsv: (barcodes: ProductBarcode[]) => void;
}

export const UploadFileSection = ({ onBarcodesReadFromCsv }: Props) => {
  const [fileName, setFileName] = useState<string | null>(null);

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onBarcodesReadFromCsv(await readProductsFromCsv(file));
    setFileName(file.name);
  };

  return (
    <Stack spacing={2}>
      <Stack spacing={4} direction="row" alignItems="center">
        <Button
          variant={fileName ? 'outlined' : 'contained'}
          color="primary"
          component="label"
          role={undefined}
          tabIndex={-1}
          startIcon={<CloudUploadIcon />}
        >
          {fileName ? 'Zmień plik' : 'Wybierz plik'}
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
          <Typography variant="body2">{'Kolumny: Id, Nazwa, Kod'}</Typography>
          <Typography variant="body2">{'Separator: tabulator'}</Typography>
        </Stack>
      </Alert>
    </Stack>
  );
};
