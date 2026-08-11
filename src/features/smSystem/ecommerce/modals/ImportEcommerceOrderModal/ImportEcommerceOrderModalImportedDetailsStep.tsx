import { Button, Stack, Typography } from '@mui/material';

import { LabelData } from '../../../../../components';

interface Props {
  onClose: () => void;
  createdOrdersIds: number[];
  updatedOrdersIds?: number[];
  errors: {
    errorCode: string;
    message: string;
    metadata: {
      orderId?: number;
    };
  }[];
}

export const ImportEcommerceOrderModalImportedDetailsStep = ({
  createdOrdersIds,
  updatedOrdersIds,
  errors,
  onClose,
}: Props) => {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">{'Import zakończony pomyślnie'}</Typography>
      <LabelData
        label="Zaimportowano zamówień"
        value={createdOrdersIds.length}
      />
      {updatedOrdersIds !== undefined && (
        <LabelData label="Zaktualizowano" value={updatedOrdersIds.length} />
      )}
      <LabelData label="Wystąpiło błędów" value={errors.length} />
      <Button variant="contained" onClick={onClose}>
        {'Zamknij'}
      </Button>
    </Stack>
  );
};
