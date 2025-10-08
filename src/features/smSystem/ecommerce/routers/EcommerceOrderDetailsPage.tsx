import UndoIcon from '@mui/icons-material/Undo';
import VerifiedIcon from '@mui/icons-material/Verified';
import { Box, Button, Stack, Tooltip, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { LabelData } from '../../../../components';
import { useNotify } from '../../../../hooks';
import { Pages } from '../../../../utils';
import { Product } from '../../products/types';
import { formatPrice } from '../../products/utils';
import {
  useGetEcommerceOrderDetails,
  useUpdateEcommerceOrderItem,
} from '../api';
import { Barcode, ProductSelector } from '../components';
import { ImportEcommerceOrderModal } from '../modals/ImportEcommerceOrderModal';
import { EcommerceOrderItem } from '../types';
import { orderStatusMessage } from '../utils/orderStatusMessage';

const createColumns = (
  editingItemId: number | null,
  setEditingItemId: (id: number | null) => void,
  updateEcommerceOrderItem: (payload: {
    orderItemId: number;
    internalProductId: number;
  }) => Promise<unknown>
): GridColDef<EcommerceOrderItem>[] => [
  {
    field: 'externalId',
    headerName: 'Zew. ID produktu',
    width: 120,
  },
  {
    field: 'externalName',
    headerName: 'Zew. nazwa produktu',
    width: 200,
    flex: 1,
  },
  {
    field: 'internalProduct',
    headerName: 'Produkt',
    width: 200,
    flex: 1,
    renderCell: (params) => {
      const isEditing = editingItemId === params.row.id;

      return (
        <Box
          onClick={() => setEditingItemId(params.row.id)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            justifyContent: 'space-between',
            cursor: 'pointer',
            padding: 1.5,
            borderRadius: 1,
            border: '1px solid',
            borderColor: isEditing ? 'primary.main' : 'divider',
            backgroundColor: 'background.paper',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'action.hover',
              borderColor: 'primary.main',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              transform: 'translateY(-1px)',
            },
          }}
        >
          <Typography variant="body2" fontWeight="medium">
            {params.row.internalProduct.name}
          </Typography>
          {params.row.internalProductManuallySelected && (
            <Tooltip
              title={`Produkt został wybrany manualnie ${
                params.row.internalProductPopulatedFromPreviousOrder
                  ? ' w poprzednim zamówieniu'
                  : ''
              }.`}
            >
              <Stack alignItems="center" justifyContent="center" height="20px">
                <VerifiedIcon color="success" fontSize="small" />
                {params.row.internalProductPopulatedFromPreviousOrder && (
                  <UndoIcon
                    color="success"
                    sx={{
                      transform: 'scaleY(-1)',
                      marginTop: -0.5,
                      fontSize: '18px',
                    }}
                  />
                )}
              </Stack>
            </Tooltip>
          )}
          {isEditing && (
            <ProductSelector
              initialValue={params.row.externalName}
              onChange={async (product: Product | null) => {
                if (product) {
                  await updateEcommerceOrderItem({
                    orderItemId: params.row.id,
                    internalProductId: product.id,
                  });
                }
                setEditingItemId(null);
              }}
              onClose={() => setEditingItemId(null)}
              open={true}
              anchorEl={params.api.getCellElement(params.id, 'internalProduct')}
            />
          )}
        </Box>
      );
    },
  },
  {
    field: 'barcode',
    headerName: 'Kod kreskowy',
    width: 190,
    renderCell: (params) => {
      return (
        <Box
          flex={1}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Barcode barcode={params.row.internalProduct.barcodes[0]} />
        </Box>
      );
    },
  },
  {
    field: 'externalPricePerItem',
    headerName: 'Zew. cena produktu',
    align: 'center',
    width: 100,
  },
  {
    field: 'internalPricePerItem',
    headerName: 'Cena produktu',
    align: 'center',
    width: 100,
    valueGetter: (_value, row) =>
      formatPrice(row.internalProduct.branches[0].grossPrice),
  },
  {
    field: 'quantity',
    headerName: 'Ilość produktu',
    align: 'center',
    width: 100,
  },
];

