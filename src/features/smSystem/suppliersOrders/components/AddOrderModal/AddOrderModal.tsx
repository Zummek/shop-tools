import { Modal, Stack, Typography } from '@mui/material';
import { useState } from 'react';

import { BasicModalProps, Supplier } from '../../../app/types/index';

import { SelectingBranches } from './SelectingBranches';
import { SelectingSupplier } from './SelectingSupplier';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  paddingX: 6,
  paddingY: 4,
  width: 535,
  display: 'flex',
  flexDirection: 'column',
};

export const AddOrderModal = ({ open, handleClose }: BasicModalProps) => {
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
      <Stack sx={modalStyle} spacing={3}>
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
