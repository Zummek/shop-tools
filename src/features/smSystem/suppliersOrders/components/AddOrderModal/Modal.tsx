import {
  Box,
  Button,
  CircularProgress,
  Modal,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { GridRowParams } from '@mui/x-data-grid';
import { SetStateAction, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Pages } from '../../../../../utils';
import {BasicModalProps} from '../../../app/types/index';
import { useCreateOrder } from '../../api/useCreateOrder';
import { useGetSuppliers } from '../../api/useGetSuppliers';

import BranchesTable from './BranchesTable';
import SuppliersTable from './SuppliersTable';


const AddOrderModal = ({ open, handleClose }: BasicModalProps) => {
  const [page, setPage] = useState(0);
  const [name, setName] = useState<string>('');
  const [nameToSearch, setNameToSearch] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    isError,
    name: searchedName,
  } = useGetSuppliers(nameToSearch);
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
  const [selectedBranches, setSelectedBranches] = useState<number[]>([]);
  
  const { createOrder } = useCreateOrder();

  const navigate = useNavigate();

  const handleAddOrder = async () => {
    if (selectedSupplier !== null && selectedBranches.length > 0) {
      setIsCreating(true)
      const orderData = {
        supplier_id: selectedSupplier,
        selected_branches_ids: selectedBranches,
      };
  
      try {
        const id = await createOrder(orderData);
        if (id) {
          setIsCreating(false)
          navigate(`${Pages.smSystemOrders}/${id}`);
        }
        else {
          console.error('Brak ID zamówienia');
          setIsCreating(false)
        }
        
        
      } catch (err) {
        console.error('Błąd przy tworzeniu zamówienia', err);
      }
    } else {
      console.error('Wybierz sklepy');
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

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      setNameToSearch((event.target as HTMLInputElement).value);
      setPage(0);
    }
  };

  const handleChange = (event: { target: { value: SetStateAction<string> } }) => {
    const value = event.target.value;
    if (value==='')
      setNameToSearch('')
    setName(value);
  };

  useEffect(() => {
    if (searchedName) 
      setName(searchedName);    
  }, [searchedName]);

  const handleRowClick = (params: GridRowParams) => {
    setSelectedSupplier(params.row.id)
  };

  const handleCheckboxChange = (branchId: number) => {
    setSelectedBranches((prevSelected) => {
      if (prevSelected.includes(branchId)) 
        return prevSelected.filter(id => id !== branchId);
      else 
        return [...prevSelected, branchId];
    });
  };
  
  const selected = data?.pages[page].results.find(supplier => supplier.id === selectedSupplier) || null;
  
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
          width: 535,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h4" align="center">
          {'Nowe zamówienie'}
        </Typography>

        {isError ? (
          <Typography
            color="error"
            variant="body2"
            sx={{ textAlign: 'center'}}
          >
            {'Błąd pobierania danych.'}
          </Typography>
        ) : isLoading ? (
          <CircularProgress sx={{ textAlign: 'center'}} />
        ) : !data ? (
          <Typography
            color="error"
            variant="body2"
            sx={{ textAlign: 'center'}}
          >
            {'Brak dostępnych dostawców.'}
          </Typography>
        ) : !selectedSupplier ? (
          <Stack spacing={2} height={491} alignItems='center'>
            <Typography variant="h6" align="center">
              {'Wybierz dostawcę'}
            </Typography>
            <SuppliersTable data={data} isFetchingNextPage={isFetchingNextPage} fetchNextPage={fetchNextPage} page={page} setPage={setPage} handleRowClick={handleRowClick} />
            <TextField
              label="Wyszukaj"
              variant="outlined"
              value={name}
              onKeyDown={handleKeyDown}
              onChange={handleChange}
              sx={{
                width: '180px',
              }}
            />
          </Stack>
        ) : selected ? (
          <Stack spacing={2} height={475} alignItems='center'>
            <Typography variant="h6" align="center">
              {'Zaznacz sklepy'}
            </Typography>
            <BranchesTable data={selected} selectedBranches={selectedBranches} handleCheckboxChange={handleCheckboxChange} />
            <Button variant="contained" color="primary" onClick={handleAddOrder} disabled={isCreating} sx={{ height: '40px' }}>
              {isCreating ? 'Tworzenie nowego zamówienia...' : 'Dodaj zamówienie'}
            </Button>
          </Stack>
        ) : null }
      </Box>
    </Modal>
  );
};

export default AddOrderModal;
