import {
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';

import { useAppDispatch, useAppSelector, useNotify } from '../../../../hooks';
import { setPriceType as setPriceTypeAction } from '../../store/priceListSlice';
import { PriceType } from '../../types/product';

export const SelectPriceType = () => {
  const dispatch = useAppDispatch();
  const { notify } = useNotify();
  const priceType = useAppSelector((state) => state.priceList.priceType);

  const setPriceType = (priceType: PriceType) => {
    dispatch(setPriceTypeAction(priceType));
    notify('success', 'Zmieniono typ ceny');
  };

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Typography variant="body1">{'Typ ceny: '}</Typography>
      <ToggleButtonGroup
        value={priceType}
        exclusive
        size="small"
        onChange={(_event, priceType) => setPriceType(priceType)}
      >
        <ToggleButton
          value={PriceType.detaliczna}
          sx={{ textTransform: 'none' }}
        >
          {'Detaliczna'}
        </ToggleButton>
        <ToggleButton value={PriceType.hurtowa} sx={{ textTransform: 'none' }}>
          {'Hurtowa'}
        </ToggleButton>
        <ToggleButton
          value={PriceType.ewidencyjna}
          sx={{ textTransform: 'none' }}
        >
          {'Ewidencyjna'}
        </ToggleButton>
        <ToggleButton value={PriceType.nocna} sx={{ textTransform: 'none' }}>
          {'Nocna'}
        </ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
};
