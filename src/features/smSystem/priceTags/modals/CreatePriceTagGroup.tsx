import AddIcon from '@mui/icons-material/Add';
import { LoadingButton } from '@mui/lab';
import { Modal, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { modalStyle } from '../../../../components';
import { Pages } from '../../../../utils';
import { useCreatePriceTagGroup } from '../api/useCreatePriceTagGroup';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CreatePriceTagGroup = ({ open, onClose }: Props) => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { createPriceTagGroup, isPending } = useCreatePriceTagGroup();

  const handleCloseModal = () => {
    onClose();
    setName('');
  };

  const handleCreatePriceTagGroup = async () => {
    if (!name) {
      setError('Nazwa jest wymagana');
      return;
    }
    if (name.length < 3) {
      setError('Nazwa musi mieć co najmniej 3 znaki');
      return;
    }
    if (name.length > 100) {
      setError('Nazwa nie może być dłuższa niż 100 znaków');
      return;
    }

    setError(null);

    const response = await createPriceTagGroup({ name });
    navigate(
      Pages.smSystemPriceTagsGroupDetails.replace(':groupId', response.data.id)
    );
    handleCloseModal();
  };

  return (
    <Modal open={open} onClose={handleCloseModal}>
      <Stack sx={modalStyle({ width: 300 })} spacing={8}>
        <Typography variant="h4" align="center">
          {'Dodaj grupę'}
        </Typography>
        <TextField
          label="Nazwa grupy"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={!!error}
          helperText={error}
        />
        <LoadingButton
          variant="contained"
          endIcon={<AddIcon />}
          onClick={handleCreatePriceTagGroup}
          loading={isPending}
        >
          {'Stwórz'}
        </LoadingButton>
      </Stack>
    </Modal>
  );
};
