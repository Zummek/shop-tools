import DeleteIcon from '@mui/icons-material/Delete';
import { LoadingButton } from '@mui/lab';
import { Modal, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { modalStyle } from '../../../../components';
import { Pages } from '../../../../utils';
import { useDeletePriceTagGroup } from '../api';

interface Props {
  groupId: string | undefined;
  groupName: string;
  open: boolean;
  onClose: () => void;
}

export const ConfirmDeletingPriceGroupModal = ({
  groupId,
  groupName,
  open,
  onClose,
}: Props) => {
  const navigate = useNavigate();

  const { deletePriceTagGroup, isPending } = useDeletePriceTagGroup();

  const handleDeletePriceTagGroup = async () => {
    if (!groupId) return;

    await deletePriceTagGroup(groupId);
    navigate(Pages.smSystemPriceTagsGroups);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Stack sx={modalStyle({ width: 300 })} spacing={8}>
        <Typography variant="h4" align="center">
          {'Usuń grupę'}
        </Typography>
        <Typography variant="body1" align="center">
          {`Czy na pewno chcesz usunąć grupę ${groupName}?`}
        </Typography>
        <LoadingButton
          variant="contained"
          endIcon={<DeleteIcon />}
          onClick={handleDeletePriceTagGroup}
          loading={isPending}
        >
          {'Usuń'}
        </LoadingButton>
      </Stack>
    </Modal>
  );
};
