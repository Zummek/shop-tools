import assert from 'node:assert/strict';
import test from 'node:test';

import {
  countLabel,
  documentFileName,
  formatDay,
  formatMoment,
  formatMoney,
  formatPeriod,
  formatPln,
  monthDayStates,
  monthName,
  parseEvidenceSearch,
  previousMonthRange,
  sameMonth,
  sharesSumTo100,
  warsawToday,
} from '../src/features/smSystem/salesEvidence/utils/format.ts';

const nbsp = (text: string) => text.replace(/\u00a0/g, ' ');

test('formatPln groups thousands and keeps grosze', () => {
  assert.equal(nbsp(formatPln(1390925)), '13 909,25 zł');
  assert.equal(formatPln(5), '0,05 zł');
  assert.equal(nbsp(formatPln(-21425)), '-214,25 zł');
  assert.equal(nbsp(formatPln(100000000, '')), '1 000 000,00');
  assert.equal(formatMoney(5000, 'EUR'), '50,00 EUR');
});

test('dates and periods', () => {
  assert.equal(formatDay('2026-09-14'), '14.09.2026');
  assert.equal(formatPeriod('2026-09-01', '2026-09-30'), '01.09.2026 – 30.09.2026');
  assert.equal(formatPeriod('2026-09-05', '2026-09-05'), '05.09.2026');
  assert.equal(formatMoment('2026-09-30T22:30:00Z'), '01.10.2026 00:30');
  assert.equal(sameMonth('2026-09-01', '2026-09-30'), true);
  assert.equal(sameMonth('2026-09-20', '2026-10-05'), false);
  assert.equal(warsawToday(new Date('2026-09-30T22:30:00Z')), '2026-10-01');
  assert.equal(monthName('2026-09-01'), 'wrzesień 2026');
});

test('previousMonthRange crosses the year', () => {
  assert.deepEqual(previousMonthRange('2026-10-16'), ['2026-09-01', '2026-09-30']);
  assert.deepEqual(previousMonthRange('2027-01-03'), ['2026-12-01', '2026-12-31']);
  assert.deepEqual(previousMonthRange('2028-03-01'), ['2028-02-01', '2028-02-29']);
});

test('file names follow the document number', () => {
  assert.equal(documentFileName('DW/ALL/2026/09/1', 'pdf'), 'DW_ALL_2026_09_1.pdf');
  assert.equal(documentFileName('DW-K/ERL/2026/09/2', 'xlsx'), 'DW-K_ERL_2026_09_2.xlsx');
});

test('Polish plurals', () => {
  assert.equal(countLabel(1, 'wpłata', 'wpłaty', 'wpłat'), '1 wpłata');
  assert.equal(countLabel(3, 'wpłata', 'wpłaty', 'wpłat'), '3 wpłaty');
  assert.equal(countLabel(12, 'wpłata', 'wpłaty', 'wpłat'), '12 wpłat');
  assert.equal(countLabel(22, 'wpłata', 'wpłaty', 'wpłat'), '22 wpłaty');
  assert.equal(countLabel(0, 'wpłata', 'wpłaty', 'wpłat'), '0 wpłat');
});

test('month day states', () => {
  const states = monthDayStates(
    2026,
    9,
    [{ periodFrom: '2026-09-01', periodTo: '2026-09-14' }],
    ['2026-09-10', '2026-09-20'],
  );
  assert.equal(states.length, 30);
  assert.equal(states[9].state, 'covered');
  assert.equal(states[19].state, 'missing');
  assert.equal(states[20].state, 'empty');
});

test('bundle shares must sum to 100', () => {
  assert.equal(sharesSumTo100({ a: '60', b: '40' }), true);
  assert.equal(sharesSumTo100({ a: '33,33', b: '66,67' }), true);
  assert.equal(sharesSumTo100({ a: '60', b: '30' }), false);
  assert.equal(sharesSumTo100({ a: '-10', b: '110' }), false);
  assert.equal(sharesSumTo100({ a: '100', b: '' }), false);
  assert.equal(sharesSumTo100({ a: '100', b: '  ' }), false);
});

test('evidence search keeps a channel and full dates only', () => {
  const parsed = parseEvidenceSearch(
    new URLSearchParams('channel=woocommerce&from=2026-09-01&to=2026-09-30'),
  );
  assert.deepEqual(parsed, {
    channel: 'woocommerce',
    from: '2026-09-01',
    to: '2026-09-30',
  });
  const junk = parseEvidenceSearch(
    new URLSearchParams('channel=shop&from=2026-9-1&to=nope'),
  );
  assert.deepEqual(junk, {});
});
