import { DataGrid, GridColDef, GridRowModel } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';

import { ProductDetailsInOrderTableProps } from '../types/index';

const ProductDetailsInOrderTable = ({
  editableOrderDetails,
  setEditableOrderDetails,
  selectedProductLp,
  setSelectedProductLp,
}: ProductDetailsInOrderTableProps) => {
  const [errorRows, setErrorRows] = useState<number[]>([]);

  const handleRowEdit = (updatedRow: GridRowModel) => {
    setEditableOrderDetails((prevOrder) => {
      if (!prevOrder) return prevOrder;

      const updatedProducts = prevOrder.productsInOrder.map((prod) => {
        if (prod.lp !== selectedProductLp) return prod;

        const updatedOrders = prod.ordersPerBranch.map((order) => {
          if (order.branch.id !== updatedRow.id) return order;
          if (order.toOrder === null) return order;

          const newToOrder = Number(updatedRow.toOrder);
          const isValidInput = Number.isInteger(newToOrder) && newToOrder >= 0;
          const error = !isValidInput;

          if (error) {
            setErrorRows((prevErrorRows) => {
              const newErrorRows = [...prevErrorRows, order.branch.id];
              setTimeout(() => {
                setErrorRows((prevErrorRows) =>
                  prevErrorRows.filter((id) => id !== order.branch.id)
                );
              }, 1500);
              return newErrorRows;
            });

            return {
              ...order,
              toOrder: order.toOrder,
              error: true,
            };
          }

          return {
            ...order,
            toOrder: newToOrder,
            error: false,
          };
        });

        return {
          ...prod,
          ordersPerBranch: updatedOrders,
          totalToOrder: updatedOrders.reduce(
            (sum, order) => sum + (order.toOrder ?? 0),
            0
          ),
        };
      });

      return {
        ...prevOrder,
        productsInOrder: updatedProducts,
      };
    });

    return updatedRow;
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        setSelectedProductLp((prevSelectedProduct) => {
          if (!prevSelectedProduct) return 0;

          const nextProductLp = prevSelectedProduct + 1;
          if (nextProductLp <= editableOrderDetails.productsInOrder.length)
            return nextProductLp;

          return prevSelectedProduct;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editableOrderDetails, setSelectedProductLp]);

  const product = editableOrderDetails.productsInOrder.find(
    (productInOrder) => productInOrder.lp === selectedProductLp
  );

  if (!product) {
    setSelectedProductLp(0);
    return null;
  }

  const rows = product.ordersPerBranch.map((order) => ({
    id: order.branch.id,
    branch: order.branch.name,
    toOrderProp: order.originalToOrder,
    toOrder: order.toOrder,
    stock: order.stockAmountAtOrderTime,
  }));

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 50 },
    { field: 'branch', headerName: 'Sklep', width: 100 },
    { field: 'stock', headerName: 'Stan', width: 100 },
    { field: 'sales', headerName: 'Sprzedaż', width: 100 },
    { field: 'toOrderProp', headerName: 'Propozycja', width: 100 },
    { field: 'toOrder', headerName: 'Ilość', width: 100, editable: true },
  ];

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      disableColumnSorting
      disableColumnMenu
      disableRowSelectionOnClick
      hideFooter
      processRowUpdate={handleRowEdit}
      initialState={{
        sorting: {
          sortModel: [{ field: 'id', sort: 'asc' }],
        },
      }}
      getRowClassName={(params) =>
        errorRows.includes(params.row.id) ? 'error-row' : ''
      }
    />
  );
};

export default ProductDetailsInOrderTable;
