import { TextField, Tooltip } from '@mui/material';
import { useEffect, useState } from 'react';

const centsToDraft = (cents: number | null) =>
  cents == null ? '' : (cents / 100).toFixed(2).replace('.', ',');

const draftToCents = (raw: string): number | null | undefined => {
  const trimmed = raw.trim().replace(',', '.');
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.round(parsed * 100);
};

export const SellerShippingCostField = ({
  valueCents,
  disabled,
  onCommit,
}: {
  valueCents: number | null;
  disabled?: boolean;
  onCommit: (cents: number | null) => Promise<void> | void;
}) => {
  const [draft, setDraft] = useState(() => centsToDraft(valueCents));

  useEffect(() => {
    setDraft(centsToDraft(valueCents));
  }, [valueCents]);

  return (
    <Tooltip title="Opcjonalny narzut nad billingiem Allegro. Puste = bierzemy opłaty za dostawę z billingu. 0 jest OK (np. odbiór).">
      <TextField
        size="small"
        label="Koszt wysyłki (zł)"
        value={draft}
        disabled={disabled}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={async () => {
          const next = draftToCents(draft);
          if (next === undefined) {
            setDraft(centsToDraft(valueCents));
            return;
          }
          if (next === valueCents) {
            setDraft(centsToDraft(valueCents));
            return;
          }
          try {
            await onCommit(next);
          } catch {
            setDraft(centsToDraft(valueCents));
          }
        }}
        sx={{ width: { xs: '100%', sm: 160 } }}
      />
    </Tooltip>
  );
};