export const EcommerceOrderDetailsPage = () => {
  const navigate = useNavigate();
  const { notify } = useNotify();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const { orderId: rawOrderId } = useParams<{ orderId: string }>();
  const id = Number(rawOrderId);

  const { ecommerceOrder, isLoading } = useGetEcommerceOrderDetails({ id });
  const { updateEcommerceOrderItem } = useUpdateEcommerceOrderItem();

  const handleUpdateEcommerceOrderItemInternalProduct = async (payload: {
    orderItemId: number;
    internalProductId: number;
  }) => {
    const response = await updateEcommerceOrderItem({
      orderId: id,
      orderItemId: payload.orderItemId,
      internalProductId: payload.internalProductId,
    });
    notify('success', 'Produkt został zaktualizowany');
    return response.orderItems.find((item) => item.id === payload.orderItemId);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingItemId) {
        // Check if the click is on the ProductSelector or its dropdown
        const target = event.target as Element;
        const isProductSelector =
          target.closest('[data-testid="product-selector"]') ||
          target.closest('.MuiAutocomplete-popper') ||
          target.closest('.MuiAutocomplete-paper');

        if (!isProductSelector) setEditingItemId(null);
      }
    };

    if (editingItemId)
      document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingItemId]);

  return (
    <Stack spacing={4}>
      <Box>
        <Button
          variant="outlined"
          onClick={() => navigate(Pages.smSystemEcommerceOrders)}
        >
          {'Powrót'}
        </Button>
      </Box>
      <Typography variant="h4" component="h1">
        {'Zamówienie ' +
          dayjs(ecommerceOrder?.orderDate).format('DD.MM.YYYY HH:mm')}
      </Typography>
      <Stack spacing={2}>
        <Stack spacing={6} direction="row" flexWrap="wrap">
          <LabelData
            label="Data zamówienia"
            value={dayjs(ecommerceOrder?.orderDate).format('DD.MM.YYYY HH:mm')}
          />
          <LabelData
            label="Miejsce zamówienia"
            value={ecommerceOrder?.orderSource}
          />
          <LabelData label="ID zamówienia" value={ecommerceOrder?.externalId} />
        </Stack>
        <Stack spacing={6} direction="row" flexWrap="wrap">
          <LabelData
            label="Status"
            value={orderStatusMessage[ecommerceOrder?.status || 'new']}
          />
          <LabelData
            label="Metoda płatności"
            value={ecommerceOrder?.paymentMethod}
          />
          <LabelData
            label="Metoda dostawy"
            value={ecommerceOrder?.deliveryMethod}
          />
        </Stack>
        <Stack spacing={6} direction="row" flexWrap="wrap">
          <LabelData label="Kupujący" value={ecommerceOrder?.buyerName} />
          <LabelData
            label="Adres kupującego"
            value={ecommerceOrder?.buyerAddress}
          />
          <LabelData
            label="Kontakt kupującego"
            value={ecommerceOrder?.buyerContact}
          />
          <LabelData
            label="Wiadomość od kupującego"
            value={ecommerceOrder?.messageFromBuyer || 'brak'}
          />
        </Stack>
        <Stack spacing={6} direction="row" flexWrap="wrap">
          <LabelData
            label="Ilość pozycji"
            value={ecommerceOrder?.itemsAmount}
          />
          <LabelData
            label="Ilość produktów"
            value={ecommerceOrder?.productsAmount}
          />
        </Stack>
        <Stack spacing={6} direction="row" flexWrap="wrap">
          <LabelData
            label="Data utworzenia"
            value={dayjs(ecommerceOrder?.createdAt).format('DD.MM.YYYY HH:mm')}
          />
          <LabelData
            label="Data modyfikacji"
            value={dayjs(ecommerceOrder?.updatedAt).format('DD.MM.YYYY HH:mm')}
          />
        </Stack>
      </Stack>
      <Box height={500} width="100%">
        <DataGrid
          sx={{
            '& .MuiDataGrid-columnHeaderTitle': {
              whiteSpace: 'normal',
              lineHeight: 'normal',
            },
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              overflow: 'visible',
            },
            '& .MuiDataGrid-cellContent': {
              overflow: 'visible',
              whiteSpace: 'nowrap',
            },
          }}
          rows={ecommerceOrder?.orderItems}
          rowCount={ecommerceOrder?.orderItems.length || 0}
          columns={createColumns(
            editingItemId,
            setEditingItemId,
            handleUpdateEcommerceOrderItemInternalProduct
          )}
          pageSizeOptions={[ecommerceOrder?.orderItems.length || 0]}
          loading={isLoading}
          paginationModel={{
            page: 0,
            pageSize: ecommerceOrder?.orderItems.length || 0,
          }}
          paginationMode="server"
          disableColumnSorting
          disableRowSelectionOnClick
          hideFooter
          onRowClick={() => {}}
          disableColumnMenu
          onPaginationModelChange={() => {}}
          style={{
            width: '100%',
          }}
        />
        <ImportEcommerceOrderModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </Box>
    </Stack>
  );
};
