import { Checkbox } from '@mui/material';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { useState } from 'react';

import { Supplier } from '../../../app/types';

const BranchesTable = ({
  data,
  selectedBranches,
  handleCheckboxChange,
}: {
  data: Supplier;
  selectedBranches: number[];
  handleCheckboxChange: (branchId: number) => void;
}) => {
  const [page, setPage] = useState(0);
 
  const rows = data.branches
    .map((branch) => {
      return {
        id: branch.id,
        name: branch.name,
    };
  });

  const handlePaginationChange = (model: GridPaginationModel) => {
    setPage(model.page);
  };
  
  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 70,
    },
    {
      field: 'name',
      headerName: 'sklep',
      width: 400,
    },
    {
      field: 'actionSelect',
      headerName: '',
      width: 50,
      renderCell: ({ row }: { row: {id: number, name: string} }) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <Checkbox
            checked={selectedBranches.includes(row.id)}
            onChange={() => handleCheckboxChange(row.id)}
            style={{ fontSize: 50 }}
          />
        </div>
      ),
    },
  ];

  if (!data) {
    return (
      <DataGrid
        rows={[]}
        columns={columns}
        disableColumnSorting
        disableColumnMenu
        disableRowSelectionOnClick
        pagination
        pageSizeOptions={[5]}
        paginationModel={{ page, pageSize: 5 }}
        localeText={{
          noRowsLabel: 'Brak sklepów',
        }}
      />
    );
  }

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      disableColumnSorting
      disableColumnMenu
      disableRowSelectionOnClick
      pagination
      pageSizeOptions={[5]}
      paginationModel={{ page, pageSize: 5 }}
      onPaginationModelChange={handlePaginationChange}
      localeText={{
        noRowsLabel: 'Brak dostawców',
      }}
    />
  );
};

export default BranchesTable;
