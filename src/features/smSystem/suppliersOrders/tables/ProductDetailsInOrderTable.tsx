import { Stack, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRowModel } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useState, useCallback, useEffect } from 'react';

import { ProductDetailsInOrderTableProps } from '../../app/types';
import { useUpdateOrderDetails } from '../api/useUpdateOrderDetails';

export const ProductDetailsInOrderTable = ({
  orderDetails,
  selectedProductId,
  setSelectedProductId,
}: ProductDetailsInOrderTableProps) => {
  const [errorRows, setErrorRows] = useState<Set<number>>(new Set());

  const { updateOrderDetails, isLoading, isError } = useUpdateOrderDetails();

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 50 },
    { field: 'branch', headerName: 'Sklep', width: 100 },
    { field: 'stock', headerName: 'Stan', width: 70 },
    { field: 'stockUpdatedAt', headerName: 'Ostatnia\naktualizacja\nstanu', width: 150 },
    { field: 'sales', headerName: 'Sprzedaż', width: 100 },
    { field: 'toOrderProp', headerName: 'Proponowana\nilość', width: 110 },
    { field: 'toOrder', headerName: 'Zamawiana\nilość', width: 110, editable: true },
  ];

  const processRowUpdate = useCallback(
    (updatedRow: GridRowModel) => {
      const updatedProduct = orderDetails.productsToOrder.find(
        (prod) => prod.id === selectedProductId
      );

      if (updatedProduct) {
        const updatedOrder = updatedProduct.ordersPerBranch.find(
          (order) => order.branch.id === updatedRow.id
        );

        if (updatedOrder) {
          const newToOrder = Number(updatedRow.toOrder);
          const isValidInput = Number.isInteger(newToOrder) && newToOrder >= 0;
          const error = !isValidInput;

          setErrorRows((prevErrorRows) => {
            const newErrorRows = new Set(prevErrorRows);
            if (error) {
              newErrorRows.add(updatedOrder.branch.id);
              setTimeout(() => {
                setErrorRows((prevErrorRows) => {
                  const updated = new Set(prevErrorRows);
                  updated.delete(updatedOrder.branch.id);
                  return updated;
                });
              }, 1500);
            }
            else {
              newErrorRows.delete(updatedOrder.branch.id);
            }
            
            return newErrorRows;
          });

          if (!error) {
            updateOrderDetails({
              orderId: orderDetails.id,
              branchId: updatedOrder.branch.id,
              productId: updatedProduct.id,
              toOrderAmount: newToOrder,
            });
          }
        }
      }

      return updatedRow;
    },
    [orderDetails, selectedProductId, updateOrderDetails]
  );

  const product = orderDetails.productsToOrder.find(
    (productInOrder) => productInOrder.id === selectedProductId
  );

  useEffect(() => {
    if (!product) 
      setSelectedProductId(0);
  }, [product, setSelectedProductId]);

  if (!product) {
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

  const rows = product.ordersPerBranch.map((order) => ({
    id: order.branch.id,
    branch: order.branch.name,
    stock: order.stock,
    stockUpdatedAt: dayjs(order.stockUpdatedAt).format('DD.MM.YYYY HH:MM'),
    toOrderProp: order.toOrderProposalAmount,
    toOrder: order.toOrderAmount,
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
          processRowUpdate={processRowUpdate}
          initialState={{
            sorting: {
              sortModel: [{ field: 'id', sort: 'asc' }],
            },
          }}
          getRowClassName={(params) =>
            errorRows.has(params.row.id) ? 'error-row' : ''
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
