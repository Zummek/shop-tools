import { Modal, Stack, Typography } from '@mui/material';
import { useState } from 'react';

import { modalStyle } from '../../../../../components';
import { Supplier } from '../../types';

import { SelectingBranches } from './SelectingBranches';
import { SelectingSupplier } from './SelectingSupplier';

interface Props {
  open: boolean;
  handleClose: () => void;
}

export const AddOrderModal = ({ open, handleClose }: Props) => {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );

  const handleCloseModal = () => {
    handleClose();
    setSelectedSupplier(null);
  };

  const backToSupplierSelection = () => {
    setSelectedSupplier(null);
  };

  return (
    <Modal open={open} onClose={handleCloseModal}>
      <Stack sx={modalStyle({ width: 535 })} spacing={3}>
        <Typography variant="h4" align="center">
          {'Nowe zamówienie'}
        </Typography>

        {selectedSupplier === null && (
          <SelectingSupplier onSupplierSelected={setSelectedSupplier} />
        )}
        {selectedSupplier && (
          <SelectingBranches
            selectedSupplier={selectedSupplier}
            onBack={backToSupplierSelection}
          />
        )}
      </Stack>
    </Modal>
  );
};
