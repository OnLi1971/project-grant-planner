import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fiscalQuarterLabel, toQuarterRows } from './fiscalQuarter';

test('maps months to Indian fiscal quarters', () => {
  assert.equal(fiscalQuarterLabel('2026-10'), 'Q3-FY26');
  assert.equal(fiscalQuarterLabel('2027-01'), 'Q4-FY26');
  assert.equal(fiscalQuarterLabel('2027-04'), 'Q1-FY27');
});

test('quarter FTE is the average of its months', () => {
  const rows = toQuarterRows([{ key: '2026-10', capacity: 30 }, { key: '2026-11', capacity: 33 }, { key: '2026-12', capacity: 36 }]);
  assert.equal(rows[0].capacity, 33);
});
