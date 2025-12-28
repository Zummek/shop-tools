import UndoIcon from '@mui/icons-material/Undo';
import VerifiedIcon from '@mui/icons-material/Verified';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import { Product } from '../../products/types';
import { EcommerceOrderItem } from '../types';

import { ProductSelector } from './index';

const StyledProductCell = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isEditing',
})<{ isEditing: boolean }>(({ theme, isEditing }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  justifyContent: 'space-between',
  cursor: 'pointer',
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(1),
  border: '1px solid',
  borderColor: isEditing ? theme.palette.primary.main : theme.palette.divider,
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.primary.main,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    transform: 'translateY(-1px)',
  },
}));

const IconStack = styled(Stack)(() => ({
  alignItems: 'center',
  justifyContent: 'center',
  height: '20px',
}));

const UndoIconStyled = styled(UndoIcon)(({ theme }) => ({
  color: theme.palette.success.main,
  transform: 'scaleY(-1)',
  marginTop: -0.5,
  fontSize: '18px',
}));

interface ProductCellProps {
  orderItem: EcommerceOrderItem;
  isEditing: boolean;
  onEdit: () => void;
  onUpdateProduct: (product: Product | null) => Promise<void>;
  onClose: () => void;
  anchorEl: HTMLElement | null;
}

export const ProductCell = ({
  orderItem,
  isEditing,
  onEdit,
  onUpdateProduct,
  onClose,
  anchorEl,
}: ProductCellProps) => {
  return (
    <StyledProductCell isEditing={isEditing} onClick={onEdit}>
      <Typography variant="body2" fontWeight="medium">
        {orderItem.internalProduct ? orderItem.internalProduct.name : '-'}
      </Typography>
      {orderItem.internalProductManuallySelected && (
        <Tooltip
          title={`Produkt został wybrany manualnie ${
            orderItem.internalProductPopulatedFromPreviousOrder
              ? ' w poprzednim zamówieniu'
              : ''
          }.`}
        >
          <IconStack>
            <VerifiedIcon color="success" fontSize="small" />
            {orderItem.internalProductPopulatedFromPreviousOrder && (
              <UndoIconStyled />
            )}
          </IconStack>
        </Tooltip>
      )}
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
