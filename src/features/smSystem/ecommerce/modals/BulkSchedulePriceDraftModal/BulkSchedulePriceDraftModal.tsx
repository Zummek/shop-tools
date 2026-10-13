import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { LoadingButton } from '@mui/lab';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  IconButton,
  Modal,
  Stack,
  Typography,
} from '@mui/material';
import { useRef, useState } from 'react';

import { modalStyle } from '../../../../../components';
import { useNotify } from '../../../../../hooks';
import { formatPrice } from '../../../products/utils';
import { useBulkCreatePriceScheduleDrafts } from '../../api';
import { ChannelProductLink } from '../../types/channelLinks';
import {
  PriceScheduleBulkCreateError,
  PriceScheduleWindow,
} from '../../types/priceSchedules';
import {
  conflictScheduleIdFromText,
  formatPriceScheduleWindows,
  isPriceScheduleWindowValid,
  notifyPriceScheduleConflictText,
  notifyPriceScheduleFailure,
} from '../../utils';
import { PriceScheduleWindowsEditor } from '../PriceScheduleWindowsEditor/PriceScheduleWindowsEditor';

const draftNoun = (count: number) => {
  if (count === 1) return 'szkic';
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return 'szkice';
  return 'szkiców';
};

const draftIntro = (count: number) => {
  if (count === 1) return 'Powstanie 1 nieaktywny szkic.';
  const noun = draftNoun(count);
  const adjective = noun === 'szkice' ? 'nieaktywne' : 'nieaktywnych';
  return `Powstaną ${count} ${adjective} ${noun}.`;
};

interface Props {
  open: boolean;
  links: ChannelProductLink[];
  windows: PriceScheduleWindow[];
  onWindowsChange: (windows: PriceScheduleWindow[]) => void;
  onLinksChange: (links: ChannelProductLink[]) => void;
  onBack: () => void;
  onClose: () => void;
  onCreated: (createdCount: number) => void;
}

export const BulkSchedulePriceDraftModal = ({
  open,
  links,
  windows,
  onWindowsChange,
  onLinksChange,
  onBack,
  onClose,
  onCreated,
}: Props) => {
  const { notify } = useNotify();
  const { bulkCreatePriceScheduleDrafts, isPending } =
    useBulkCreatePriceScheduleDrafts();
  const [rowErrors, setRowErrors] = useState<PriceScheduleBulkCreateError[]>(
    [],
  );
  const [formError, setFormError] = useState<string | null>(null);
  const submitLock = useRef(false);

  const allWindowsValid =
    windows.length > 0 && windows.every(isPriceScheduleWindowValid);
  const canSubmit = links.length > 0 && allWindowsValid && !isPending;

  const removeLink = (id: number) => {
    setRowErrors((prev) => prev.filter((error) => error.id !== id));
    onLinksChange(links.filter((link) => link.id !== id));
  };

  const handleClose = () => {
    if (submitLock.current || isPending) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (submitLock.current || !canSubmit) return;
    submitLock.current = true;
    setFormError(null);
    setRowErrors([]);
    try {
      const result = await bulkCreatePriceScheduleDrafts({
        linkIds: links.map((link) => link.id),
        windows,
      });
      if (result.results.length > 0) onCreated(result.results.length);
      if (result.errors.length === 0) {
        notify(
          'success',
          `Utworzono ${result.results.length} ${draftNoun(result.results.length)}. Lista szkiców pokazuje nowe wpisy (bez filtra).`,
        );
        onClose();
        return;
      }
      const failedIds = new Set(result.errors.map((error) => error.id));
      onLinksChange(links.filter((link) => failedIds.has(link.id)));
      setRowErrors(result.errors);
      const conflictId = result.errors
        .map((error) => conflictScheduleIdFromText(error.error))
        .find((id) => id != null);
      const summary =
        result.results.length > 0
          ? `Utworzono ${result.results.length} ${draftNoun(
              result.results.length,
            )}. ${result.errors.length} nie udało się — szczegóły są na liście.`
          : `Nie udało się utworzyć ${result.errors.length} ${draftNoun(
              result.errors.length,
            )}.`;
      notifyPriceScheduleConflictText(
        notify,
        result.results.length > 0 ? 'warning' : 'error',
        conflictId == null
          ? summary
          : `${summary} Konflikt z harmonogramem #${conflictId}.`,
      );
    } catch (err) {
      const parsed = notifyPriceScheduleFailure(
        notify,
        err,
        'Nie udało się utworzyć harmonogramów',
      );
      setFormError(parsed.message || 'Nie udało się utworzyć harmonogramów');
    } finally {
      submitLock.current = false;
    }
  };

  const nameById = new Map(
    links.map((link) => [link.id, link.offerName || link.externalOfferId]),
  );

  return (
    <Modal open={open} onClose={handleClose}>
      <Stack
        sx={{
          ...modalStyle({ width: 720 }),
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        spacing={2.5}
      >
        <Typography variant="h4" align="center">
          {'Zaplanuj zmianę ceny'}
        </Typography>

        <Alert severity="info">
          {links.length === 0
            ? 'Nie ma wybranych ofert. Wróć do wyboru i zaznacz co najmniej jedną.'
            : `${draftIntro(links.length)} Cena tymczasowa zostanie pusta — uzupełnisz ją w edycji przed włączeniem. Cena bazowa to aktualna cena każdej oferty.`}
          {allWindowsValid
            ? ` Okna: ${formatPriceScheduleWindows(windows)}.`
            : ''}
        </Alert>

        <Accordion
          defaultExpanded
          disableGutters
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={600}>
              {`Wybrane oferty (${links.length})`}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {links.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {'Lista jest pusta.'}
              </Typography>
            ) : (
              <Stack spacing={1} sx={{ maxHeight: 220, overflowY: 'auto' }}>
                {links.map((link) => (
                  <Stack
                    key={link.id}
                    direction="row"
                    alignItems="center"
                    spacing={1}
                  >
                    <Stack sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={600} noWrap>
                        {link.offerName || link.externalOfferId}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {`Oferta ${link.externalOfferId} · cena bazowa ${
                          link.price != null
                            ? formatPrice(
                                link.price,
                                link.currency || undefined,
                              )
                            : '—'
                        }`}
                      </Typography>
                    </Stack>
                    <IconButton
                      size="small"
                      aria-label={`Usuń ${link.offerName || link.externalOfferId}`}
                      disabled={isPending}
                      onClick={() => removeLink(link.id)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
            )}
          </AccordionDetails>
        </Accordion>

        <PriceScheduleWindowsEditor
          windows={windows}
          onChange={onWindowsChange}
          disabled={isPending}
          active={open}
        />

        {rowErrors.length > 0 && (
          <Alert severity="error">
            <Stack spacing={0.5}>
              {rowErrors.map((error) => (
                <Typography key={error.id} variant="body2">
                  {`${nameById.get(error.id) || `Oferta ${error.id}`}: ${error.error}`}
                </Typography>
              ))}
            </Stack>
          </Alert>
        )}

        {formError && <Alert severity="error">{formError}</Alert>}

        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Button variant="text" onClick={onBack} disabled={isPending}>
            {'Wróć do wyboru'}
          </Button>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={handleClose}
              disabled={isPending}
            >
              {'Anuluj'}
            </Button>
            <LoadingButton
              variant="contained"
              onClick={handleSubmit}
              loading={isPending}
              disabled={!canSubmit}
            >
              {links.length > 0
                ? `Utwórz ${links.length} ${draftNoun(links.length)}`
                : 'Utwórz szkice'}
            </LoadingButton>
          </Stack>
        </Stack>
      </Stack>
    </Modal>
  );
};
