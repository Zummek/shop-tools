import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Modal,
  Stack,
  Typography,
} from '@mui/material';
import { isAxiosError } from 'axios';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { modalStyle } from '../../../../components';
import { useNotify } from '../../../../hooks';
import { formatPrice } from '../../products/utils';
import {
  KsefCandidate,
  useGetKsefCandidates,
  useImportKsefInvoices,
} from '../api';

interface Props {
  open: boolean;
  onClose: () => void;
}

const IMPORT_BATCH = 30;

const errorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    const responseError = error.response?.data?.error;
    if (typeof responseError === 'string' && responseError)
      return responseError;
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Nie udało się pobrać faktur z KSeF';
};

export const ImportKsefInvoicesModal = ({ open, onClose }: Props) => {
  const { notify } = useNotify();
  const [cursor, setCursor] = useState<string | null>(null);
  const [history, setHistory] = useState<(string | null)[]>([]);
  const [selected, setSelected] = useState<Record<string, KsefCandidate>>({});
  const [importError, setImportError] = useState<string | null>(null);

  const { page, isLoading, isFetching, isError, error } = useGetKsefCandidates(
    cursor,
    open,
  );
  const { importKsefInvoices, isPending } = useImportKsefInvoices();

  useEffect(() => {
    if (open) return;
    setCursor(null);
    setHistory([]);
    setSelected({});
    setImportError(null);
  }, [open]);

  useEffect(() => {
    if (!open || !page || page.invoices.length > 0 || !page.nextCursor) return;
    if (page.nextCursor === cursor) return;
    setCursor(page.nextCursor);
  }, [open, page, cursor]);

  const invoices = page?.invoices ?? [];
  const selectedCount = Object.keys(selected).length;
  const allOnPageSelected =
    invoices.length > 0 && invoices.every((row) => selected[row.ksefNumber]);
  const someOnPageSelected = invoices.some((row) => selected[row.ksefNumber]);
  const busy = isPending || isFetching;

  const toggleOne = (row: KsefCandidate) => {
    setSelected((current) => {
      const next = { ...current };
      if (next[row.ksefNumber]) delete next[row.ksefNumber];
      else next[row.ksefNumber] = row;
      return next;
    });
  };

  const togglePage = () => {
    setSelected((current) => {
      const next = { ...current };
      if (allOnPageSelected) {
        invoices.forEach((row) => {
          delete next[row.ksefNumber];
        });
      } else {
        invoices.forEach((row) => {
          next[row.ksefNumber] = row;
        });
      }
      return next;
    });
  };

  const goNext = () => {
    if (!page?.nextCursor) return;
    setHistory((current) => [...current, cursor]);
    setCursor(page.nextCursor);
  };

  const goBack = () => {
    if (!history.length) return;
    const previous = history[history.length - 1] ?? null;
    setHistory((current) => current.slice(0, -1));
    setCursor(previous);
  };

  const handleImport = async () => {
    const numbers = Object.keys(selected);
    if (!numbers.length) return;
    setImportError(null);
    const failed: { ksefNumber: string; invoiceNumber: string; error: string }[] =
      [];
    let imported = 0;
    let queue = numbers;
    let stoppedEarly = false;
    try {
      while (queue.length) {
        const batch = queue.slice(0, IMPORT_BATCH);
        const result = await importKsefInvoices(batch);
        imported += result.imported;
        failed.push(...result.failed);
        const pending = result.pending ?? [];
        if (pending.length >= batch.length) {
          stoppedEarly = true;
          break;
        }
        queue = pending;
      }
    } catch (importFailure) {
      setImportError(errorMessage(importFailure));
      return;
    }

    if (stoppedEarly) {
      setImportError('Nie udało się dokończyć importu, spróbuj ponownie');
      if (imported) {
        notify(
          'warning',
          `Zaimportowano ${imported}, reszta czeka na ponowienie`,
        );
      }
      return;
    }

    const failedNumbers = new Set(failed.map((item) => item.ksefNumber));
    setSelected((current) => {
      const next: Record<string, KsefCandidate> = {};
      Object.entries(current).forEach(([ksefNumber, row]) => {
        if (failedNumbers.has(ksefNumber)) next[ksefNumber] = row;
      });
      return next;
    });
    setCursor(null);
    setHistory([]);

    if (failed.length) {
      setImportError(
        failed
          .map((item) => {
            const label = item.invoiceNumber || item.ksefNumber;
            return `${label}: ${item.error}`;
          })
          .join('\n'),
      );
      notify(
        imported ? 'warning' : 'error',
        imported
          ? `Zaimportowano ${imported}, błędów: ${failed.length}`
          : 'Nie udało się zaimportować faktur',
      );
      return;
    }

    notify(
      'success',
      imported === 1
        ? 'Zaimportowano 1 fakturę'
        : `Zaimportowano ${imported} faktur`,
    );
  };

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  const windowLabel =
    page?.windowFrom && page?.windowTo
      ? `Od ${dayjs(page.windowFrom).format('DD.MM.YYYY')} do ${dayjs(page.windowTo).format('DD.MM.YYYY')}. `
      : '';

  return (
    <Modal open={open} onClose={handleClose}>
      <Stack sx={modalStyle({ width: 920 })} spacing={2}>
        <Typography variant="h4" align="center">
          {'Zaimportuj z KSeF'}
        </Typography>
        <Alert severity="info">
          {`${windowLabel} Lista zawiera tylko niezaimportowane faktury zakupowe, od najnowszych. Korekty, zaliczki i faktury już zapisane w systemie (także z pliku XML) są pominięte.`}
        </Alert>

        {isError && <Alert severity="error">{errorMessage(error)}</Alert>}
        {importError && (
          <Alert severity="error" sx={{ whiteSpace: 'pre-line' }}>
            {importError}
          </Alert>
        )}

        {isLoading || (isFetching && invoices.length === 0) ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress size={28} />
          </Box>
        ) : invoices.length === 0 ? (
          <Typography color="text.secondary" align="center" py={4}>
            {'Brak niezaimportowanych faktur w tym okresie.'}
          </Typography>
        ) : (
          <Stack spacing={0.5} sx={{ maxHeight: 420, overflow: 'auto' }}>
            <Stack direction="row" alignItems="center" spacing={1} px={1}>
              <Checkbox
                size="small"
                checked={allOnPageSelected}
                indeterminate={!allOnPageSelected && someOnPageSelected}
                disabled={busy}
                onChange={togglePage}
                inputProps={{ 'aria-label': 'Zaznacz faktury na stronie' }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                {'Numer / sprzedawca'}
              </Typography>
              <Typography variant="caption" color="text.secondary" width={110}>
                {'Data'}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                width={120}
                textAlign="right"
              >
                {'Brutto'}
              </Typography>
            </Stack>
            {invoices.map((row) => (
              <Stack
                key={row.ksefNumber}
                direction="row"
                alignItems="center"
                spacing={1}
                px={1}
              >
                <Checkbox
                  size="small"
                  checked={Boolean(selected[row.ksefNumber])}
                  disabled={busy}
                  onChange={() => toggleOne(row)}
                  inputProps={{
                    'aria-label': `Zaznacz ${row.invoiceNumber}`,
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap>
                    {row.invoiceNumber}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {row.sellerName || row.sellerNip}
                  </Typography>
                </Box>
                <Typography variant="body2" width={110}>
                  {row.issueDate
                    ? dayjs(row.issueDate).format('DD.MM.YYYY')
                    : ''}
                </Typography>
                <Typography variant="body2" width={120} textAlign="right">
                  {formatPrice(row.grossAmount, row.currency)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              disabled={busy || history.length === 0}
              onClick={goBack}
            >
              {'Poprzednia'}
            </Button>
            <Button
              variant="outlined"
              disabled={busy || !page?.nextCursor}
              onClick={goNext}
            >
              {'Następna'}
            </Button>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={handleClose} disabled={isPending}>
              {'Anuluj'}
            </Button>
            <Button
              variant="contained"
              onClick={handleImport}
              disabled={selectedCount === 0 || busy}
              startIcon={isPending ? <CircularProgress size={20} /> : null}
            >
              {selectedCount
                ? `Zaimportuj zaznaczone (${selectedCount})`
                : 'Zaimportuj zaznaczone'}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Modal>
  );
};
