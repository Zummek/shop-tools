import { Button, Stack } from '@mui/material';
import dayjs from 'dayjs';

import { VisuallyHiddenInput } from '../../../../components/inputs/VisuallyHiddenInput';
import { useAppDispatch, useAppSelector, useNotify } from '../../../../hooks';
import { setPriceListData } from '../../store/priceListSlice';

export const ImportExportButtons = () => {
  const dispatch = useAppDispatch();
  const priceListData = useAppSelector((state) => state.priceList);
  const { notify } = useNotify();

  const exportPriceList = () => {
    // create and download file with priceListData
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(priceListData)], {
      type: 'text/plain',
    });
    element.href = URL.createObjectURL(file);
    const datePart = dayjs().format('YYYY-MM-DD-HH-mm');
    element.download = `cenowki-export-${datePart}.json`;
    document.body.appendChild(element);
    element.click();
  };

  const importPriceList = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        const data = JSON.parse(content);
        dispatch(setPriceListData({ ...data, fileName: file.name }));
        notify('success', 'Dane zaimportowane pomyślnie');
      }
    };
    reader.readAsText(file);

    event.target.value = '';
  };

  return (
    <Stack direction="row" spacing={2}>
      <Button
        variant="outlined"
        color="primary"
        onClick={exportPriceList}
        sx={{ whiteSpace: 'nowrap' }}
      >
        {'Exportuj dane'}
      </Button>
      <Button
        variant="outlined"
        color="primary"
        component="label"
        role={undefined}
        tabIndex={-1}
        sx={{ whiteSpace: 'nowrap' }}
      >
        {'Importuj dane'}
        <VisuallyHiddenInput type="file" onChange={importPriceList} />
      </Button>
    </Stack>
  );
};
