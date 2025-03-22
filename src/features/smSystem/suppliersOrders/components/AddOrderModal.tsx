import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Modal,
  Select,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import { useFetchOrders } from '../api/useFetchOrders';
import { IdName, BasicModalProps } from '../types/index';

const AddOrderModal = ({ open, handleClose }: BasicModalProps) => {
  const { suppliers, branches } = useFetchOrders();

  const [selectedBranches, setSelectedBranches] = useState<IdName[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<IdName | null>(null);

  const handleAddOrder = () => {
    handleCloseModal();
  };

  const handleCloseModal = () => {
    handleClose();
    resetValues();
  };

  const resetValues = () => {
    setSelectedBranches([]);
    setSelectedSupplier(null);
  };

  return (
    <Modal open={open} onClose={handleCloseModal}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          paddingX: 6,
          paddingY: 4,
          width: 175,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h6">{'Nowe zamówienie'}</Typography>

        <FormControl fullWidth variant="outlined" margin="normal">
          <InputLabel id="supplier-select-label">
            {'Wybierz dostawcę'}
          </InputLabel>
          <Select
            labelId="supplier-select-label"
            value={selectedSupplier?.id || ''}
            onChange={(event) => {
              const supplierId = Number(event.target.value);
              setSelectedSupplier(
                suppliers.find((s) => s.id === supplierId) || null
              );
            }}
            label="Wybierz dostawcę"
          >
            {suppliers.map((supplier) => (
              <MenuItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <List sx={{ width: '100%' }}>
          {branches.map(({ id, name }) => (
            <ListItem
              key={id}
              sx={{
                padding: 0,
                margin: 0,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedBranches.some((s) => s.id === id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBranches((prev) => [...prev, { id, name }]);
                      } else {
                        setSelectedBranches((prev) =>
                          prev.filter((branch) => branch.id !== id)
                        );
                      }
                    }}
                  />
                }
                label={<ListItemText primary={name} />}
              />
            </ListItem>
          ))}
        </List>

        <Button
          onClick={handleAddOrder}
          disabled={selectedSupplier === null || selectedBranches.length === 0}
          sx={{ marginLeft: 'auto' }}
        >
          {'Dodaj'}
        </Button>
      </Box>
    </Modal>
  );
};

export default AddOrderModal;
