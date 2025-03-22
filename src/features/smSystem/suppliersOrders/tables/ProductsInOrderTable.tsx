import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useEffect } from 'react';

import { ProductsInOrderTableProps } from '../../app/types';

const ProductsInOrderTable = ({
  products,
  selectedProductId,
  setSelectedProductId,
}: ProductsInOrderTableProps) => {
  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 50,
    },
    {
      field: 'name',
      headerName: 'Nazwa produktu',
      width: 200,
    },
    {
      field: 'totalToOrder',
      headerName: 'Suma',
      width: 60,
    },
    {
      field: 'action',
      headerName: '',
      width: 50,
      renderCell: () => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <ChevronRightIcon style={{ fontSize: 30 }} />
        </div>
      ),
    },
  ];

  const handleRowClick = (params: GridRowParams) => {
    setSelectedProductId(params.row.id);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' && selectedProductId !== 0) {
        const currentIndex = products.findIndex(
          (product) => product.id === selectedProductId
        );

        if (currentIndex !== -1 && currentIndex < products.length - 1)
          setSelectedProductId(products[currentIndex + 1].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [products, selectedProductId, setSelectedProductId]);

  return (
    <DataGrid
      rows={products}
      columns={columns}
      disableColumnSorting
      disableColumnMenu
      disableRowSelectionOnClick
      onRowClick={handleRowClick}
      hideFooter
      getRowClassName={(params: GridRowParams) =>
        params.row.id === selectedProductId ? 'selected-row' : ''
      }
      sx={{
        '& .selected-row': {
          backgroundColor: '#ebebeb',
        },
      }}
      localeText={{
        noRowsLabel: 'Brak produktów',
      }}
    />
  );
};

export default ProductsInOrderTable;
