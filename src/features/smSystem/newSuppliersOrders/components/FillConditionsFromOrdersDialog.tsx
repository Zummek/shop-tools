import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

import { useConditionsFromOrders } from '../api/useConditionsFromOrders';
import { ConditionsFromOrdersResult } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const FillConditionsFromOrdersDialog = ({ open, onClose }: Props) => {
  const { suggestFromOrders, isSuggesting } = useConditionsFromOrders();
  const [overwrite, setOverwrite] = useState(false);
  const [preview, setPreview] = useState<ConditionsFromOrdersResult | null>(
    null,
  );

  useEffect(() => {
    if (!open) {
      setOverwrite(false);
      setPreview(null);
      return;
    }
    let cancelled = false;
    setPreview(null);
    const loadPreview = async () => {
      try {
        const result = await suggestFromOrders({
          overwrite,
          apply: false,
        });
        if (!cancelled) setPreview(result);
      } catch {
        if (!cancelled) setPreview(null);
      }
    };
    loadPreview();
    return () => {
      cancelled = true;
    };
  }, [open, overwrite, suggestFromOrders]);

  const handleApply = async () => {
    try {
      await suggestFromOrders({
        overwrite,
        apply: true,
      });
      onClose();
    } catch {
      return;
    }
  };

  const suggested = preview?.branchesSuggested ?? 0;
  const skipped = preview?.branchesSkippedExisting ?? 0;
  const avgAges = (preview?.suggestions ?? [])
    .map((row) => row.avgOrderAgeDays)
    .filter((age): age is number => age != null);
  const avgAge =
    avgAges.length > 0
      ? Math.round(avgAges.reduce((sum, age) => sum + age, 0) / avgAges.length)
      : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{'Wypełnij puste warunki z historii'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <DialogContentText>
            {
              'System wyliczy przedziały na podstawie rzeczywistych ilości z poprzednich zamówień (bez automatycznych szkiców). Nowsze zamówienia liczą się mocniej niż stare, a ilości są skalowane do obecnego tempa sprzedaży. Jeśli w zamówieniu był zapisany stan magazynowy, użyje go do podziału na progi; w przeciwnym razie weźmie typową ilość i sprzedaż.'
            }
          </DialogContentText>
          {preview && (
            <Typography variant="body2">
              {'Historia: '}
              {preview.ordersUsed}
              {' pozycji z '}
              {preview.branchesWithHistory}
              {' par produkt–oddział. Do wypełnienia: '}
              {suggested}
              {' oddziałów'}
              {skipped > 0
                ? ` (pominięto ${skipped} z istniejącymi warunkami)`
                : ''}
              {avgAge != null ? `. Średni wiek zamówień: ${avgAge} dni` : ''}
              {'.'}
            </Typography>
          )}
          {!preview && isSuggesting && (
            <Typography variant="body2" color="text.secondary">
              {'Liczenie podglądu…'}
            </Typography>
          )}
          <FormControlLabel
            control={
              <Checkbox
                checked={overwrite}
                onChange={(event) => setOverwrite(event.target.checked)}
              />
            }
            label="Nadpisz istniejące warunki"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>{'Anuluj'}</Button>
        <Button
          variant="contained"
          onClick={handleApply}
          loading={isSuggesting}
          disabled={!preview || suggested === 0}
        >
          {'Zastosuj'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
