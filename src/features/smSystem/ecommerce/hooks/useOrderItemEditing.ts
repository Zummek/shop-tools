import { useEffect, useState } from 'react';

export const useOrderItemEditing = () => {
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingItemId) {
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

  return {
    editingItemId,
    setEditingItemId,
  };
};
