import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
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

import {
  SimpleSupplier,
  SimpleBranch,
  BasicModalProps,
} from '../../app/types/index';
import { useCreateOrder } from '../api/useCreateOrder';
import { useGetBranches } from '../api/useGetBranches';
import { useGetSuppliers } from '../api/useGetSuppliers';

const AddOrderModal = ({ open, handleClose }: BasicModalProps) => {
  const { suppliers, isLoadingS, isErrorS } = useGetSuppliers();
  const { branches, isLoadingB, isErrorB } = useGetBranches();
  const { createOrder } = useCreateOrder();

  const [selectedSupplier, setSelectedSupplier] =
    useState<SimpleSupplier | null>(null);
  const [selectedBranches, setSelectedBranches] = useState<SimpleBranch[]>([]);

  const handleAddOrder = async () => {
    if (selectedSupplier !== null && selectedBranches.length > 0) {
      const orderData = {
        supplier_id: selectedSupplier.id,
        selected_branches_ids: selectedBranches.map((branch) => branch.id),
      };

      await createOrder(orderData);
    }
  };

  const handleCloseModal = () => {
    handleClose();
    resetValues();
  };

  const resetValues = () => {
    setSelectedBranches([]);
    setSelectedSupplier(null);
  };

  const isEmptyError = suppliers.length === 0 || branches.length === 0;
  const isError = isErrorS || isErrorB;
  const isLoading = isLoadingS || isLoadingB;

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
          width: 250,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h6" align="center">
          {'Nowe zamówienie'}
        </Typography>

        {isError ? (
          <Typography
            color="error"
            variant="body2"
            sx={{ textAlign: 'center', marginTop: 2 }}
          >
            {'Błąd pobierania danych.'}
          </Typography>
        ) : isEmptyError ? (
          <Typography
            color="error"
            variant="body2"
            sx={{ textAlign: 'center', marginTop: 2 }}
          >
            {'Brak dostępnych dostawców lub oddziałów.'}
          </Typography>
        ) : isLoading ? (
          <CircularProgress sx={{ marginTop: 2, alignSelf: 'center' }} />
        ) : (
          <>
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
                MenuProps={{
                  PaperProps: {
                    style: { maxHeight: 196, overflowY: 'auto' },
                  },
                }}
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ maxHeight: 181, overflowY: 'auto' }}>
              <List sx={{ width: '100%' }}>
                {branches.map(({ id, name }) => (
                  <ListItem key={id} sx={{ padding: 0, margin: 0 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedBranches.some((s) => s.id === id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBranches((prev) => [
                                ...prev,
                                { id, name },
                              ]);
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
            </Box>

            <Button
              onClick={handleAddOrder}
              disabled={
                selectedSupplier === null || selectedBranches.length === 0
              }
              sx={{ marginLeft: 'auto', marginTop: 2 }}
            >
              {'Dodaj'}
            </Button>
          </>
        )}
      </Box>
    </Modal>
  );
};

export default AddOrderModal;
