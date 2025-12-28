import { Stack, SxProps, Theme, Typography } from '@mui/material';

interface Props {
  label: string;
  value: string | number | undefined | null;
  minWidth?: number | string;
  sx?: SxProps<Theme>;
}

export const LabelData = ({ label, value, minWidth, sx }: Props) => {
  return (
    <Stack sx={{ minWidth, ...sx }}>
      <Typography variant="subtitle2" color="text.secondary" fontWeight={500}>
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={400}>
        {value ?? 'brak'}
      </Typography>
    </Stack>
  );
};
