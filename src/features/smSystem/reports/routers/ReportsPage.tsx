import { Stack } from '@mui/material';

import { Pages } from '../../../../utils';
import { ReportBox } from '../components/ReportBox';

export const ReportsPage = () => {
  return (
    <Stack spacing={2}>
      <ReportBox
        title="Raport niezrealizowanych zamówień"
        description="Raport pokazuje, które produkty zamówione przez sklepy nie zostały w pełni dostarczone w ramach transferów."
        page={Pages.smSystemUnfulfilledOrdersByTransfersReport}
      />
    </Stack>
  );
};
