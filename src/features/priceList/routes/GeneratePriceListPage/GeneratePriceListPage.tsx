import {
  Box,
  Button,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

import { Page } from '../../../../components/layout';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { PdfFullPriceList } from '../../components/PdfFullPriceList';
import { SinglePriceList } from '../../components/SinglePriceList';
import { setPriceType as setPriceTypeAction } from '../../store/priceListSlice';
import { PriceType } from '../../types/product';

import { PriceListTable } from './PriceListTable';
import { UploadFileSection } from './UploadFileSection';

export const GeneratePriceListPage = () => {
  const dispatch = useAppDispatch();
  const componentToPrintRef = useRef<HTMLDivElement>(null);
  const products = useAppSelector((state) => state.priceList.products);
  const priceType = useAppSelector((state) => state.priceList.priceType);

  const generatePriceListPdf = useReactToPrint({
    content: () => componentToPrintRef.current,
  });

  const setPriceType = (priceType: PriceType) => {
    dispatch(setPriceTypeAction(priceType));
  };

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

          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body1">
              {'Typ ceny wzięty pod uwagę: '}
            </Typography>
            <ToggleButtonGroup
              value={priceType}
              exclusive
              size="small"
              onChange={(_event, priceType) => setPriceType(priceType)}
            >
              <ToggleButton
                value={PriceType.detaliczna}
                sx={{ textTransform: 'none' }}
              >
                {'Detaliczna'}
              </ToggleButton>
              <ToggleButton
                value={PriceType.hurtowa}
                sx={{ textTransform: 'none' }}
              >
                {'Hurtowa'}
              </ToggleButton>
              <ToggleButton
                value={PriceType.ewidencyjna}
                sx={{ textTransform: 'none' }}
              >
                {'Ewidencyjna'}
              </ToggleButton>
              <ToggleButton
                value={PriceType.nocna}
                sx={{ textTransform: 'none' }}
              >
                {'Nocna'}
              </ToggleButton>
            </ToggleButtonGroup>
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
