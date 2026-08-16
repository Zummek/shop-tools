import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { IconButton, Stack, Tooltip, Typography } from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridPreProcessEditCellProps,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { MouseEvent, useCallback, useMemo } from 'react';

import { useUpdateOrderDetails } from '../api';
import {
  OrderDetails,
  SimpleBranch,
  OrdersPerBranch,
  ProposalExplanation,
} from '../types';
import {
  getStockUrgencyClassName,
  resolveStockUrgencyThresholds,
  stockUrgencyRowSx,
} from '../utils/stockUrgency';

const formatExplanation = (explanation?: ProposalExplanation | null) => {
  if (!explanation) return 'Brak uzasadnienia propozycji';

  const note = explanation.note ? `${explanation.note} ` : '';
  const stockDays =
    explanation.daysOfStock != null
      ? `stan starczy na ${explanation.daysOfStock} dni`
      : 'brak stanu';

  if (
    explanation.source === 'velocity' ||
    explanation.source === 'velocity+trend' ||
    explanation.source === 'velocity+stockout'
  ) {
    const rates =
      explanation.previousRate != null && explanation.recentRate != null
        ? `tempo: ${explanation.recentRate}/dzień (poprzednio ${explanation.previousRate}/dzień)`
        : `sprzedaż ~${explanation.dailyRate}/dzień`;
    return `${note}${rates}, ${stockDays}, pokrycie ${explanation.coverageDays} dni → zamów ${explanation.proposal}`;
  }
  if (explanation.source === 'condition')
    return `${note}Brak sprzedaży w oknie — użyto warunku stanowego. Propozycja: ${explanation.proposal}`;

  return `${note}Brak sprzedaży i warunków — propozycja 0`;
};

const TrendIcon = ({ trend }: { trend?: 'up' | 'down' | 'stable' | null }) => {
  if (trend === 'up')
    return <TrendingUpIcon fontSize="small" color="success" />;
  if (trend === 'down')
    return <TrendingDownIcon fontSize="small" color="error" />;
  if (trend === 'stable')
    return <TrendingFlatIcon fontSize="small" color="disabled" />;
  return null;
};

const getColumns = (
  orderDetails: OrderDetails | undefined,
  onAcceptProposal: (row: OrdersPerBranch) => void,
  isSaving: boolean,
): GridColDef[] => {
  const days =
    orderDetails?.saleStartDate && orderDetails?.saleEndDate
      ? `${dayjs(orderDetails.saleEndDate).diff(orderDetails.saleStartDate, 'days')} dni`
      : '';

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
      headerName: `Sprzedaż\n${days}`,
      type: 'number',
    },
    {
      field: 'daysOfStock',
      headerName: 'Stan starczy na (dni)',
      type: 'number',
      width: 140,
      renderHeader: () => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography variant="inherit" lineHeight={1.2}>
            {'Stan starczy'}
            <br />
            {'na (dni)'}
          </Typography>
          <Tooltip title="Ile dni wystarczy obecny stan magazynowy przy sprzedaży z wybranego okna. Kreska oznacza brak sprzedaży — wtedy nie da się tego wyliczyć. Czerwony/pomarańczowy wiersz oznacza niski stan względem ustawień dostawcy (czas dostawy, zapas, okres przeglądu).">
            <InfoOutlinedIcon
              fontSize="small"
              color="action"
              sx={{ cursor: 'help' }}
            />
          </Tooltip>
        </Stack>
      ),
      renderCell: ({ value }: GridRenderCellParams) => (
        <Typography
          variant="body2"
          color={value == null ? 'textDisabled' : 'text'}
        >
          {value == null ? '—' : value}
        </Typography>
      ),
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
      minWidth: 140,
      renderCell: ({ value, row }: GridRenderCellParams<OrdersPerBranch>) => {
        const differs = row.toOrderAmount !== row.toOrderProposalAmount;
        const handleAccept = (event: MouseEvent) => {
          event.stopPropagation();
          onAcceptProposal(row);
        };

        return (
          <Stack direction="row" alignItems="center" spacing={0.5} width="100%">
            <Tooltip title={formatExplanation(row.explanation)}>
              <InfoOutlinedIcon fontSize="small" color="action" />
            </Tooltip>
            <TrendIcon trend={row.explanation?.trend} />
            <Typography variant="body2" flex={1}>
              {value}
            </Typography>
            {differs && (
              <Tooltip title="Zastosuj propozycję">
                <span>
                  <IconButton
                    size="small"
                    color="success"
                    onClick={handleAccept}
                    disabled={isSaving}
                    aria-label="Zastosuj propozycję"
                  >
                    <CheckOutlinedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Stack>
        );
      },
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
  ];
};

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
  const urgencyThresholds = useMemo(
    () => resolveStockUrgencyThresholds(orderDetails?.supplier),
    [orderDetails?.supplier],
  );

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
    [orderDetails, selectedProductId, updateOrderDetails, onEditStateChange],
  );

  const handleAcceptProposal = useCallback(
    async (row: OrdersPerBranch) => {
      if (!orderDetails || !selectedProductId) return;
      if (row.toOrderAmount === row.toOrderProposalAmount) return;

      try {
        onEditStateChange(true);
        await updateOrderDetails({
          orderId: orderDetails.id,
          branchId: row.branch.id,
          productId: selectedProductId,
          toOrderAmount: Number(row.toOrderProposalAmount),
        });
      } finally {
        onEditStateChange(false);
      }
    },
    [orderDetails, selectedProductId, updateOrderDetails, onEditStateChange],
  );

  const columns = useMemo(
    () => getColumns(orderDetails, handleAcceptProposal, isSaving),
    [orderDetails, handleAcceptProposal, isSaving],
  );

  const handleEditStart = useCallback(() => {
    onEditStateChange(true);
  }, [onEditStateChange]);

  const product = orderDetails?.productsToOrder.find(
    (productInOrder) => productInOrder.id === selectedProductId,
  );

  const rows = useMemo(() => {
    const items = product?.ordersPerBranch ?? [];
    return [...items].sort((a, b) =>
      a.branch.name.localeCompare(b.branch.name, 'pl'),
    );
  }, [product]);

  return (
    <Stack>
      <Stack height={300}>
        <DataGrid
          rows={rows}
          columns={columns}
          disableColumnSorting
          disableColumnMenu
          disableRowSelectionOnClick
          hideFooter
          processRowUpdate={processRowUpdate}
          onCellEditStart={handleEditStart}
          loading={isLoading || isSaving}
          getRowClassName={(params) =>
            getStockUrgencyClassName(params.row.daysOfStock, urgencyThresholds)
          }
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
            ...stockUrgencyRowSx,
          }}
          localeText={{
            noRowsLabel: 'Brak sklepów',
          }}
        />
      </Stack>
    </Stack>
  );
};
