import {
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  Popper,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';

import { useGetProducts } from '../../products/api';
import { Product } from '../../products/types';

interface ProductSelectorProps {
  initialValue?: string;
  onChange: (product: Product | null) => void;
  onClose: () => void;
  open: boolean;
  anchorEl?: HTMLElement | null;
}

export const ProductSelector = ({
  initialValue = '',
  onChange,
  onClose,
  open,
  anchorEl,
}: ProductSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const { products, isLoading, setQuery } = useGetProducts();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearchChange = (newValue: string) => {
    setSearchQuery(newValue);
    setQuery(newValue);
  };

  const handleProductSelect = (selectedProduct: Product | null) => {
    if (!selectedProduct) return;
    onChange(selectedProduct);
    onClose();
  };

  const currentQuery = searchQuery || initialValue;

  useEffect(() => {
    setSearchQuery(initialValue);
    setQuery(initialValue);
  }, [initialValue, setQuery]);

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="bottom-start"
      style={{
        zIndex: 1300,
        width: anchorEl?.offsetWidth || 300,
      }}
      modifiers={[
        {
          name: 'preventOverflow',
          enabled: true,
          options: {
            boundary: 'viewport',
          },
        },
        {
          name: 'flip',
          enabled: true,
        },
      ]}
    >
      <Box
        data-testid="product-selector"
        sx={{
          border: '1px solid',
          borderColor: 'primary.main',
          borderRadius: 2,
          backgroundColor: 'background.paper',
          boxShadow:
            '0 8px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          padding: 1,
          minWidth: 320,
          maxWidth: 400,
        }}
      >
        <TextField
          ref={inputRef}
          fullWidth
          placeholder="Wyszukaj produkt..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          autoFocus
          InputProps={{
            endAdornment: isLoading ? (
              <CircularProgress color="inherit" size={20} />
            ) : null,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
                borderWidth: 2,
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
                borderWidth: 2,
              },
            },
          }}
        />

        {currentQuery && (
          <List
            sx={{
              maxHeight: 200,
              overflow: 'auto',
              padding: 0,
              marginTop: 1,
            }}
          >
            {products.length === 0 ? (
              <ListItem>
                <Typography variant="body2" color="text.secondary">
                  {'Brak produktów'}
                </Typography>
              </ListItem>
            ) : (
              products.map((product) => (
                <ListItem key={product.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleProductSelect(product)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      borderRadius: 1,
                      marginBottom: 0.5,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {product.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {`ID: ${product.internalId} | Kod: ${product.barcodes[0] || 'Brak'}`}
                      </Typography>
                    </Box>
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </List>
        )}
      </Box>
    </Popper>
  );
};
