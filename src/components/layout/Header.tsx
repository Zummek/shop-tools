import {
  Box,
  Button,
  ButtonGroup,
  Modal,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import { useIsPage } from '../../hooks';
import { Pages } from '../../utils/pages';

interface Props {
  headerTitle: string;
  onDemoButtonClick?: () => void;
  onButtonClick?: () => void;
  buttonLabel: string;
}

export const Header = ({
  headerTitle,
  onDemoButtonClick,
  onButtonClick,
  buttonLabel,
}: Props) => {
  const [openWarningModal, setOpenWarningModal] = useState(false);

  const handleDemoButtonClick = () => {
    setOpenWarningModal(false);
    onDemoButtonClick?.();
  };

  const isProductsDocumentsPage = useIsPage([Pages.smSystemProductsDocuments]);
  const isTransfersPage = useIsPage([Pages.smSystemTransfers]);
  const isImportProductsPage = useIsPage([Pages.smSystemImportProducts]);

  const isSuppliersPage = useIsPage([Pages.smSystemSuppliers]);
  const isSuppliersParamPage = useIsPage([Pages.smSystemSupplierDetails]);
  const isOrdersPage = useIsPage([Pages.smSystemOrders]);
  const isOrdersParamPage = useIsPage([Pages.smSystemOrderDetails]);

  const showSuppliersOrdersHeader =
    isOrdersPage ||
    isOrdersParamPage ||
    isSuppliersPage ||
    isSuppliersParamPage;

  const isReportsPage = useIsPage([
    Pages.smSystemReports,
    Pages.smSystemUnfulfilledOrdersByTransfersReport,
  ]);
  const showSmSystemHeader =
    isProductsDocumentsPage ||
    isTransfersPage ||
    isImportProductsPage ||
    showSuppliersOrdersHeader ||
    isReportsPage;

  return (
    <Stack spacing={2} direction="column">
      <Stack spacing={4} direction="row">
        <Button variant="text" href={`#${Pages.generatePriceList}`}>
          {'Generuj cenówki'}
        </Button>
        <Button variant="text" href={`#${Pages.barcodesGenerator}`}>
          {'Generuj kody kreskowe'}
        </Button>
        <Button variant="text" href={`#${Pages.invoiceConverter}`}>
          {'Konwenter faktur'}
        </Button>
        <Button variant="text" href={`#${Pages.smSystem}`}>
          {'SM System'}
        </Button>
      </Stack>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        width="100%"
      >
        <Stack spacing={2}>
          {showSmSystemHeader && (
            <Stack spacing={2} direction="row" alignItems="center">
              <Typography variant="h6">{'SM System:'}</Typography>
              <Box>
                <ButtonGroup variant="outlined">
                  <Button
                    href={`#${Pages.smSystemTransfers}`}
                    variant={isTransfersPage ? 'contained' : 'outlined'}
                  >
                    {'Transfery'}
                  </Button>
                  <Button
                    href={`#${Pages.smSystemProductsDocuments}`}
                    variant={isProductsDocumentsPage ? 'contained' : 'outlined'}
                  >
                    {'Dokumenty'}
                  </Button>
                  <Button
                    href={`#${Pages.smSystemOrders}`}
                    variant={
                      showSuppliersOrdersHeader ? 'contained' : 'outlined'
                    }
                  >
                    {'Zamówienia u dostawców'}
                  </Button>
                  <Button
                    href={`#${Pages.smSystemImportProducts}`}
                    variant={isImportProductsPage ? 'contained' : 'outlined'}
                  >
                    {'Import produktów'}
                  </Button>
                  <Button
                    href={`#${Pages.smSystemReports}`}
                    variant={isReportsPage ? 'contained' : 'outlined'}
                  >
                    {'Raporty'}
                  </Button>
                </ButtonGroup>
              </Box>
            </Stack>
          )}
        </Stack>

        <Typography variant="h3">{headerTitle}</Typography>
        {!!onDemoButtonClick && (
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setOpenWarningModal(true)}
            size="small"
          >
            {'Demo'}
          </Button>
        )}
        {!!onButtonClick && (
          <Button
            variant="outlined"
            color="primary"
            onClick={onButtonClick}
            size="small"
          >
            {buttonLabel}
          </Button>
        )}
      </Box>
      <Modal
        open={openWarningModal}
        onClose={() => setOpenWarningModal(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Stack
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
          }}
          spacing={4}
        >
          <Typography id="modal-modal-title" variant="h6" component="h2">
            {'Załadować demo?'}
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            {
              'Załadowanie demo spowoduje utratę wprowadzonych danych. Czy na pewno chcesz kontynuować?'
            }
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={() => setOpenWarningModal(false)}
            >
              {'Zamknij'}
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDemoButtonClick}
            >
              {'Załaduj demo'}
            </Button>
          </Stack>
        </Stack>
      </Modal>
    </Stack>
  );
};
