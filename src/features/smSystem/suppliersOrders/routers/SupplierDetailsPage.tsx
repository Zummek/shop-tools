import { Button, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useNotify } from '../../../../hooks';
import { Pages } from '../../../../utils';
import { useGetSupplierDetails } from '../api/useGetSupplierDetails';
import { useUpdateSupplierDetails } from '../api/useUpdateSupplierDetails';
import { BranchesInSupplierTable } from '../tables/BranchesInSupplierTable';
import { ProductsInSupplierTable } from '../tables/ProductsInSupplierTable';

export const SupplierDetailsPage = () => {
  const navigate = useNavigate();
  const { notify } = useNotify();

  const { supplierId } = useParams();
  const id = isNaN(Number(supplierId)) ? 0 : Number(supplierId);

  const [selectedBranchIds, setSelectedBranches] = useState<number[]>([]);

  const { updateSupplierDetails, isSaving } = useUpdateSupplierDetails();

  const { data: dataSupplierDetails, isLoading: isLoadingSupplierDetails } =
    useGetSupplierDetails(id);

  useEffect(() => {
    if (!isLoadingSupplierDetails && !dataSupplierDetails) {
      notify('error', 'Nie znaleziono dostawcy o podanym ID');
      navigate(Pages.smSystemSuppliers);
    }
  }, [dataSupplierDetails, isLoadingSupplierDetails, navigate, notify]);

  useEffect(() => {
    if (!isLoadingSupplierDetails && dataSupplierDetails) {
      setSelectedBranches(
        dataSupplierDetails.branches.map((branch) => branch.id)
      );
    }
  }, [dataSupplierDetails, isLoadingSupplierDetails]);

  const handleSave = async () => {
    const id = dataSupplierDetails?.id ?? 0;
    if (!id) return;

    await updateSupplierDetails({
      id,
      branchesIds: selectedBranchIds,
    });

    notify('success', 'Dane dostawcy zapisane');
  };

  const originalSelectedBranchIds = useMemo(
    () => dataSupplierDetails?.branches.map((branch) => branch.id) ?? [],
    [dataSupplierDetails]
  );

  const isBranchesIdsChanged = useMemo(
    () =>
      originalSelectedBranchIds.length !== selectedBranchIds.length ||
      originalSelectedBranchIds.some((id) => !selectedBranchIds.includes(id)),
    [originalSelectedBranchIds, selectedBranchIds]
  );

  return (
    <Stack>
      <Stack width="100%" spacing={2} height={491}>
        <Stack direction="row" spacing={3} alignItems="center">
          <Button
            variant="outlined"
            onClick={() => navigate(Pages.smSystemSuppliers)}
          >
            {'Powrót'}
          </Button>
          <Typography variant="h5" flex={1}>
            {'Dostawca: '}
            {dataSupplierDetails?.name}
          </Typography>

          <Button
            variant="contained"
            onClick={handleSave}
            loading={isSaving}
            disabled={!isBranchesIdsChanged}
          >
            {'Zapisz'}
          </Button>
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
