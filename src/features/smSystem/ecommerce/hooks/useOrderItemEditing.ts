import { useEffect, useState } from 'react';

export const useOrderItemEditing = () => {
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingRowId) {
        const target = event.target as Element;
        const isProductSelector =
          target.closest('[data-testid="product-selector"]') ||
          target.closest('.MuiAutocomplete-popper') ||
          target.closest('.MuiAutocomplete-paper');

        if (!isProductSelector) setEditingRowId(null);
      }
    };

    if (editingRowId)
      document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingRowId]);

  return {
    editingRowId,
    setEditingRowId,
  };
};
