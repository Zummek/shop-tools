import { Box, Chip, Typography } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';

import { Product, ProductMatchType } from '../../products/types';
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
    field: 'productMatchType',
    headerName: 'Status dopasowania',
    minWidth: 120,
    renderCell: ({ row }) => {
      const matchLabels: Record<ProductMatchType, string> = {
        NONE: 'Niedopasowany',
        GTIN: 'Auto (EAN)',
        MANUAL: 'Ręcznie',
        PREVIOUS_MANUAL: 'Auto (poprzednie)',
        SIMILARITY: 'Auto (podobna nazwa)',
      };
      const matchColors: Record<
        ProductMatchType,
        'error' | 'success' | 'info' | 'secondary' | 'warning'
      > = {
        NONE: 'error',
        GTIN: 'success',
        MANUAL: 'info',
        PREVIOUS_MANUAL: 'success',
        SIMILARITY: 'warning',
      };
      return (
        <Chip
          label={matchLabels[row.productMatchType]}
          color={matchColors[row.productMatchType]}
          size="small"
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
    valueGetter: (_value, row) =>
      `${formatPrice(row.externalPricePerItem, row.externalCurrency)} `,
  },
  {
    field: 'internalPricePerItem',
    headerName: 'Wew. cena produktu',
    align: 'center',
    width: 80,
    valueGetter: (_value, row) =>
      row.internalProduct?.branches?.[0]?.grossPrice
        ? `${formatPrice(row.internalProduct.branches[0].grossPrice, 'PLN')} `
        : '-',
  },
  {
    field: 'quantity',
    headerName: 'Ilość produktu',
    align: 'center',
    width: 80,
  },
];
