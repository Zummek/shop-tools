import { Box, Button, Stack, Typography } from '@mui/material';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

import { Page } from '../../../../components/layout';
import { useAppSelector } from '../../../../hooks/store';
import { PdfFullPriceList } from '../../components/PdfFullPriceList';
import { SinglePriceList } from '../../components/SinglePriceList';

import { PriceListTable } from './PriceListTable';
import { UploadFileSection } from './UploadFileSection';

export const GeneratePriceListPage = () => {
  const componentToPrintRef = useRef<HTMLDivElement>(null);
  const products = useAppSelector((state) => state.priceList.products);

  const generatePriceListPdf = useReactToPrint({
    content: () => componentToPrintRef.current,
  });

  const productsToPrint = products.filter((p) => p.includedInPriceList);

  return (
    <Page headerTitle="Generuj cenówki">
      <UploadFileSection />

      {products.length > 0 && (
        <Stack spacing={2} flex={1}>
          <Stack
            direction={['column', 'row']}
            spacing={2}
            justifyContent={['center', 'space-between']}
            alignItems="center"
          >
            <Typography variant="h4">{'Podgląd cenówek'}</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={generatePriceListPdf}
            >
              {'Drukuj cenówki'}
            </Button>
            {!!productsToPrint.length && (
              <Box display="flex" alignSelf="center">
                <SinglePriceList product={productsToPrint[0]} />
              </Box>
            )}
          </Stack>
          <PriceListTable />
        </Stack>
      )}

      <div style={{ display: 'none' }}>
        <div ref={componentToPrintRef}>
          <PdfFullPriceList products={productsToPrint} />
        </div>
      </div>
    </Page>
  );
};
