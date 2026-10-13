import { AxiosError } from 'axios';
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  conflictScheduleIdFromText,
  parsePriceScheduleApiError,
  priceScheduleConflictHash,
} from '../src/features/smSystem/ecommerce/utils/priceScheduleErrors.ts';

const axiosError = (status: number, data: unknown) =>
  new AxiosError('Request failed', String(status), undefined, undefined, {
    status,
    data,
    statusText: '',
    headers: {},
    config: {},
  } as AxiosError['response']);

test('conflictScheduleIdFromText reads harmonogram id', () => {
  assert.equal(
    conflictScheduleIdFromText(
      'Okno pokrywa się (harmonogram #68). Wyłącz tamten.',
    ),
    68,
  );
  assert.equal(conflictScheduleIdFromText('Uzupełnij cenę tymczasową'), null);
});

test('parsePriceScheduleApiError treats overlap windows as a known 400', () => {
  const parsed = parsePriceScheduleApiError(
    axiosError(400, {
      windows: [
        'Okno Pn 17:00 → Wt 07:00 pokrywa się z innym harmonogramem tej oferty (harmonogram #83).',
      ],
    }),
  );
  assert.equal(parsed.known, true);
  assert.equal(parsed.conflictScheduleId, 83);
  assert.match(parsed.message ?? '', /harmonogram #83/);
});

test('parsePriceScheduleApiError reads detail and ignores unknown failures', () => {
  const detail = parsePriceScheduleApiError(
    axiosError(400, { detail: ['Uzupełnij cenę tymczasową.'] }),
  );
  assert.equal(detail.known, true);
  assert.equal(detail.conflictScheduleId, null);
  assert.match(detail.message ?? '', /Uzupełnij cenę tymczasową/);

  const unknown = parsePriceScheduleApiError(axiosError(500, { oops: true }));
  assert.equal(unknown.known, false);
  assert.equal(unknown.message, null);

  assert.equal(parsePriceScheduleApiError(new Error('nope')).known, false);
});

test('priceScheduleConflictHash points at the active tab', () => {
  assert.equal(
    priceScheduleConflictHash(68, '/sm-system/ecommerce/price-schedules'),
    '/sm-system/ecommerce/price-schedules?tab=active&schedule=68',
  );
});
