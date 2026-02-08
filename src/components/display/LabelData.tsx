import { Stack, SxProps, Theme, Typography } from '@mui/material';

type TextWeight = 'normal' | 'medium' | 'bold';

interface Props {
  label: string;
  value: string | number | undefined | null;
  minWidth?: number | string;
  sx?: SxProps<Theme>;
  weight?: TextWeight;
  valueColor?: string;
}

const textWeightMap: Record<TextWeight, number> = {
  normal: 400,
  medium: 500,
  bold: 700,
};

export const LabelData = ({
  label,
  value,
  minWidth,
  sx,
  weight = 'normal',
  valueColor,
}: Props) => {
  return (
    <Stack sx={{ minWidth, ...sx }}>
      <Typography variant="subtitle2" color="text.secondary" fontWeight={500}>
        {label}
      </Typography>
      <Typography
        variant="body1"
        fontWeight={textWeightMap[weight]}
        color={valueColor}
      >
        {value ?? 'brak'}
      </Typography>
    </Stack>
  );
};
