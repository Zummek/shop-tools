import { Box } from '@mui/material';
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
