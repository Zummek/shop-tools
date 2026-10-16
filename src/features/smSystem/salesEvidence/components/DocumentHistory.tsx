import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import { useRecheckDocument, useSalesEvidenceActions, useSalesEvidenceDownload } from '../api';
import type { EvidenceRow, SalesEvidenceChannel, SalesEvidenceDocument } from '../types';
import { countLabel, formatDay, formatMoment, formatPeriod, formatPln } from '../utils/format';

import { RateTable } from './RateTable';

const STATUS_COLORS = {
  issued: 'info',
  handed_over: 'success',
  cancelled: 'default',
} as const;

const ReasonDialog = ({
  title,
  description,
  confirmLabel,
  loading,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) => {
  const [reason, setReason] = useState('');
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2">{description}</Typography>
          <TextField
            autoFocus
            multiline
            minRows={2}
            label="Powód"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            helperText="Powód trafi do historii i na dokument."
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{'Wróć'}</Button>
        <LoadingButton
          variant="contained"
          color="warning"
          disabled={!reason.trim()}
          loading={loading}
          onClick={() => onConfirm(reason.trim())}
        >
          {confirmLabel}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

const rowText = (row: EvidenceRow | null) =>
  row
    ? `${formatDay(row.obligationDate)} · ${row.rate}% · ${formatPln(row.gross)}`
    : 'brak';

const Recheck = ({
  doc,
  auto,
  canManage,
  onCancel,
  onCorrection,
}: {
  doc: SalesEvidenceDocument;
  auto: boolean;
  canManage: boolean;
  onCancel: () => void;
  onCorrection: () => void;
}) => {
  const [requested, setRequested] = useState(auto);
  const { data, isFetching, isError } = useRecheckDocument(doc.id, requested);

  if (!requested)
    {return (
      <Box>
        <Button size="small" onClick={() => setRequested(true)}>
          {'Sprawdź, czy dane się zmieniły'}
        </Button>
      </Box>
    );}
  if (isFetching)
    {return (
      <Typography variant="body2" color="text.secondary">
        {'Porównuję dowód z aktualnymi danymi…'}
      </Typography>
    );}
  if (isError || !data)
    return <Alert severity="error">{'Nie udało się porównać dowodu z aktualnymi danymi.'}</Alert>;
  if (!data.hasChanges)
    {return (
      <Typography variant="body2" color="success.main">
        {'Dane się nie zmieniły od wystawienia – dowód jest aktualny.'}
      </Typography>
    );}

  return (
    <Alert severity="warning">
      <Stack spacing={1}>
        <Typography variant="body2" fontWeight={500}>
          {`Od wystawienia zmieniły się dane: ${countLabel(data.changed.length, 'transakcja', 'transakcje', 'transakcji')} (np. nowa stawka produktu, faktura, dociągnięta płatność).`}
        </Typography>
        <Typography variant="body2">{data.hint}</Typography>
        <RateTable buckets={data.diffTotals} showRows={false} />
        <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
          {data.changed.slice(0, 10).map((change, index) => (
            <li key={index}>
              <Typography variant="body2">
                {`${change.after?.orderExternalId ?? change.before?.orderExternalId ?? ''}: było ${rowText(change.before)}, jest ${rowText(change.after)}`}
              </Typography>
            </li>
          ))}
        </Box>
        {data.changed.length > 10 ? (
          <Typography variant="caption">{`…i ${data.changed.length - 10} więcej.`}</Typography>
        ) : null}
        {data.review.length > 0 ? (
          <Typography variant="body2">
            {`Najpierw wyjaśnij ${countLabel(data.review.length, 'pozycję', 'pozycje', 'pozycji')} w podglądzie tego okresu – korekta nie może zawierać niepewnych kwot.`}
          </Typography>
        ) : null}
        {canManage && data.nextStep ? (
          <Box>
            {data.nextStep === 'correction' ? (
              <Button
                size="small"
                variant="contained"
                color="warning"
                disabled={data.review.length > 0}
                onClick={onCorrection}
              >
                {'Wystaw dowód korygujący'}
              </Button>
            ) : (
              <Button size="small" variant="contained" color="warning" onClick={onCancel}>
                {'Anuluj dowód, aby wystawić go ponownie'}
              </Button>
            )}
          </Box>
        ) : null}
      </Stack>
    </Alert>
  );
};

interface Props {
  documents: SalesEvidenceDocument[];
  canManage: boolean;
  channel: SalesEvidenceChannel;
  autoRecheckMonth: string;
}

export const DocumentHistory = ({ documents, canManage, channel, autoRecheckMonth }: Props) => {
  const actions = useSalesEvidenceActions(channel);
  const downloads = useSalesEvidenceDownload();
  const [dialog, setDialog] = useState<{
    type: 'cancel' | 'correction' | 'handOver';
    doc: SalesEvidenceDocument;
  } | null>(null);

  if (documents.length === 0)
    {return (
      <Typography variant="body2" color="text.secondary">
        {'Nie wystawiono jeszcze żadnego dowodu dla tego kanału.'}
      </Typography>
    );}

  return (
    <Stack spacing={1.5}>
      {documents.map((doc) => {
        const isEvidence = doc.kind === 'evidence';
        const active = doc.status !== 'cancelled';
        return (
          <Paper key={doc.id} variant="outlined" sx={{ p: 1.5, opacity: active ? 1 : 0.7 }}>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
                <Typography fontWeight={600}>{doc.number}</Typography>
                <Chip size="small" label={isEvidence ? 'dowód' : 'korekta'} variant="outlined" />
                <Chip size="small" color={STATUS_COLORS[doc.status]} label={doc.statusLabel} />
                <Typography variant="body2" color="text.secondary">
                  {formatPeriod(doc.periodFrom, doc.periodTo)}
                </Typography>
              </Stack>
              <Typography variant="body2">
                {`Brutto ${formatPln(doc.totals.gross ?? 0)}, w tym VAT ${formatPln(doc.totals.vat ?? 0)}`}
                {isEvidence ? '' : ` · korekta do ${doc.correctsNumber ?? ''}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {`Wystawił(a) ${doc.issuedByName ?? '—'}, ${formatMoment(doc.issuedAt)}`}
                {doc.handedOverAt
                  ? ` · przekazany do księgowości: ${doc.handedOverByName ?? '—'}, ${formatMoment(doc.handedOverAt)}`
                  : ''}
                {doc.cancelledAt
                  ? ` · anulowany: ${doc.cancelledByName ?? '—'}, ${formatMoment(doc.cancelledAt)} – ${doc.cancelReason}`
                  : ''}
                {doc.reason && !isEvidence ? ` · powód korekty: ${doc.reason}` : ''}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                <LoadingButton
                  size="small"
                  variant="outlined"
                  loading={downloads.pending === `${doc.id}-pdf`}
                  onClick={() => downloads.downloadDocument(doc, 'pdf')}
                >
                  {'PDF'}
                </LoadingButton>
                <LoadingButton
                  size="small"
                  variant="outlined"
                  loading={downloads.pending === `${doc.id}-xlsx`}
                  onClick={() => downloads.downloadDocument(doc, 'xlsx')}
                >
                  {'XLSX (wykaz)'}
                </LoadingButton>
                {canManage && doc.status === 'issued' ? (
                  <>
                    <Button size="small" onClick={() => setDialog({ type: 'handOver', doc })}>
                      {'Oznacz jako przekazany do księgowości'}
                    </Button>
                    <Button size="small" color="warning" onClick={() => setDialog({ type: 'cancel', doc })}>
                      {'Anuluj'}
                    </Button>
                  </>
                ) : null}
              </Stack>
              {isEvidence && active ? (
                <Recheck
                  doc={doc}
                  auto={doc.periodFrom.slice(0, 7) === autoRecheckMonth}
                  canManage={canManage}
                  onCancel={() => setDialog({ type: 'cancel', doc })}
                  onCorrection={() => setDialog({ type: 'correction', doc })}
                />
              ) : null}
            </Stack>
          </Paper>
        );
      })}

      {dialog?.type === 'cancel' ? (
        <ReasonDialog
          title={`Anulować ${dialog.doc.number}?`}
          description="Anuluj, jeśli dowód nie trafił jeszcze do księgowej albo zawiera błąd. Numer zostaje w historii (nie zostanie użyty ponownie), a dni z tego okresu znów będzie można objąć nowym dowodem."
          confirmLabel="Anuluj dowód"
          loading={actions.pending.has(`cancel-${dialog.doc.id}`)}
          onClose={() => setDialog(null)}
          onConfirm={async (reason) => {
            const result = await actions.cancel(dialog.doc.id, reason);
            if (result.ok) setDialog(null);
          }}
        />
      ) : null}
      {dialog?.type === 'correction' ? (
        <ReasonDialog
          title={`Dowód korygujący do ${dialog.doc.number}`}
          description="Korekta zawiera tabelę stawek przed, po i różnicę oraz listę zmienionych transakcji. Księgowa ujmie ją w korekcie JPK za okres pierwotnego dowodu."
          confirmLabel="Wystaw korektę"
          loading={actions.pending.has(`correction-${dialog.doc.id}`)}
          onClose={() => setDialog(null)}
          onConfirm={async (reason) => {
            const result = await actions.correction(dialog.doc.id, reason);
            if (result.ok) setDialog(null);
          }}
        />
      ) : null}
      {dialog?.type === 'handOver' ? (
        <Dialog open onClose={() => setDialog(null)} maxWidth="sm" fullWidth>
          <DialogTitle>{`Przekazać ${dialog.doc.number} do księgowości?`}</DialogTitle>
          <DialogContent>
            <Typography variant="body2">
              {'Oznacz, gdy wyślesz PDF i XLSX księgowej. Od tej chwili dowodu nie da się anulować – jeśli później zmienią się dane, wystawisz dowód korygujący.'}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialog(null)}>{'Wróć'}</Button>
            <LoadingButton
              variant="contained"
              loading={actions.pending.has(`hand-over-${dialog.doc.id}`)}
              onClick={async () => {
                const result = await actions.handOver(dialog.doc.id);
                if (result.ok) setDialog(null);
              }}
            >
              {'Tak, przekazany'}
            </LoadingButton>
          </DialogActions>
        </Dialog>
      ) : null}
    </Stack>
  );
};
