import { captureError } from '../../../../services/sentry';
import { Pages } from '../../../../utils/pages';

import {
  conflictScheduleIdFromText,
  parsePriceScheduleApiError,
  priceScheduleConflictHash,
  PriceScheduleApiError,
} from './priceScheduleErrors';

type Notify = (
  variant: 'error' | 'warning' | 'success' | 'info',
  message: string,
  options?: { actionLabel?: string; onAction?: () => void },
) => void;

export const openPriceScheduleConflict = (scheduleId: number) => {
  const hash = priceScheduleConflictHash(
    scheduleId,
    Pages.smSystemEcommercePriceSchedules,
  );
  const url = `${window.location.origin}${window.location.pathname}#${hash}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const conflictAction = (scheduleId: number | null) =>
  scheduleId == null
    ? undefined
    : {
        actionLabel: `Otwórz #${scheduleId}`,
        onAction: () => openPriceScheduleConflict(scheduleId),
      };

export const notifyPriceScheduleFailure = (
  notify: Notify,
  err: unknown,
  fallback: string,
): PriceScheduleApiError => {
  const parsed = parsePriceScheduleApiError(err);
  if (!parsed.known) captureError(err);
  notify(
    'error',
    parsed.message || fallback,
    conflictAction(parsed.conflictScheduleId),
  );
  return parsed;
};

export const notifyPriceScheduleConflictText = (
  notify: Notify,
  variant: 'error' | 'warning',
  message: string,
) => {
  notify(variant, message, conflictAction(conflictScheduleIdFromText(message)));
};
