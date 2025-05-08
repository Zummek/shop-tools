import { Stack, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRowModel } from '@mui/x-data-grid';
import { useState } from 'react';

import { ProductDetailsInOrderTableProps } from '../../app/types';
import { useUpdateOrderDetails } from '../api/useUpdateOrderDetails';

const ProductDetailsInOrderTable = ({
  orderDetails,
  selectedProductId,
  setSelectedProductId,
}: ProductDetailsInOrderTableProps) => {
  const [errorRows, setErrorRows] = useState<number[]>([]);

  const getDate = (rowDate: string) => {
    const dateObj = new Date(rowDate);
    const date = `${dateObj.toLocaleDateString('pl-PL')} ${dateObj.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })}`;
    return date
  }

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 50 },
    { field: 'branch', headerName: 'Sklep', width: 100 },
    { field: 'stock', headerName: 'Stan', width: 70 },
    { field: 'stockUpdatedAt', headerName: 'Ostatnia\naktualizacja\nstanu', width: 150 },
    { field: 'sales', headerName: 'Sprzedaż', width: 100 },
    { field: 'toOrderProp', headerName: 'Proponowana\nilość', width: 110 },
    { field: 'toOrder', headerName: 'Zamawiana\nilość', width: 110, editable: true },
  ];

  const { updateOrderDetails, isLoading, isError } = useUpdateOrderDetails();

  const processRowUpdate = (updatedRow: GridRowModel) => {
    const updatedProduct = orderDetails.products_to_order.find(
      (prod) => prod.id === selectedProductId
    );

    if (updatedProduct) {
      const updatedOrder = updatedProduct.orders_per_branch.find(
        (order) => order.branch.id === updatedRow.id
      );

      if (updatedOrder) {
        const newToOrder = Number(updatedRow.toOrder);
        const isValidInput = Number.isInteger(newToOrder) && newToOrder >= 0;
        const error = !isValidInput;

        if (error) {
          setErrorRows((prevErrorRows) => {
            const newErrorRows = [...prevErrorRows, updatedOrder.branch.id];
            setTimeout(() => {
              setErrorRows((prevErrorRows) =>
                prevErrorRows.filter((id) => id !== updatedOrder.branch.id)
              );
            }, 1500);
            return newErrorRows;
          });
        } else {
          updateOrderDetails({
            orderId: orderDetails.id,
            branchId: updatedOrder.branch.id,
            productId: updatedProduct.id,
            toOrderAmount: newToOrder,
          });
        }
      }
    }
  };

  const product = orderDetails.products_to_order.find(
    (productInOrder) => productInOrder.id === selectedProductId
  );

  if (!product) {
    setSelectedProductId(0);
    return (
      <DataGrid
        rows={[]}
        columns={columns}
        disableColumnSorting
        disableColumnMenu
        disableRowSelectionOnClick
        hideFooter
        localeText={{
          noRowsLabel: 'Wybierz produkt',
        }}
        sx={{
          '& .MuiDataGrid-columnHeaderTitle': {
            whiteSpace: 'normal',
            lineHeight: 'normal',
          },
          '& .MuiDataGrid-cell': {
            display: 'flex',
            alignItems: 'center',
          },
        }}
      />
    );
  }

  const rows = product.orders_per_branch.map((order) => ({
    id: order.branch.id,
    branch: order.branch.name,
    stock: order.stock,
    stockUpdatedAt: getDate(order.stock_updated_at),
    toOrderProp: order.to_order_proposal_amount,
    toOrder: order.to_order_amount,
  }));

  return (
    <Stack>
      <Stack height={214}>
        <DataGrid
          rows={rows}
          columns={columns}
          disableColumnSorting
          disableColumnMenu
          disableRowSelectionOnClick
          hideFooter
          processRowUpdate={(updatedRow: GridRowModel) => {
            processRowUpdate(updatedRow);
            return updatedRow;
          }}
          initialState={{
            sorting: {
              sortModel: [{ field: 'id', sort: 'asc' }],
            },
          }}
          getRowClassName={(params) =>
            errorRows.includes(params.row.id) ? 'error-row' : ''
          }
          sx={{
            '& .error-row': {
              backgroundColor: '#ffcccc',
              color: '#900',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              whiteSpace: 'normal',
              lineHeight: 'normal',
            },
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
            },
          }}
          localeText={{
            noRowsLabel: 'Brak sklepów',
          }}
        />
      </Stack>
      <Stack>
        {isLoading && (
          <Typography
            variant="h6"
            color="primary"
            sx={{ textAlign: 'center', marginTop: 1 }}
          >
            {'Trwa Zapisywanie'}
          </Typography>
        )}
        {isError && (
          <Typography
            variant="h6"
            color="primary"
            sx={{ textAlign: 'center', marginTop: 1 }}
          >
            {'Błąd zapisu'}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
};

export default ProductDetailsInOrderTable;
