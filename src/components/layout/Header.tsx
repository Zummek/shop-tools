import {
  Box,
  Button,
  ButtonGroup,
  Modal,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import {
  useLogoutUser,
  useUserSession,
} from '../../features/smSystem/user/hooks';
import { useAppSelector, useIsPage } from '../../hooks';
import { Pages } from '../../utils/pages';

interface Props {
  headerTitle: string;
  onDemoButtonClick?: () => void;
}

export const Header = ({ headerTitle, onDemoButtonClick }: Props) => {
  const { user } = useAppSelector((state) => state.smSystemUser);
  const [openWarningModal, setOpenWarningModal] = useState(false);

  const { logoutUser } = useLogoutUser();
  const { isSessionActive } = useUserSession();

  const handleDemoButtonClick = () => {
    setOpenWarningModal(false);
    onDemoButtonClick?.();
  };

  const isProductsDocumentsPage = useIsPage([Pages.smSystemProductsDocuments]);
  const isTransfersPage = useIsPage([Pages.smSystemTransfers]);
  const isImportProductsPage = useIsPage([Pages.smSystemImportProducts]);

  const areSuppliersFeaturePages = useIsPage([
    Pages.smSystemSuppliers,
    Pages.smSystemSupplierDetails,
    Pages.smSystemOrders,
    Pages.smSystemOrderDetails,
  ]);

  const isReportsPage = useIsPage([
    Pages.smSystemReports,
    Pages.smSystemUnfulfilledOrdersByTransfersReport,
  ]);

  const isPriceTagsGroupsPage = useIsPage([
    Pages.smSystemPriceTagsGroups,
    Pages.smSystemPriceTagsGroupDetails,
  ]);

  const isEcommerceOrdersPage = useIsPage([
    Pages.smSystemEcommerceOrders,
    Pages.smSystemEcommerceOrderDetails,
  ]);

  const isEcommerceAllegroPage = useIsPage(Pages.smSystemEcommerceAllegro);

  const isInvoicesPage = useIsPage([
    Pages.smSystemInvoices,
    Pages.smSystemInvoiceDetails,
  ]);

  const showSmSystemHeader =
    isProductsDocumentsPage ||
    isTransfersPage ||
    isImportProductsPage ||
    areSuppliersFeaturePages ||
    isReportsPage ||
    isPriceTagsGroupsPage ||
    isEcommerceOrdersPage ||
    isEcommerceAllegroPage ||
    isInvoicesPage;

  return (
    <Stack spacing={2} direction="column">
      <Box
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Stack spacing={4} direction="row">
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

        <Box>
          {isSessionActive && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => logoutUser()}
            >
              {'Wyloguj'}
            </Button>
          )}
        </Box>
      </Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        width="100%"
      >
        {showSmSystemHeader && (
          <Stack spacing={2} direction="row" alignItems="center">
            <Box>
              <ButtonGroup variant="outlined">
                <Button
                  href={`#${Pages.smSystemTransfers}`}
                  variant={isTransfersPage ? 'contained' : 'outlined'}
                  size="small"
                >
                  {'Transfery'}
                </Button>
                <Button
                  href={`#${Pages.smSystemProductsDocuments}`}
                  variant={isProductsDocumentsPage ? 'contained' : 'outlined'}
                  size="small"
                >
                  {'Dokumenty'}
                </Button>
                <Button
                  href={`#${Pages.smSystemOrders}`}
                  variant={areSuppliersFeaturePages ? 'contained' : 'outlined'}
                  size="small"
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
                  href={`#${Pages.smSystemPriceTagsGroups}`}
                  variant={isPriceTagsGroupsPage ? 'contained' : 'outlined'}
                  size="small"
                >
                  {'Etykiety cenowe'}
                </Button>
                {user?.permissions?.canViewPurchasePrices && (
                  <Button
                    href={`#${Pages.smSystemInvoices}`}
                    variant={isInvoicesPage ? 'contained' : 'outlined'}
                    size="small"
                  >
                    {'Faktury'}
                  </Button>
                )}
                {user?.permissions?.canAccessEcommerce && (
                  <Button
                    href={`#${Pages.smSystemEcommerceOrders}`}
                    variant={isEcommerceOrdersPage ? 'contained' : 'outlined'}
                    size="small"
                  >
                    {'Zamówienia ecommerce'}
                  </Button>
                )}
                {user?.permissions?.canAccessEcommerce && (
                  <Button
                    href={`#${Pages.smSystemEcommerceAllegro}`}
                    variant={isEcommerceAllegroPage ? 'contained' : 'outlined'}
                    size="small"
                  >
                    {'Allegro'}
                  </Button>
                )}
                <Button
                  href={`#${Pages.smSystemReports}`}
                  variant={isReportsPage ? 'contained' : 'outlined'}
                  size="small"
                >
                  {'Raporty'}
                </Button>
              </ButtonGroup>
            </Box>
          </Stack>
        )}

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
