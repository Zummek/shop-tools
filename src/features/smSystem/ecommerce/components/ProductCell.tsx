import { VisibilityOutlined } from '@mui/icons-material';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import { Pages } from '../../../../utils';
import { Product } from '../../products/types';
import { EcommerceOrderItem } from '../types';

import { ProductSelector } from './index';

const StyledProductCell = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isEditing' && prop !== 'dense',
})<{ isEditing: boolean; dense?: boolean }>(({ theme, isEditing, dense }) => ({
  display: 'flex',
  alignItems: 'center',
  flex: 1,
  minWidth: 0,
  gap: theme.spacing(1),
  justifyContent: 'space-between',
  cursor: 'pointer',
  padding: theme.spacing(dense ? 0.75 : 1.5),
  borderRadius: theme.spacing(1),
  border: '1px solid',
  borderColor: isEditing ? theme.palette.primary.main : theme.palette.divider,
  backgroundColor: theme.palette.background.paper,
  boxShadow: dense ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.primary.main,
    boxShadow: dense ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.15)',
    transform: dense ? 'none' : 'translateY(-1px)',
  },
}));

interface ProductCellProps {
  orderItem: EcommerceOrderItem;
  isEditing: boolean;
  onEdit: () => void;
  onUpdateProduct: (product: Product | null) => Promise<void>;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  dense?: boolean;
  productName?: string;
  productId?: number;
  searchValue?: string;
}

export const ProductCell = ({
  orderItem,
  isEditing,
  onEdit,
  onUpdateProduct,
  onClose,
  anchorEl,
  dense = false,
  productName,
  productId,
  searchValue,
}: ProductCellProps) => {
  const linkedProductId = productId ?? orderItem.internalProduct?.id;
  const label =
    productName ??
    (orderItem.internalProduct ? orderItem.internalProduct.name : '-');
  const productHref =
    linkedProductId == null
      ? null
      : `#${Pages.smSystemProductDetails.replace(
          ':productId',
          String(linkedProductId),
        )}`;

  return (
    <StyledProductCell isEditing={isEditing} dense={dense} onClick={onEdit}>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" fontWeight="medium">
          {label}
        </Typography>
      </Box>
      {productHref && (
        <Tooltip title="Otwórz produkt">
          <IconButton
            size="small"
            component="a"
            href={productHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Otwórz produkt w nowej karcie"
            onClick={(event) => event.stopPropagation()}
            sx={{ flexShrink: 0 }}
          >
            <VisibilityOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {isEditing && (
        <ProductSelector
          initialValue={searchValue ?? orderItem.externalName}
          onChange={onUpdateProduct}
          onClose={onClose}
          open={true}
          anchorEl={anchorEl}
        />
      )}
    </StyledProductCell>
  );
};
