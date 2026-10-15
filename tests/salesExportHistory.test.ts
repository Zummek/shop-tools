import assert from 'node:assert/strict';
import test from 'node:test';

import {
  lastCompleteExportDay,
  latestCoveredExport,
  suggestExportRange,
  type SalesExportRecord,
} from '../src/features/smSystem/ecommerce/utils/salesExportHistory.ts';

const record = (
  startDate: string,
  endDate: string,
  exportedAt: string,
  id: number,
): SalesExportRecord => ({
  id,
  startDate,
  endDate,
  sources: ['allegro'],
  exportedAt,
});

test('lastCompleteExportDay is the day before today', () => {
  assert.equal(lastCompleteExportDay('2026-10-15'), '2026-10-14');
});

test('suggestExportRange starts the day after the latest covered end', () => {
  const history = [
    record('2026-09-01', '2026-09-03', '2026-10-15T08:00:00Z', 2),
    record('2026-10-01', '2026-10-04', '2026-10-04T18:00:00Z', 1),
  ];
  const through = lastCompleteExportDay('2026-10-15');
  assert.deepEqual(latestCoveredExport(history)?.endDate, '2026-10-04');
  assert.deepEqual(suggestExportRange(history, through), {
    startDate: '2026-10-05',
    endDate: '2026-10-14',
    truncated: false,
  });
});

test('suggestExportRange is empty when the last export already covers yesterday', () => {
  const through = lastCompleteExportDay('2026-10-15');
  const history = [record('2026-10-10', through, '2026-10-15T18:00:00Z', 1)];
  assert.equal(suggestExportRange(history, through), null);
});

test('suggestExportRange caps a gap longer than 93 days', () => {
  const history = [
    record('2026-01-01', '2026-01-01', '2026-01-02T08:00:00Z', 1),
  ];
  const suggestion = suggestExportRange(
    history,
    lastCompleteExportDay('2026-10-15'),
  );
  assert.equal(suggestion?.truncated, true);
  assert.equal(suggestion?.startDate, '2026-01-02');
  assert.equal(suggestion?.endDate, '2026-04-04');
});
