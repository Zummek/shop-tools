import { LoadingButton } from '@mui/lab';
import { Box, Modal, Stack, TextField, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';

import { modalStyle } from '../../../../components';
import { useNotify } from '../../../../hooks';
import { useGetProducts } from '../../products/api';
import { Product } from '../../products/types';
import { useUpdatePriceTagGroup } from '../api';

interface Props {
  open: boolean;
  onClose: () => void;
  groupId: string | undefined;
  originallySelectedProductIds: number[];
}

const columns: GridColDef<Product>[] = [
  { field: 'internalId', headerName: 'ID wewnętrzny', width: 150 },
  { field: 'name', headerName: 'Nazwa produktu', width: 300, flex: 1 },
];

export const AddProductToPriceTagGroupModal = ({
  open,
  onClose,
  groupId,
  originallySelectedProductIds,
}: Props) => {
  const { notify } = useNotify();
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>(
    originallySelectedProductIds
  );

  useEffect(() => {
    setSelectedProductIds(originallySelectedProductIds);
  }, [originallySelectedProductIds]);

  const { products, isLoading, setQuery, query, setPage, page, totalCount } =
    useGetProducts();

  const { updatePriceTagGroup, isPending } = useUpdatePriceTagGroup({
    groupId,
  });

  const handleCloseModal = () => {
    onClose();
    setSelectedProductIds([]);
    setQuery('');
  };

  const handleSelectionChange = (rowSelectionModel: GridRowSelectionModel) => {
    setSelectedProductIds(rowSelectionModel as number[]);
  };

  const handleUpdateProductsGroup = async () => {
    await updatePriceTagGroup({
      productIds: selectedProductIds,
    });
    notify('success', 'Produkty zostały zmodyfikowane');
    handleCloseModal();
  };

  return (
    <Modal open={open} onClose={handleCloseModal}>
      <Stack sx={modalStyle({ width: 800 })} spacing={3}>
        <Typography variant="h4" align="center">
          {'Zaktualizuj produkty w grupie'}
        </Typography>

        <TextField
          label="Wyszukaj produkty"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Wpisz nazwę lub kod kreskowy..."
          fullWidth
        />

        <Box height={400}>
          <DataGrid
            rows={products || []}
            columns={columns}
            loading={isLoading}
            checkboxSelection
            disableColumnSorting
            disableColumnMenu
            onRowSelectionModelChange={handleSelectionChange}
            rowSelectionModel={selectedProductIds}
            localeText={{
              noRowsLabel: 'Brak produktów',
            }}
            paginationModel={{
              page,
              pageSize: 25,
            }}
            paginationMode="server"
            onPaginationModelChange={(model) => {
              setPage(model.page);
            }}
            rowCount={totalCount || 0}
          />
        </Box>

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <LoadingButton variant="outlined" onClick={handleCloseModal}>
            {'Anuluj'}
          </LoadingButton>
          <LoadingButton
            variant="contained"
            onClick={handleUpdateProductsGroup}
            disabled={selectedProductIds.length === 0}
            loading={isPending}
          >
            {'Zaktualizuj produkty'}
          </LoadingButton>
        </Stack>
      </Stack>
    </Modal>
  );
};
