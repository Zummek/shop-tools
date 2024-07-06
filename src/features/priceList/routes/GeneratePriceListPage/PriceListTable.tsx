import ClearIcon from '@mui/icons-material/Clear';
import {
  Checkbox,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  debounce,
} from '@mui/material';
import { useMemo, useState } from 'react';

import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { overwriteProducts, updateProduct } from '../../store/priceListSlice';
import {
  Product,
  ProductUnit,
  ProductUnitVolumeSize,
  ProductUnitWeightSize,
} from '../../types/product';
import { calcPricePerFullUnit, convertNumberToPrice } from '../../utils/price';

export const PriceListTable = () => {
  const dispatch = useAppDispatch();
  const products = useAppSelector((state) => state.priceList.products);
  const priceType = useAppSelector((state) => state.priceList.priceType);

  const [nameFilter, setNameFilter] = useState('');

  const changePricePerFullUnit = (index: number, pricePerFullUnit: number) => {
    dispatch(
      updateProduct({
        index,
        product: { ...products[index], pricePerFullUnit },
      })
    );
  };

  const changeUnit = (index: number, unit: ProductUnit) => {
    const product = products[index];
    const newUnitScale =
      unit === ProductUnit.kg
        ? ProductUnitWeightSize.g
        : ProductUnitVolumeSize.ml;
    const newPricePerFullUnit = calcPricePerFullUnit({
      price: product.prices[priceType],
      productSizeInUnit: product.productSizeInUnit,
      unit,
      unitScale: newUnitScale,
    });
    dispatch(
      updateProduct({
        index,
        product: {
          ...product,
          unit,
          unitScale: newUnitScale,
          pricePerFullUnit: newPricePerFullUnit,
        },
      })
    );
  };

  const changeProductSizeInUnit = (
    index: number,
    productSizeInUnit: number | null
  ) => {
    const product = products[index];
    const newPricePerFullUnit = calcPricePerFullUnit({
      price: product.prices[priceType],
      productSizeInUnit: productSizeInUnit || 0,
      unit: product.unit,
      unitScale: product.unitScale,
    });
    dispatch(
      updateProduct({
        index,
        product: {
          ...product,
          productSizeInUnit,
          pricePerFullUnit: newPricePerFullUnit,
        },
      })
    );
  };

  const changeName = (index: number, name: string) => {
    dispatch(updateProduct({ index, product: { ...products[index], name } }));
  };

  const changeUnitScale = (index: number, unitScale: Product['unitScale']) => {
    const product = products[index];
    const newPricePerFullUnit = calcPricePerFullUnit({
      price: product.prices[priceType],
      productSizeInUnit: product.productSizeInUnit,
      unit: product.unit,
      unitScale,
    });

    dispatch(
      updateProduct({
        index,
        product: {
          ...product,
          unitScale,
          pricePerFullUnit: newPricePerFullUnit,
        },
      })
    );
  };

  const setIncludedInPriceList = (
    index: number,
    includedInPriceList: boolean
  ) => {
    dispatch(
      updateProduct({
        index,
        product: { ...products[index], includedInPriceList },
      })
    );
  };

  // base on product.includedInPriceList
  const numSelected = products.filter((p) => p.includedInPriceList).length;
  const rowCount = products.length;
  const indeterminate = numSelected > 0 && numSelected < rowCount;
  const allSelected = rowCount > 0 && numSelected === rowCount;

  const onSelectAllClick = () => {
    const newSelected = !allSelected;
    dispatch(
      overwriteProducts({
        products: products.map((p) => ({
          ...p,
          includedInPriceList: newSelected,
        })),
      })
    );
  };

  const productsToDisplay = useMemo(() => {
    if (!nameFilter) return products;

    return products.filter((product) => {
      return product.name
        .toLowerCase()
        .includes(nameFilter.toLowerCase().trim());
    });
  }, [products, nameFilter]);

  const debouncedSetNameFilter = debounce(setNameFilter, 300);

  return (
    <TableContainer component={Paper} sx={{ height: 500 }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell colSpan={8} sx={{ p: 1, pb: 0, borderBottom: 'none' }}>
              <TextField
                label="Szukaj"
                variant="outlined"
                size="small"
                onChange={(event) => debouncedSetNameFilter(event.target.value)}
                sx={{ minWidth: 300 }}
                value={nameFilter}
                InputProps={{
                  endAdornment: nameFilter ? (
                    <InputAdornment position="end">
                      <ClearIcon
                        style={{ cursor: 'pointer' }}
                        onClick={() => setNameFilter('')}
                      />
                    </InputAdornment>
                  ) : undefined,
                }}
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{'Id'}</TableCell>
            <TableCell>{'Produkt'}</TableCell>
            <TableCell>{'Cena'}</TableCell>
            <TableCell>{'Jednostka'}</TableCell>
            <TableCell>{'Skala'}</TableCell>
            <TableCell>{'Rozmiar'}</TableCell>
            <TableCell sx={{ lineHeight: 1 }}>
              {'Cena za pełną jednostkę'}
            </TableCell>
            <TableCell width={60} padding="checkbox">
              <Stack>
                {'Do druku'}
                <Checkbox
                  color="primary"
                  indeterminate={indeterminate}
                  checked={allSelected}
                  onChange={onSelectAllClick}
                  disabled={products.length === 0 || nameFilter !== ''}
                  inputProps={{
                    'aria-label': 'select all',
                  }}
                />
              </Stack>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {productsToDisplay.map((product, index) => {
            const price = product.prices[priceType];
            const formattedPrice =
              price !== null ? `${convertNumberToPrice(price)}zł` : 'Brak ceny';
            return (
              <TableRow
                key={product.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell sx={{ textWrap: 'nowrap' }} width={25}>
                  {product.id}
                </TableCell>
                <TableCell component="th" scope="row">
                  <TextField
                    size="small"
                    value={product.name}
                    fullWidth
                    error={product.name.length > 23}
                    onChange={(event) => changeName(index, event.target.value)}
                  />
                </TableCell>
                <TableCell sx={{ textWrap: 'nowrap' }} width={80}>
                  {formattedPrice}
                </TableCell>
                <TableCell width={50}>
                  <ToggleButtonGroup
                    value={product.unit}
                    exclusive
                    size="small"
                    onChange={(_event, unit) => changeUnit(index, unit)}
                  >
                    <ToggleButton
                      value={ProductUnit.kg}
                      sx={{ textTransform: 'none' }}
                    >
                      {'kg'}
                    </ToggleButton>
                    <ToggleButton
                      value={ProductUnit.l}
                      sx={{ textTransform: 'none' }}
                    >
                      {'l'}
                    </ToggleButton>
                  </ToggleButtonGroup>
                </TableCell>
                <TableCell width={80}>
                  {product.unit === ProductUnit.kg ? (
                    <ToggleButtonGroup
                      value={product.unitScale}
                      exclusive
                      size="small"
                      onChange={(_event, unit) => changeUnitScale(index, unit)}
                    >
                      <ToggleButton
                        value={ProductUnitWeightSize.kg}
                        sx={{ textTransform: 'none' }}
                      >
                        {'kg'}
                      </ToggleButton>
                      <ToggleButton
                        value={ProductUnitWeightSize.g}
                        sx={{ textTransform: 'none' }}
                      >
                        {'g'}
                      </ToggleButton>
                      <ToggleButton
                        value={ProductUnitWeightSize.mg}
                        sx={{ textTransform: 'none' }}
                      >
                        {'mg'}
                      </ToggleButton>
                    </ToggleButtonGroup>
                  ) : (
                    <ToggleButtonGroup
                      value={product.unitScale}
                      exclusive
                      size="small"
                      onChange={(_event, unit) => changeUnitScale(index, unit)}
                    >
                      <ToggleButton
                        value={ProductUnitVolumeSize.l}
                        sx={{ textTransform: 'none' }}
                      >
                        {'l'}
                      </ToggleButton>
                      <ToggleButton
                        value={ProductUnitVolumeSize.ml}
                        sx={{ textTransform: 'none' }}
                      >
                        {'ml'}
                      </ToggleButton>
                    </ToggleButtonGroup>
                  )}
                </TableCell>
                <TableCell width={100}>
                  <TextField
                    size="small"
                    error={product.productSizeInUnit === null}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          {product.unitScale}
                        </InputAdornment>
                      ),
                    }}
                    value={
                      product.productSizeInUnit &&
                      isFinite(product.productSizeInUnit)
                        ? product.productSizeInUnit
                        : ''
                    }
                    onChange={(event) =>
                      changeProductSizeInUnit(
                        index,
                        event.target.value
                          ? parseFloat(event.target.value)
                          : null
                      )
                    }
                  />
                </TableCell>
                <TableCell width={150}>
                  <TextField
                    size="small"
                    error={product.pricePerFullUnit === null}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">{`zł/1${product.unit}`}</InputAdornment>
                      ),
                    }}
                    value={
                      product.pricePerFullUnit !== null
                        ? convertNumberToPrice(product.pricePerFullUnit)
                        : ''
                    }
                    onChange={(event) =>
                      changePricePerFullUnit(
                        index,
                        event.target.value ? parseFloat(event.target.value) : 0
                      )
                    }
                  />
                </TableCell>
                <TableCell width={42}>
                  <Checkbox
                    checked={product.includedInPriceList}
                    onChange={(_event, checked) =>
                      setIncludedInPriceList(index, checked)
                    }
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
