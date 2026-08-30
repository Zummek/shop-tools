import { Stack } from '@mui/material';

import { useAppSelector } from '../../../../hooks';
import { Pages } from '../../../../utils';
import { ReportBox } from '../components/ReportBox';

export const ReportsPage = () => {
  const canViewPurchasePrices = useAppSelector(
    (state) => state.smSystemUser.user?.permissions?.canViewPurchasePrices,
  );

  return (
    <Stack spacing={2} direction={{ xs: 'column', md: 'row' }} flexWrap="wrap">
      <ReportBox
        title="Raport niezrealizowanych zamówień"
        description="Raport pokazuje, które produkty zamówione przez sklepy nie zostały w pełni dostarczone w ramach transferów."
        page={Pages.smSystemUnfulfilledOrdersByTransfersReport}
      />
      {canViewPurchasePrices ? (
        <ReportBox
          title="Raport marży kanałów"
          description="Marża towarowa i po opłatach dla paragonów PC-Market oraz kanałów e-commerce (Allegro, Erli, Woo), z przejrzystym wyliczeniem."
          page={Pages.smSystemChannelMarginReport}
        />
      ) : null}
    </Stack>
  );
};
