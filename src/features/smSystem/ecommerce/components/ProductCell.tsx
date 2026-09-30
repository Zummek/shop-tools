import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import { Product } from '../../products/types';
import { EcommerceOrderItem } from '../types';

import { ProductSelector } from './index';

const StyledProductCell = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isEditing' && prop !== 'dense',
})<{ isEditing: boolean; dense?: boolean }>(({ theme, isEditing, dense }) => ({
  display: 'flex',
  alignItems: 'center',
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
}: ProductCellProps) => {
  const label =
    productName ??
    (orderItem.internalProduct ? orderItem.internalProduct.name : '-');

  return (
    <StyledProductCell isEditing={isEditing} dense={dense} onClick={onEdit}>
      <Box>
        <Typography variant="body2" fontWeight="medium">
          {label}
        </Typography>
      </Box>
      {isEditing && (
        <ProductSelector
          initialValue={orderItem.externalName}
          onChange={onUpdateProduct}
          onClose={onClose}
          open={true}
          anchorEl={anchorEl}
        />
      )}
    </StyledProductCell>
  );
};
