import { Stack, Typography } from '@mui/material';

interface Props {
  label: string;
  value: string | number | undefined | null;
}

export const LabelData = ({ label, value }: Props) => {
  return (
    <Stack>
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value ?? 'brak'}</Typography>
    </Stack>
  );
};
