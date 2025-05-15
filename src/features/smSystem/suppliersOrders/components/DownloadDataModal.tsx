import { Button, Modal, Stack, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useState } from 'react';

import { OrderDetails } from '../../app/types';

interface Props {
  open: boolean;
  handleClose: () => void;
  orderDetails: OrderDetails | undefined;
}

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  paddingX: 6,
  paddingY: 4,
  width: 535,
  display: 'flex',
  flexDirection: 'column',
};

const generateTxtFile = (content: string, fileName: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const columns: GridColDef[] = [
  {
    field: 'name',
    headerName: 'Sklep',
    width: 400,
  },
];

export const DownloadDataModal = ({
  open,
  handleClose,
  orderDetails,
}: Props) => {
  const [selectedBranches, setSelectedBranches] = useState<number[]>([]);

  const handleRowSelectionModelChange = (
    selectedBranchesIds: GridRowSelectionModel
  ) => {
    setSelectedBranches(selectedBranchesIds as number[]);
  };

  const handleDownload = () => {
    if (!orderDetails) return;
    if (selectedBranches.length === 0) return;

    const filteredProducts = orderDetails.productsToOrder
      .map((product) => {
        const totalToOrder = product.ordersPerBranch
          .filter((opb) => selectedBranches.includes(opb.branch.id))
          .reduce((sum, opb) => sum + opb.toOrderAmount, 0);

        return {
          name: product.name,
          totalToOrder,
        };
      })
      .filter((product) => product.totalToOrder > 0);

    if (filteredProducts.length === 0) return;

    const branchesNames = orderDetails.selectedBranches
      .filter((branch) => selectedBranches.includes(branch.id))
      .map((branch) => branch.name)
      .join(', ');

    const supplierName = orderDetails?.supplier.name;
    const date = dayjs(orderDetails?.updatedAt).format('DD.MM.YYYY HH:mm');

    const content =
      `${supplierName} ${date} ${branchesNames}\n\n` +
      filteredProducts
        .map(
          (product, index) =>
            `${index + 1}. ${product.name}\tx${product.totalToOrder}`
        )
        .join('\n');

    const fileName = `${supplierName}-${branchesNames}.txt`;
    generateTxtFile(content, fileName);
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Stack sx={modalStyle} spacing={3}>
        <Typography variant="h4" align="center">
          {'Wybierz sklepy'}
        </Typography>

        <DataGrid
          rows={orderDetails?.selectedBranches || []}
          columns={columns}
          disableColumnSorting
          disableColumnMenu
          rowSelection
          checkboxSelection
          pagination
          pageSizeOptions={[25]}
          onRowSelectionModelChange={handleRowSelectionModelChange}
          localeText={{
            noRowsLabel: 'Brak sklepów',
          }}
        />
        <Button variant="contained" onClick={handleDownload}>
          {'Pobierz'}
        </Button>
      </Stack>
    </Modal>
  );
};
