import { Box, Typography } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';

import { Product } from '../../products/types';
import { formatPrice } from '../../products/utils';
import { EcommerceOrderItem } from '../types';

import { Barcode, ProductCell } from './index';

interface CreateColumnsParams {
  editingItemId: number | null;
  setEditingItemId: (id: number | null) => void;
  updateEcommerceOrderItem: (payload: {
    orderItemId: number;
    internalProductId: number;
  }) => Promise<unknown>;
}

export const createOrderItemsColumns = ({
  editingItemId,
  setEditingItemId,
  updateEcommerceOrderItem,
}: CreateColumnsParams): GridColDef<EcommerceOrderItem>[] => [
  {
    field: 'externalId',
    headerName: 'Zew. ID produktu',
    width: 110,
  },
  {
    field: 'externalName',
    headerName: 'Zew. nazwa produktu',
    width: 200,
    flex: 1,
    // cut text if it's too long
    renderCell: (params) => {
      return (
        <Typography
          component="span"
          variant="body2"
          fontWeight="medium"
          flex={1}
          overflow="visible"
          textOverflow="unset"
          lineHeight="normal"
          whiteSpace="normal"
          alignItems="center"
          display="flex"
        >
          {params.row.externalName}
        </Typography>
      );
    },
  },
  {
    field: 'internalProduct',
    headerName: 'Produkt',
    width: 200,
    flex: 1,
    renderCell: (params) => {
      const isEditing = editingItemId === params.row.id;

      return (
        <ProductCell
          orderItem={params.row}
          isEditing={isEditing}
          onEdit={() => setEditingItemId(params.row.id)}
          onUpdateProduct={async (product: Product | null) => {
            if (product) {
              await updateEcommerceOrderItem({
                orderItemId: params.row.id,
                internalProductId: product.id,
              });
            }
            setEditingItemId(null);
          }}
          onClose={() => setEditingItemId(null)}
          anchorEl={params.api.getCellElement(params.id, 'internalProduct')}
        />
      );
    },
  },
  {
    field: 'barcode',
    headerName: 'Kod kreskowy',
    width: 190,
    renderCell: (params) => {
      const barcode = params.row.internalProduct?.barcodes?.[0];
      return (
        <Box
          flex={1}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {barcode ? <Barcode barcode={barcode} /> : '-'}
        </Box>
      );
    },
  },
  {
    field: 'externalPricePerItem',
    headerName: 'Zew. cena produktu',
    align: 'center',
    width: 80,
  },
  {
    field: 'internalPricePerItem',
    headerName: 'Cena produktu',
    align: 'center',
    width: 80,
    valueGetter: (_value, row) =>
      row.internalProduct?.branches?.[0]?.grossPrice
        ? formatPrice(row.internalProduct.branches[0].grossPrice)
        : '-',
  },
  {
    field: 'quantity',
    headerName: 'Ilość produktu',
    align: 'center',
    width: 80,
  },
];
