import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

import { Header } from '../../../../components/layout/Header';
import { useAppSelector } from '../../../../hooks/store';
import { PdfFullPriceList } from '../../components/PdfFullPriceList';
import { SinglePriceList } from '../../components/SinglePriceList';

import { PriceListTable } from './PriceListTable';
import { UploadFileSection } from './UploadFileSection';

export const GeneratePriceListPage = () => {
  const componentToPrintRef = useRef<HTMLDivElement>(null);
  const products = useAppSelector((state) => state.priceList.products);

  const printCodes = useReactToPrint({
    content: () => componentToPrintRef.current,
  });

  const generatePriceListPdf = () => printCodes();

  return (
    <Container maxWidth="lg">
      <Header />
      <Stack mt={4} spacing={4}>
        <Typography variant="h3">{'Generuj cenówki'}</Typography>

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
                {'Generuj cenówki'}
              </Button>
              <Box display="flex" alignSelf="center">
                <SinglePriceList product={products[0]} />
              </Box>
            </Stack>
            <PriceListTable />
          </Stack>
        )}

        <div style={{ display: 'none' }}>
          <div ref={componentToPrintRef}>
            <PdfFullPriceList products={products} />
          </div>
        </div>
      </Stack>
    </Container>
  );
};