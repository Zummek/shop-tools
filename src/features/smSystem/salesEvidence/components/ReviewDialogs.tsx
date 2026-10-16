import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  InputAdornment,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';

import type { ReviewItem } from '../types';
import { formatMoney, sharesSumTo100 } from '../utils/format';

type Run = (name: string, body: object) => Promise<{ ok: boolean }>;

interface DialogProps {
  item: ReviewItem;
  onClose: () => void;
  run: Run;
}

export const BundleSharesDialog = ({ item, onClose, run }: DialogProps) => {
  const components = item.components ?? [];
  const [shares, setShares] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      components.map((component) => [
        String(component.productId),
        (item.suggestedShares?.[String(component.productId)] ?? '').replace('.', ','),
      ]),
    ),
  );
  const [saving, setSaving] = useState(false);
  const blankShare = Object.values(shares).some((value) => value.trim() === '');
  const valid = sharesSumTo100(shares);
  const sum =
    Object.values(shares).reduce(
      (total, value) => total + Math.round(Number(value.replace(',', '.')) * 100 || 0),
      0,
    ) / 100;

  const submit = async () => {
    setSaving(true);
    const normalized = Object.fromEntries(
      Object.entries(shares).map(([key, value]) => [key, value.replace(',', '.')]),
    );
    const result = await run('bundle-shares', { offerId: item.offerId, shares: normalized });
    setSaving(false);
    if (result.ok) onClose();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{'Podział wartości zestawu'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2">
            {`Oferta „${item.offerName ?? item.externalName ?? ''}” zawiera towary w różnych stawkach VAT. Podaj, jaką część ceny zestawu stanowi każdy towar. Przykład: kawa 60%, kubek 40% – przy cenie 100 zł 60 zł idzie w stawce kawy, a 40 zł w stawce kubka.`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {'Propozycję wyliczyliśmy z cen katalogowych. Podział zapisze się na ofercie i obejmie wszystkie jej zamówienia, także w kolejnych dowodach.'}
          </Typography>
          {components.map((component) => (
            <TextField
              key={component.productId}
              size="small"
              label={`${component.name} (VAT ${component.vat}%)`}
              value={shares[String(component.productId)] ?? ''}
              onChange={(event) =>
                setShares((prev) => ({
                  ...prev,
                  [String(component.productId)]: event.target.value,
                }))
              }
              InputProps={{
                endAdornment: <InputAdornment position="end">{'%'}</InputAdornment>,
              }}
            />
          ))}
          <Alert severity={valid ? 'success' : 'warning'}>
            {blankShare
              ? 'Uzupełnij udział każdego produktu. Puste pole nie liczy się jako zero.'
              : valid
                ? 'Udziały sumują się do 100%.'
                : `Udziały muszą sumować się do 100% (teraz ${sum.toFixed(2).replace('.', ',')}%).`}
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{'Anuluj'}</Button>
        <LoadingButton variant="contained" disabled={!valid} loading={saving} onClick={submit}>
          {'Zapisz podział na ofercie'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export const AmountMismatchDialog = ({ item, onClose, run }: DialogProps) => {
  const [value, setValue] = useState<'items' | 'payment' | ''>('');
  const [saving, setSaving] = useState(false);
  const currency = item.currency ?? 'PLN';

  const submit = async () => {
    setSaving(true);
    const result = await run('payment-basis', { orderId: item.orderId, value });
    setSaving(false);
    if (result.ok) onClose();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{`Zamówienie ${item.orderExternalId}: od jakiej kwoty liczyć VAT?`}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2">
            {`Suma pozycji z wysyłką to ${formatMoney(item.itemsTotal ?? 0, currency)}, a kupujący zapłacił ${formatMoney(item.paidTotal ?? 0, currency)}. Wybierz, skąd jest różnica.`}
          </Typography>
          <RadioGroup
            value={value}
            onChange={(event) => setValue(event.target.value as 'items' | 'payment')}
          >
            <FormControlLabel
              value="items"
              control={<Radio size="small" />}
              sx={{ alignItems: 'flex-start', mb: 1 }}
              label={
                <Stack sx={{ pt: 0.75 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {`Suma pozycji – ${formatMoney(item.itemsTotal ?? 0, currency)}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {'Różnicę dopłaciła platforma (np. kupon finansowany przez Allegro). Kupujący zapłacił mniej, ale Ty dostajesz pełną cenę – VAT od pełnej ceny.'}
                  </Typography>
                </Stack>
              }
            />
            <FormControlLabel
              value="payment"
              control={<Radio size="small" />}
              sx={{ alignItems: 'flex-start' }}
              label={
                <Stack sx={{ pt: 0.75 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {`Kwota wpłaty – ${formatMoney(item.paidTotal ?? 0, currency)}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {'To Twój rabat dla kupującego (kupon sklepu, obniżka). VAT od tego, co kupujący faktycznie zapłacił; rabat rozkładamy proporcjonalnie na stawki.'}
                  </Typography>
                </Stack>
              }
            />
          </RadioGroup>
          <Typography variant="caption" color="text.secondary">
            {'Decyzja zapisze się przy zamówieniu razem z tym, kto i kiedy ją podjął, i będzie widoczna w wykazie dowodu.'}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{'Anuluj'}</Button>
        <LoadingButton variant="contained" disabled={!value} loading={saving} onClick={submit}>
          {'Zapisz decyzję'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export const ManualRefundDialog = ({ item, onClose, run }: DialogProps) => {
  const [day, setDay] = useState<Dayjs | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const amountValid = /^\d+([.,]\d{1,2})?$/.test(amount.trim()) && Number(amount.replace(',', '.')) > 0;
  const dayValid = Boolean(day?.isValid());

  const submit = async () => {
    if (!day?.isValid()) return;
    setSaving(true);
    const result = await run('manual-refund', {
      orderId: item.orderId,
      refundedAt: day.format('YYYY-MM-DD'),
      amount: amount.trim(),
      note,
    });
    setSaving(false);
    if (result.ok) onClose();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{`Zwrot pieniędzy – zamówienie ${item.orderExternalId}`}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2">
            {'Wpisz, kiedy i ile pieniędzy oddałeś kupującemu (np. przelewem). Zwrot wejdzie jako kwota ujemna do dowodu za okres, w którym go zrobiłeś, ze stawkami VAT pierwotnej sprzedaży.'}
          </Typography>
          <DatePicker
            label="Data zwrotu"
            value={day}
            onChange={setDay}
            maxDate={dayjs()}
            slotProps={{ textField: { size: 'small' } }}
          />
          <TextField
            size="small"
            label="Kwota zwrotu"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="np. 49,99"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {item.currency && item.currency !== 'PLN' ? item.currency : 'zł'}
                </InputAdornment>
              ),
            }}
            error={!!amount && !amountValid}
            helperText={
              amount && !amountValid ? 'Wpisz kwotę w walucie zamówienia, np. 49,99' : ' '
            }
          />
          <TextField
            size="small"
            label="Notatka (opcjonalnie)"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{'Anuluj'}</Button>
        <LoadingButton
          variant="contained"
          disabled={!dayValid || !amountValid}
          loading={saving}
          onClick={submit}
        >
          {'Zapisz zwrot'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};
