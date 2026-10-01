import { SubdirectoryArrowRight } from '@mui/icons-material';
import { Box, Chip, Stack, Tooltip, Typography } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';

import { Product, ProductMatchType } from '../../products/types';
import { formatPrice } from '../../products/utils';

import { Barcode } from './Barcode';
import { ProductCell } from './ProductCell';
import {
  catalogUnitGross,
  offerQuantityLabel,
  OrderItemGridRow,
} from './orderItemRows';

interface CreateColumnsParams {
  editingRowId: string | null;
  setEditingRowId: (id: string | null) => void;
  branchId: number | null;
  updateEcommerceOrderItem: (payload: {
    orderItemId: number;
    internalProductId: number;
    componentIndex?: number;
  }) => Promise<unknown>;
}

const matchLabels: Record<ProductMatchType, string> = {
  NONE: 'Niedopasowany',
  GTIN: 'Auto (EAN)',
  EAN: 'Auto (EAN)',
  MANUAL: 'Ręcznie',
  PREVIOUS_MANUAL: 'Auto (poprzednie)',
  SIMILARITY: 'Auto (podobna nazwa)',
  CHANNEL_LINK: 'Auto (link kanału)',
  SKU: 'Auto (SKU)',
  OFFER_NAME: 'Auto (nazwa oferty)',
};

const matchColors: Record<
  ProductMatchType,
  'error' | 'success' | 'info' | 'secondary' | 'warning'
> = {
  NONE: 'error',
  GTIN: 'success',
  EAN: 'success',
  MANUAL: 'info',
  PREVIOUS_MANUAL: 'success',
  SIMILARITY: 'warning',
  CHANNEL_LINK: 'success',
  SKU: 'success',
  OFFER_NAME: 'success',
};

function productCountLabel(count: number) {
  if (count === 1) return '1 produkt';
  const teen = count % 100;
  if (count % 10 >= 2 && count % 10 <= 4 && (teen < 12 || teen > 14))
    return `${count} produkty`;
  return `${count} produktów`;
}

export const createOrderItemsColumns = ({
  editingRowId,
  setEditingRowId,
  branchId,
  updateEcommerceOrderItem,
}: CreateColumnsParams): GridColDef<OrderItemGridRow>[] => [
  {
    field: 'externalId',
    headerName: 'Zew. ID produktu',
    width: 110,
    valueGetter: (_value, row) =>
      row.kind === 'component' ? '' : row.item.externalId,
  },
  {
    field: 'externalName',
    headerName: 'Zew. nazwa produktu',
    width: 200,
    flex: 1,
    renderCell: ({ row }) => {
      if (row.kind === 'component') return null;
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
          {row.item.externalName}
        </Typography>
      );
    },
  },
  {
    field: 'internalProduct',
    headerName: 'Produkt',
    width: 220,
    flex: 1,
    renderCell: (params) => {
      const { row } = params;
      const isEditing = editingRowId === row.id;
      const editProps = {
        orderItem: row.item,
        isEditing,
        onEdit: () => setEditingRowId(row.id),
        onUpdateProduct: async (product: Product | null) => {
          if (product) {
            await updateEcommerceOrderItem({
              orderItemId: row.item.id,
              internalProductId: product.id,
              ...(row.componentIndex == null
                ? {}
                : { componentIndex: row.componentIndex }),
            });
          }
          setEditingRowId(null);
        },
        onClose: () => setEditingRowId(null),
        anchorEl: params.api.getCellElement(params.id, 'internalProduct'),
      };

      if (row.kind === 'offer') {
        const count = row.item.offerComponents?.length ?? 0;
        if (!row.item.internalProduct) return <ProductCell {...editProps} />;
        return (
          <Typography variant="body2" color="text.secondary">
            {`Zestaw · ${productCountLabel(count)}`}
          </Typography>
        );
      }

      if (row.kind === 'component' && !row.product) return null;

      return (
        <Stack direction="row" alignItems="center" spacing={0.75} width="100%">
          {row.kind === 'component' && (
            <SubdirectoryArrowRight fontSize="small" color="disabled" />
          )}
          <ProductCell
            {...editProps}
            dense={row.kind === 'component'}
            productName={row.product?.name}
            searchValue={
              row.kind === 'component' ? row.product?.name : undefined
            }
          />
        </Stack>
      );
    },
  },
  {
    field: 'productMatchType',
    headerName: 'Status dopasowania',
    minWidth: 140,
    renderCell: ({ row }) => {
      if (!row.matchType) return null;
      return (
        <Chip
          label={matchLabels[row.matchType]}
          color={matchColors[row.matchType]}
          size="small"
        />
      );
    },
  },
  {
    field: 'barcode',
    headerName: 'Kod kreskowy',
    width: 190,
    renderCell: ({ row }) => {
      if (row.kind === 'offer') return null;
      const barcode = row.product?.barcodes?.[0];
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
    headerName: 'Zew. cena oferty',
    description:
      'Cena całej oferty. Przy wielosztuce nie jest to cena jednej sztuki.',
    align: 'center',
    width: 110,
    valueGetter: (_value, row) =>
      row.kind === 'component'
        ? ''
        : `${formatPrice(row.item.externalPricePerItem, row.item.externalCurrency)} `,
  },
  {
    field: 'internalPricePerItem',
    headerName: 'Wew. cena sztuki',
    description: 'Cena jednej sztuki w katalogu.',
    align: 'center',
    width: 120,
    valueGetter: (_value, row) => {
      if (row.kind === 'offer') return '';
      const gross = catalogUnitGross(row.product, branchId);
      return gross == null ? '-' : `${formatPrice(gross, 'PLN')} `;
    },
  },
  {
    field: 'quantity',
    headerName: 'Ilość produktu',
    align: 'center',
    width: 110,
    renderCell: ({ row }) => {
      if (row.kind === 'offer') {
        return (
          <Tooltip title="Liczba sprzedanych ofert. Produkty są w wierszach poniżej.">
            <Box lineHeight={1.15} textAlign="center">
              <div>{row.item.quantity}</div>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                {offerQuantityLabel(row.item.quantity)}
              </Typography>
            </Box>
          </Tooltip>
        );
      }
      if (row.kind === 'component') return row.item.quantity;
      const units = row.item.unitsInOffer ?? 1;
      const pieces = row.item.quantity * units;
      if (units <= 1) return pieces;
      const offers = row.item.quantity;
      return (
        <Tooltip
          title={`${offers} ${offerQuantityLabel(offers)} × ${units} szt. Cena oferty jest za całość.`}
        >
          <Box lineHeight={1.15} textAlign="center">
            <div>{pieces}</div>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {`${offers}×${units} szt.`}
            </Typography>
          </Box>
        </Tooltip>
      );
    },
  },
];
