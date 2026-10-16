import { Stack } from '@mui/material';

import { useAppSelector } from '../../../../hooks';
import { canViewSalesEvidence, Pages } from '../../../../utils';
import { ReportBox } from '../components/ReportBox';

export const ReportsPage = () => {
  const permissions = useAppSelector(
    (state) => state.smSystemUser.user?.permissions,
  );
  const canViewPurchasePrices = permissions?.canViewPurchasePrices;

  return (
    <Stack spacing={2} direction={{ xs: 'column', md: 'row' }} flexWrap="wrap">
      {canViewPurchasePrices ? (
        <>
          <ReportBox
            title="Raport marży kanałów"
            description="Marża towarowa i po opłatach dla paragonów PC-Market oraz kanałów e-commerce (Allegro, Erli, Woo), z przejrzystym wyliczeniem."
            page={Pages.smSystemChannelMarginReport}
          />
          <ReportBox
            title="Symulacja cen Allegro"
            description="Kalkulator marży ofert wprzód: prowizja z kategorii, wysyłka i zakup."
            page={Pages.smSystemAllegroPriceSim}
          />
        </>
      ) : null}
      {canViewSalesEvidence(permissions) ? (
        <ReportBox
          title="Dowód sprzedaży bezrachunkowej"
          description="Zbiorczy dokument dla księgowej ze sprzedaży wysyłkowej bez paragonu (Allegro, Erli, Woo): kwoty brutto i VAT według stawek za wybrany okres, PDF + XLSX."
          page={Pages.smSystemSalesEvidence}
        />
      ) : null}
    </Stack>
  );
};
