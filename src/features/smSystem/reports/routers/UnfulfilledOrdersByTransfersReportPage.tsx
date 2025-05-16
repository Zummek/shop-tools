import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridColumnHeaderParams,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

import { camelToSnakeCase, Pages, snakeToCamelCase } from '../../../../utils';
import { BranchSelector } from '../../branches/components';
import {
  UnfulfilledOrdersByTransfersReportItem,
  UnfulfilledOrdersByTransfersReportSortBy,
  UnfulfilledOrdersByTransfersReportSortOrder,
  useGetUnfulfilledOrdersByTransfersReport,
} from '../api';

const renderWrappedHeader = (
  params: GridColumnHeaderParams<UnfulfilledOrdersByTransfersReportItem>
) => (
  <Typography variant="caption" sx={{ whiteSpace: 'normal', lineHeight: 1.2 }}>
    {params.colDef.headerName}
  </Typography>
);

const columns: GridColDef<UnfulfilledOrdersByTransfersReportItem>[] = [
  {
    field: 'productName',
    headerName: 'Produkt',
    minWidth: 250,
    renderCell: (params) => params.row.product.name,
    renderHeader: renderWrappedHeader,
    disableColumnMenu: true,
  },
  {
    field: 'orderCount',
    headerName: 'Liczba zamówień',
    type: 'number',
    renderHeader: renderWrappedHeader,
    disableColumnMenu: true,
  },
  {
    field: 'transferCount',
    headerName: 'Liczba transferów',
    type: 'number',
    renderHeader: renderWrappedHeader,
    disableColumnMenu: true,
  },
  {
    field: 'orderedProductsCount',
    headerName: 'Liczba produktów zamówionych',
    type: 'number',
    renderHeader: renderWrappedHeader,
    disableColumnMenu: true,
  },
  {
    field: 'receivedProductsCount',
    headerName: 'Liczba produktów odebranych',
    type: 'number',
    renderHeader: renderWrappedHeader,
    disableColumnMenu: true,
  },
  {
    field: 'undeliveredProductsCount',
    headerName: 'Liczba produktów niezrealizowanych',
    type: 'number',
    renderHeader: renderWrappedHeader,
    disableColumnMenu: true,
  },
  {
    field: 'undeliveredProductsPercent',
    headerName: 'Procent niezrealizowanych produktów',
    renderHeader: renderWrappedHeader,
    type: 'number',
    disableColumnMenu: true,
    renderCell: (params) => (
      <Box
        alignItems="center"
        display="flex"
        justifyContent="flex-end"
        height="100%"
      >
        <Typography
          color={
            params.row.undeliveredProductsPercent > 0 ? 'error' : 'inherit'
          }
          variant="body2"
        >{`${params.row.undeliveredProductsPercent}%`}</Typography>
      </Box>
    ),
  },
];

export const UnfulfilledOrdersByTransfersReportPage = () => {
  const {
    data,
    isLoading,
    page,
    setPage,
    pageSize,
    setPageSize,
    branchSourceId,
    setBranchSourceId,
    branchDestinationId,
    setBranchDestinationId,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    filterPhrase,
    setFilterPhrase,
    setSortBy,
    setSortOrder,
    sortBy,
    sortOrder,
    showOnlyPosted,
    setShowOnlyPosted,
  } = useGetUnfulfilledOrdersByTransfersReport();

  const destinationBranchError =
    !!branchSourceId && branchSourceId === branchDestinationId
      ? 'Oddział źródłowy i docelowy nie mogą być tym samym oddziałem'
      : undefined;

  const handleStartDateChange = (date: Dayjs | null) => {
    setStartDate(date?.toDate() || null);
  };

  const handleEndDateChange = (date: Dayjs | null) => {
    setEndDate(date?.toDate() || null);
  };

  const handleSortModelChange = (model: GridSortModel) => {
    if (!model.length) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      return;
    }

    setSortBy(
      camelToSnakeCase(
        model[0].field
      ) as UnfulfilledOrdersByTransfersReportSortBy
    );
    setSortOrder(model[0].sort as UnfulfilledOrdersByTransfersReportSortOrder);
  };

  const handlePaginationModelChange = (model: GridPaginationModel) => {
    setPage(model.page + 1);
    setPageSize(model.pageSize);
  };

  const handleSwapBranches = () => {
    const tempBranchSourceId = branchSourceId;
    setBranchSourceId(branchDestinationId);
    setBranchDestinationId(tempBranchSourceId);
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Button variant="outlined" href={`#${Pages.smSystemReports}`}>
          {'Powrót do raportów'}
        </Button>
      </Box>

      <Stack direction="row" columnGap={4} rowGap={3} flexWrap="wrap">
        <Stack direction="row" alignItems="center" gap={1}>
          <BranchSelector
            selectedBranchId={branchSourceId}
            onChange={(branchId) => setBranchSourceId(branchId)}
            label="Oddział źródłowy"
          />
          <IconButton onClick={handleSwapBranches}>
            <SwapHorizOutlinedIcon />
          </IconButton>
          <BranchSelector
            selectedBranchId={branchDestinationId}
            onChange={(branchId) => setBranchDestinationId(branchId)}
            label="Oddział docelowy"
            error={destinationBranchError}
          />
        </Stack>
        <DatePicker
          label="Data początkowa"
          value={startDate ? dayjs(startDate) : null}
          onChange={handleStartDateChange}
          disableFuture
          format="DD.MM.YYYY"
          sx={{ width: 200 }}
        />
        <DatePicker
          label="Data końcowa"
          value={endDate ? dayjs(endDate) : null}
          onChange={handleEndDateChange}
          disableFuture
          format="DD.MM.YYYY"
          sx={{ width: 200 }}
        />
        <Box sx={{ width: 300 }}>
          <FormControl fullWidth>
            <InputLabel shrink>{'Nazwa produktu'}</InputLabel>
            <TextField
              placeholder="Filtruj po nazwie produktu"
              label="Nazwa produktu"
              value={filterPhrase}
              onChange={(e) => setFilterPhrase(e.target.value)}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </FormControl>
        </Box>
        <Stack>
          <FormControlLabel
            control={
              <Checkbox
                checked={showOnlyPosted}
                onChange={(e) => setShowOnlyPosted(e.target.checked)}
              />
            }
            label="Pokaż tylko zaksięgowane zamówienia"
          />
          <FormHelperText
            sx={{
              mt: 0,
              fontSize: '12px',
              maxWidth: 400,
            }}
          >
            {'Domyślnie: przygotowane, odebrane oraz zaksięgowane.'}
          </FormHelperText>
        </Stack>
      </Stack>

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={data?.results || []}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50, 100]}
          getRowId={(row) => row.product.id}
          pagination
          paginationModel={{ page: page - 1, pageSize }}
          onPaginationModelChange={handlePaginationModelChange}
          rowCount={data?.count || 0}
          paginationMode="server"
          sortingMode="server"
          onSortModelChange={handleSortModelChange}
          sortModel={[
            {
              field: snakeToCamelCase(sortBy),
              sort: sortOrder,
            },
          ]}
        />
      </Box>
    </Stack>
  );
};
