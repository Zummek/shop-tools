import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';

import { axiosInstance } from '../../../../services';
import { ListResponse } from '../../app/types';
import { useGetProductDetails } from '../../products/api';
import { Product } from '../../products/types';

const endpoint = '/api/v1/products/';
const searchDebounceMs = 300;

interface OrderProductFilterProps {
  productId: number | null;
  onChange: (productId: number | null) => void;
}

export const OrderProductFilter = ({
  productId,
  onChange,
}: OrderProductFilterProps) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState<Product | null>(null);
  const inputReason = useRef('');
  const { product: loadedProduct, isMissing } = useGetProductDetails(
    productId ?? undefined,
  );

  const selected =
    picked && picked.id === productId
      ? picked
      : loadedProduct?.id === productId
        ? loadedProduct
        : null;

  useEffect(() => {
    if (!open) setInputValue(selected?.name ?? '');
  }, [open, selected]);

  useEffect(() => {
    if (!productId || !isMissing) return;
    onChange(null);
  }, [productId, isMissing, onChange]);

  useEffect(() => {
    if (!open) return undefined;
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setSearch('');
      return undefined;
    }
    const timeout = setTimeout(() => setSearch(trimmed), searchDebounceMs);
    return () => clearTimeout(timeout);
  }, [open, inputValue]);

  const { data, isFetching } = useQuery({
    queryKey: ['ecommerce-order-product-filter', search],
    queryFn: async ({ signal }) => {
      const response = await axiosInstance.get<ListResponse<Product>>(
        endpoint,
        {
          signal,
          params: { query: search, page: 1, pageSize: 25 },
        },
      );
      return response.data.results;
    },
    enabled: open,
    placeholderData: keepPreviousData,
  });

  const options = useMemo(() => {
    const results = data ?? [];
    if (selected && !results.some((item) => item.id === selected.id))
      return [selected, ...results];
    return results;
  }, [data, selected]);

  return (
    <Autocomplete
      size="small"
      sx={{ minWidth: 280 }}
      open={open}
      onOpen={() => {
        setSearch(inputValue.trim());
        setOpen(true);
      }}
      onClose={() => setOpen(false)}
      options={options}
      loading={open && isFetching}
      value={selected}
      inputValue={inputValue}
      onInputChange={(_event, next, reason) => {
        inputReason.current = reason;
        if (reason === 'blur') {
          setInputValue(selected?.name ?? '');
          return;
        }
        if (reason === 'input' || reason === 'clear' || reason === 'reset')
          setInputValue(next);
      }}
      onChange={(_event, next, reason) => {
        // Deleting the text starts a new search. Only the clear button drops the filter.
        if (reason === 'clear' && inputReason.current !== 'clear') return;
        setPicked(next);
        onChange(next?.id ?? null);
      }}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, current) => option.id === current.id}
      filterOptions={(items) => items}
      noOptionsText="Brak produktów"
      loadingText="Szukam..."
      renderOption={(props, option) => {
        const rowProps = { ...props };
        delete rowProps.key;
        return (
          <li {...rowProps} key={option.id}>
            <Box>
              <Typography variant="body2">{option.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {`ID: ${option.internalId}`}
              </Typography>
            </Box>
          </li>
        );
      }}
      renderInput={(params) => <TextField {...params} label="Produkt" />}
    />
  );
};
