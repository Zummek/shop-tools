import { Box, Button } from '@mui/material';
import { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';

import { Page } from '../../../../components/layout';
import { ProductBarcode } from '../../types';

import { BarcodeList } from './BarcodeList';
import { UploadFileSection } from './UploadFileSection';

export const BarcodesGeneratorPage = () => {
  const componentToPrintRef = useRef<HTMLDivElement>(null);

  const [barcodes, setBarcodes] = useState<ProductBarcode[]>([]);

  const printCodes = useReactToPrint({
    content: () => componentToPrintRef.current,
  });

  return (
    <Page headerTitle="Generuj kody kreskowe">
      <UploadFileSection onBarcodesReadFromCsv={setBarcodes} />

      {barcodes.length > 0 && (
        <>
          <Box display="flex" justifyContent="center">
            <Button variant="contained" color="primary" onClick={printCodes}>
              {'Drukuj kody kreskowe'}
            </Button>
          </Box>
          <div ref={componentToPrintRef}>
            <BarcodeList barcodes={barcodes} />
          </div>
        </>
      )}
    </Page>
  );
};
