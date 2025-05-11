import { Button, Stack, Typography } from '@mui/material';

import { Pages } from '../../../../utils';

interface Props {
  title: string;
  description: string;
  page: Pages;
}

export const ReportBox = ({ title, description, page }: Props) => {
  return (
    <Stack
      spacing={2}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        width: '100%',
        maxWidth: 400,
        '&:hover': {
          borderColor: 'primary.main',
        },
      }}
    >
      <Typography variant="h6">{title}</Typography>
      <Typography variant="body1">{description}</Typography>
      <Button href={`#${page}`} variant="contained">
        {'Wyświetl raport'}
      </Button>
    </Stack>
  );
};
