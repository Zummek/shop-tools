import CachedIcon from '@mui/icons-material/Cached';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import latinize from 'latinize';
import { useState } from 'react';

import { VisuallyHiddenInput } from '../../../../components/inputs';
import { Page } from '../../../../components/layout';
import { InvoideProvider } from '../../types';
import { convertInvoiceToPcMarket } from '../../utils/convertInvoiceToPcMarket';
import { detectInvoiceProvider } from '../../utils/detectInvoiceProvider';

export const InvoiceConverterPage = () => {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [detectedInvoiceProvider, setDetectedInvoiceProvider] =
    useState<InvoideProvider | null>(null);

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCurrentFile(file);
    setDetectedInvoiceProvider(await detectInvoiceProvider(file));
  };

  const convertFile = async () => {
    if (!currentFile || !detectedInvoiceProvider) return;

    const convertedFileText = await convertInvoiceToPcMarket(
      currentFile,
      detectedInvoiceProvider
    );

    // create and download file with priceListData
    const element = document.createElement('a');
    const file = new Blob([latinize(convertedFileText)], {
      type: 'text/plain',
    });
    element.href = URL.createObjectURL(file);
    const datePart = dayjs().format('YYYY-MM-DD-HH-mm');

    element.download = `${currentFile.name}-PC-Market-${datePart}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <Page headerTitle="Konwertuj faktury">
      <Alert severity="info">
        <Stack>
          <Typography variant="body1">
            {
              'Aby przekonwertować fakturę od dostawcy do formatu PC-Market wybierz plik fakturą od dostawcy w formacie .xml'
            }
          </Typography>
          <Typography variant="caption">
            {
              'Wspierani dostawcy: Dary Natury, Wiesiołek, Bez Gluten, Medicaline'
            }
          </Typography>
        </Stack>
      </Alert>

      <Stack spacing={1} alignItems="flex-start">
        <Typography variant="body1">
          {'Wybierz plik faktury od dostawcy'}
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant={currentFile?.name ? 'outlined' : 'contained'}
            color="primary"
            component="label"
            role={undefined}
            tabIndex={-1}
            startIcon={<CloudUploadIcon />}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {currentFile?.name ? 'Zmień plik' : 'Wybierz plik'}
            <VisuallyHiddenInput type="file" onChange={onFileChange} />
          </Button>
          {currentFile?.name && (
            <Typography variant="body1">
              {'Wybrany plik: '}
              {currentFile?.name}
            </Typography>
          )}
        </Stack>
      </Stack>
      {detectedInvoiceProvider && (
        <Stack spacing={1} alignItems="flex-start">
          <Typography variant="body1">
            {'Wykryty dostawca: '}
            {detectedInvoiceProvider}
          </Typography>
          <Box display="flex" justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              startIcon={<CachedIcon />}
              sx={{ whiteSpace: 'nowrap' }}
              onClick={convertFile}
            >
              {'Konwertuj'}
            </Button>
          </Box>
        </Stack>
      )}
    </Page>
  );
};
