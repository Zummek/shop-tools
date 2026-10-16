import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatExportMoment,
  formatExportRange,
  formatHistoryLabel,
} from '../src/features/smSystem/ecommerce/utils/salesExportHistory.ts';

test('formatExportRange collapses a single day', () => {
  assert.equal(formatExportRange('2026-10-15', '2026-10-15'), '15.10.2026');
  assert.equal(
    formatExportRange('2026-10-01', '2026-10-04'),
    '1.10.2026 – 4.10.2026',
  );
});

test('formatExportMoment uses Warsaw time', () => {
  const label = formatExportMoment('2026-10-15T22:30:00Z');
  assert.match(label, /16/);
  assert.match(label, /00:30|0:30/);
});

test('formatHistoryLabel prefers the stored cursor window', () => {
  assert.equal(
    formatHistoryLabel({
      startDate: '2026-10-01',
      endDate: '2026-10-02',
      coveredFrom: '2026-10-15T22:00:00Z',
      coveredUntil: '2026-10-16T22:00:00Z',
    }),
    `${formatExportMoment('2026-10-15T22:00:00Z')} – ${formatExportMoment('2026-10-16T22:00:00Z')}`,
  );
});

test('formatHistoryLabel falls back to calendar dates', () => {
  assert.equal(
    formatHistoryLabel({
      startDate: '2026-08-01',
      endDate: '2026-08-02',
      coveredFrom: null,
      coveredUntil: null,
    }),
    '1.08.2026 – 2.08.2026',
  );
});
