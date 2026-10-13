import { isAxiosError } from 'axios';

const MESSAGE_KEYS = [
  'windows',
  'detail',
  'linkId',
  'temporaryPrice',
  'originalPrice',
  'applyMode',
  'originalApplyMode',
  'nonFieldErrors',
] as const;

const CONFLICT_RE = /harmonogram #(\d+)/;

export type PriceScheduleApiError = {
  message: string | null;
  conflictScheduleId: number | null;
  /** Expected validation (HTTP 400 with a readable message). Do not report. */
  known: boolean;
};

export const conflictScheduleIdFromText = (text: string): number | null => {
  const match = text.match(CONFLICT_RE);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const pushText = (messages: string[], value: unknown) => {
  if (typeof value === 'string' && value.trim()) {
    messages.push(value.trim());
    return;
  }
  if (!Array.isArray(value)) return;
  for (const item of value)
    if (typeof item === 'string' && item.trim()) messages.push(item.trim());
};

export const messagesFromPriceScheduleBody = (data: unknown): string[] => {
  if (!data || typeof data !== 'object') return [];
  const record = data as Record<string, unknown>;
  const messages: string[] = [];
  for (const key of MESSAGE_KEYS) pushText(messages, record[key]);
  return messages;
};

export const parsePriceScheduleApiError = (
  err: unknown,
): PriceScheduleApiError => {
  if (!isAxiosError(err))
    return { message: null, conflictScheduleId: null, known: false };

  const message = messagesFromPriceScheduleBody(err.response?.data).join(' ');
  const text = message.trim() || null;
  const known = err.response?.status === 400 && text != null;

  return {
    message: text,
    conflictScheduleId: text ? conflictScheduleIdFromText(text) : null,
    known,
  };
};

/** Hash-router location for a conflicting schedule (active tab, no search). */
export const priceScheduleConflictHash = (scheduleId: number, path: string) => {
  const params = new URLSearchParams();
  params.set('tab', 'active');
  params.set('schedule', String(scheduleId));
  return `${path}?${params.toString()}`;
};
