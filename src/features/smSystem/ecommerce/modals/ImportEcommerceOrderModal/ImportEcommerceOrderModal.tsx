import { Modal, Stack, Typography } from '@mui/material';

import { modalStyle } from '../../../../../components';
import { useImportAllegroOrders } from '../../api';

import { ImportEcommerceOrderModalImportedDetailsStep } from './ImportEcommerceOrderModalImportedDetailsStep';
import {
  ImportEcommerceOrderModalImportingStep,
  OnImportFn,
} from './ImportEcommerceOrderModalImportingStep';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const ImportEcommerceOrderModal = ({ open, onClose }: Props) => {
  const {
    importAllegroOrders,
    isPending,
    importAllegroOrdersData,
    resetAllegroOrdersData,
  } = useImportAllegroOrders();

  const handleImportEcommerceOrders: OnImportFn = async ({
    dateFrom,
    dateTo,
  }) => {
    await importAllegroOrders({
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
    });
  };

  const handleCloseModal = () => {
    onClose();
    resetAllegroOrdersData();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Stack sx={modalStyle({ width: 600 })} spacing={8}>
        <Typography variant="h4" align="center">
          {'Zaimportuj zamówienia z Allegro'}
        </Typography>
        {importAllegroOrdersData ? (
          <ImportEcommerceOrderModalImportedDetailsStep
            createdOrdersIds={importAllegroOrdersData.createdOrdersIds}
            errors={importAllegroOrdersData.errors}
            onClose={handleCloseModal}
          />
        ) : (
          <ImportEcommerceOrderModalImportingStep
            onImport={handleImportEcommerceOrders}
            onClose={handleCloseModal}
            isPending={isPending}
          />
        )}
      </Stack>
    </Modal>
  );
};
