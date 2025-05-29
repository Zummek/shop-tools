import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { IconButton, Stack, Typography } from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridPreProcessEditCellProps,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useCallback } from 'react';

import { OrderDetails, SimpleBranch, OrdersPerBranch } from '../../app/types';
import { useUpdateOrderDetails } from '../api/useUpdateOrderDetails';


const getDaysBetweenDates = (start: string, end: string): number => {
  return (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24);
};

const getColumns = (orderDetails?: OrderDetails): GridColDef[] => {
  const days = orderDetails
    ? getDaysBetweenDates(orderDetails.saleStartDate, orderDetails.saleEndDate)
    : '?';

  return [
  {
    field: 'branch',
    headerName: 'Sklep',
    flex: 1,
    minWidth: 80,
    valueGetter: (value: SimpleBranch) => value.name,
  },
  {
    field: 'soldQuantity',
    headerName: `Sprzedaż\n${days} dni`,
    type: 'number',
  },
  {
    field: 'previousOrderAmount',
    headerName: 'Poprzednie\nzamówienie',
    type: 'number',
    renderCell: ({ value }: GridRenderCellParams) => {
      return (
        <Typography
          variant="body2"
          color={value !== null ? 'text' : 'textDisabled'}
        >
          {value !== null ? value : 'brak'}
        </Typography>
      );
    },
  },
  {
    field: 'toOrderProposalAmount',
    headerName: 'Proponowana\nilość',
    type: 'number',
  },
  {
    field: 'toOrderAmount',
    headerName: 'Zamawiana\nilość',
    editable: true,
    type: 'number',
    renderCell: ({ value, api, row }: GridRenderCellParams) => (
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        width="100%"
        justifyContent="space-between"
      >
        <IconButton
          size="small"
          onClick={() =>
            api.startCellEditMode({ id: row.id, field: 'toOrderAmount' })
          }
          sx={{
            opacity: 0,
            transition: 'opacity 0.2s',
            '.MuiDataGrid-row:hover &': {
              opacity: 0.5,
            },
          }}
        >
          <EditOutlinedIcon />
        </IconButton>
        <Typography variant="body2" align="right">
          {value}
        </Typography>
      </Stack>
    ),
    preProcessEditCellProps: (params: GridPreProcessEditCellProps) => {
      const newToOrder = Number(params.props.value);
      const isValidInput = Number.isInteger(newToOrder) && newToOrder >= 0;

      return {
        ...params.props,
        error: !isValidInput,
      };
    },
  },
  {
    field: 'stock',
    headerName: 'Stan',
    width: 70,
    type: 'number',
  },
  {
    field: 'stockUpdatedAt',
    headerName: 'Ostatnia\naktualizacja stanu',
    width: 150,
    valueGetter: (value: string) => dayjs(value).format('DD.MM.YYYY HH:mm'),
  },
]};

interface Props {
  orderDetails: OrderDetails | undefined;
  selectedProductId: number | null;
  onEditStateChange: (isEditing: boolean) => void;
  isLoading: boolean;
}

export const ProductDetailsInOrderTable = ({
  orderDetails,
  selectedProductId,
  onEditStateChange,
  isLoading,
}: Props) => {
  const { updateOrderDetails, isLoading: isSaving } = useUpdateOrderDetails();

  const processRowUpdate = useCallback(
    async (updatedOrderPerBranch: OrdersPerBranch) => {
      if (!orderDetails) throw new Error('Order details not found');
      if (!selectedProductId) throw new Error('Product ID not found');

      try {
        onEditStateChange(true);

        await updateOrderDetails({
          orderId: orderDetails.id,
          branchId: updatedOrderPerBranch.branch.id,
          productId: selectedProductId,
          toOrderAmount: Number(updatedOrderPerBranch.toOrderAmount),
        });

        return updatedOrderPerBranch;
      } finally {
        onEditStateChange(false);
      }
    },
    [orderDetails, selectedProductId, updateOrderDetails, onEditStateChange]
  );

  const handleEditStart = useCallback(() => {
    onEditStateChange(true);
  }, [onEditStateChange]);

  const product = orderDetails?.productsToOrder.find(
    (productInOrder) => productInOrder.id === selectedProductId
  );

  return (
    <Stack>
      <Stack height={300}>
        <DataGrid
          rows={product?.ordersPerBranch ?? []}
          columns={getColumns(orderDetails)}
          disableColumnSorting
          disableColumnMenu
          disableRowSelectionOnClick
          hideFooter
          processRowUpdate={processRowUpdate}
          onCellEditStart={handleEditStart}
          loading={isLoading || isSaving}
          sx={{
            '& .MuiDataGrid-columnHeaderTitle': {
              whiteSpace: 'normal',
              lineHeight: 'normal',
            },
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
            },
            '& .MuiDataGrid-cell--editing': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
            '& .MuiDataGrid-cell--editing.error': {
              backgroundColor: '#ffcccc',
            },
          }}
          localeText={{
            noRowsLabel: 'Brak sklepów',
          }}
        />
      </Stack>
    </Stack>
  );
};
