import {
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useNotify } from '../../../../hooks';
import { Pages } from '../../../../utils';
import { useGetSupplierDetails } from '../api/useGetSupplierDetails';
import {
  useGetSupplierSettings,
  useUpdateSupplierSettings,
} from '../api/useSupplierSettings';
import { useUpdateSupplierDetails } from '../api/useUpdateSupplierDetails';
import { BranchesInSupplierTable } from '../tables/BranchesInSupplierTable';
import { ProductsInSupplierTable } from '../tables/ProductsInSupplierTable';

export const SupplierDetailsPage = () => {
  const navigate = useNavigate();
  const { notify } = useNotify();

  const { supplierId } = useParams();
  const id = isNaN(Number(supplierId)) ? 0 : Number(supplierId);

  const [selectedBranchIds, setSelectedBranches] = useState<number[]>([]);
  const [leadTimeDays, setLeadTimeDays] = useState(3);
  const [reviewPeriodDays, setReviewPeriodDays] = useState(7);
  const [safetyDays, setSafetyDays] = useState(2);
  const [autoDraftEnabled, setAutoDraftEnabled] = useState(false);

  const { updateSupplierDetails, isSaving } = useUpdateSupplierDetails();
  const { updateSettings, isSaving: isSavingSettings } =
    useUpdateSupplierSettings();

  const { data: dataSupplierDetails, isLoading: isLoadingSupplierDetails } =
    useGetSupplierDetails(id);
  const { settings, isLoading: isLoadingSettings } = useGetSupplierSettings(id);

  useEffect(() => {
    if (!isLoadingSupplierDetails && !dataSupplierDetails) {
      notify('error', 'Nie znaleziono dostawcy o podanym ID');
      navigate(Pages.smSystemSuppliersV2);
    }
  }, [dataSupplierDetails, isLoadingSupplierDetails, navigate, notify]);

  useEffect(() => {
    if (!isLoadingSupplierDetails && dataSupplierDetails) {
      setSelectedBranches(
        dataSupplierDetails.branches.map((branch) => branch.id),
      );
    }
  }, [dataSupplierDetails, isLoadingSupplierDetails]);

  useEffect(() => {
    if (settings) {
      setLeadTimeDays(settings.leadTimeDays ?? 3);
      setReviewPeriodDays(settings.reviewPeriodDays ?? 7);
      setSafetyDays(settings.safetyDays ?? 2);
      setAutoDraftEnabled(!!settings.autoDraftEnabled);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!id) return;

    await updateSupplierDetails({
      id,
      branchesIds: selectedBranchIds,
    });
    await updateSettings({
      id,
      leadTimeDays,
      reviewPeriodDays,
      safetyDays,
      autoDraftEnabled,
    });
  };

  const originalSelectedBranchIds = useMemo(
    () => dataSupplierDetails?.branches.map((branch) => branch.id) ?? [],
    [dataSupplierDetails],
  );

  const isBranchesIdsChanged = useMemo(
    () =>
      originalSelectedBranchIds.length !== selectedBranchIds.length ||
      originalSelectedBranchIds.some((id) => !selectedBranchIds.includes(id)),
    [originalSelectedBranchIds, selectedBranchIds],
  );

  const isSettingsChanged =
    leadTimeDays !== (settings?.leadTimeDays ?? 3) ||
    reviewPeriodDays !== (settings?.reviewPeriodDays ?? 7) ||
    safetyDays !== (settings?.safetyDays ?? 2) ||
    autoDraftEnabled !== !!settings?.autoDraftEnabled;

  return (
    <Stack>
      <Stack width="100%" spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate(Pages.smSystemSuppliersV2)}
          >
            {'Powrót'}
          </Button>
          <Typography variant="subtitle1" flex={1} fontWeight={600} noWrap>
            {'Dostawca: '}
            {dataSupplierDetails?.name}
          </Typography>

          <Button
            variant="contained"
            size="small"
            onClick={handleSave}
            loading={isSaving || isSavingSettings}
            disabled={!isBranchesIdsChanged && !isSettingsChanged}
          >
            {'Zapisz'}
          </Button>
        </Stack>

        <Stack direction="row" spacing={2} flexWrap="wrap">
          <TextField
            size="small"
            type="number"
            label="Lead time (dni)"
            value={leadTimeDays}
            onChange={(e) => setLeadTimeDays(Number(e.target.value) || 1)}
            sx={{ width: 160 }}
            disabled={isLoadingSettings}
          />
          <TextField
            size="small"
            type="number"
            label="Okres przeglądu (dni)"
            value={reviewPeriodDays}
            onChange={(e) => setReviewPeriodDays(Number(e.target.value) || 1)}
            sx={{ width: 180 }}
            disabled={isLoadingSettings}
          />
          <TextField
            size="small"
            type="number"
            label="Zapas bezpieczeństwa (dni)"
            value={safetyDays}
            onChange={(e) => setSafetyDays(Number(e.target.value) || 0)}
            sx={{ width: 220 }}
            disabled={isLoadingSettings}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={autoDraftEnabled}
                onChange={(e) => setAutoDraftEnabled(e.target.checked)}
                disabled={isLoadingSettings}
              />
            }
            label="Automatyczne szkice zamówień"
          />
        </Stack>

        <Stack spacing={2} direction="row" pb={4}>
          <ProductsInSupplierTable
            products={dataSupplierDetails?.products}
            isLoading={isLoadingSupplierDetails}
          />
          <BranchesInSupplierTable
            selectedBranchIds={selectedBranchIds}
            onChangeSelectedBranches={setSelectedBranches}
          />
        </Stack>
      </Stack>
    </Stack>
  );
};
