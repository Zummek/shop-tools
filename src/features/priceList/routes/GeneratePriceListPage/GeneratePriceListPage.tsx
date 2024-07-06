import { Box, Button, Stack, Typography } from '@mui/material';
import { useMemo, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

import { Page } from '../../../../components/layout';
import { useAppSelector } from '../../../../hooks';
import { PdfFullPriceList } from '../../components/PdfFullPriceList';
import { SinglePriceList } from '../../components/SinglePriceList';
import { useLoadDemo } from '../../hooks/useLoadDemo';

import { ImportExportButtons } from './ImportExportButtons';
import { PriceListTable } from './PriceListTable';
import { SelectPriceType } from './SelectPriceType';
import { UpdatePricesByUploadingFileSection } from './UpdatePricesByUploadingFileSection';
import { UploadFileSection } from './UploadFileSection';

export const GeneratePriceListPage = () => {
  const { loadDemoCsvFile } = useLoadDemo();

  const componentToPrintRef = useRef<HTMLDivElement>(null);
  const products = useAppSelector((state) => state.priceList.products);
  const priceType = useAppSelector((state) => state.priceList.priceType);

  const generatePriceListPdf = useReactToPrint({
    content: () => componentToPrintRef.current,
    pageStyle: `
      @page {
        size: A4;
        margin: 0mm;
      }
    `,
  });

  const productsToPrint = useMemo(
    () => products.filter((p) => p.includedInPriceList),
    [products]
  );

  const productsWithoutPriceAmount = useMemo(
    () => productsToPrint.filter((p) => p.prices[priceType] === null).length,
    [productsToPrint, priceType]
  );
  const productsWithoutFullUnitPriceAmount = useMemo(
    () => productsToPrint.filter((p) => p.pricePerFullUnit === null).length,
    [productsToPrint]
  );

  return (
    <Page headerTitle="Generuj cenówki" onDemoButtonClick={loadDemoCsvFile}>
      <Stack direction="row" spacing={4}>
        <Box flex={1} display="flex">
          <UploadFileSection />
        </Box>
        <Box flex={1} display="flex">
          <UpdatePricesByUploadingFileSection />
        </Box>
      </Stack>

      {products.length > 0 && (
        <Stack spacing={2} flex={1}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack spacing={2}>
              <SelectPriceType />

              <Stack direction="row" spacing={4}>
                <Typography variant="caption">
                  {'Liczba produktów: ' + products.length}
                </Typography>
                <Typography variant="caption">
                  {'Do druku: ' + productsToPrint.length}
                </Typography>
                <Typography variant="caption">
                  {'Bez ceny: ' + productsWithoutPriceAmount}
                </Typography>
                <Typography variant="caption">
                  {'Bez ceny jednostkowej: ' +
                    productsWithoutFullUnitPriceAmount}
                </Typography>
              </Stack>
            </Stack>

            <Stack spacing={2}>
              {!!productsToPrint.length && (
                <Box display="flex" alignSelf="center">
                  <SinglePriceList product={productsToPrint[0]} />
                </Box>
              )}
              <Stack direction="row" spacing={2} justifyContent="flex-start">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={generatePriceListPdf}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  {'Drukuj cenówki'}
                </Button>
                <ImportExportButtons />
              </Stack>
            </Stack>
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
