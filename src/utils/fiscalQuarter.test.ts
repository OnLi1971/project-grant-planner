import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fiscalQuarterLabel, toQuarterRows } from './fiscalQuarter';

test('October–December 2026 is Q3 FY27', () => {
  for (const month of ['2026-10', '2026-11', '2026-12']) {
    assert.equal(fiscalQuarterLabel(month), 'Q3 FY27');
  }
});

test('January–March retain the fiscal ending year', () => {
  for (const month of ['2027-01', '2027-02', '2027-03']) {
    assert.equal(fiscalQuarterLabel(month), 'Q4 FY27');
  }
});

test('April starts the next fiscal year', () => {
  assert.equal(fiscalQuarterLabel('2026-04'), 'Q1 FY27');
  assert.equal(fiscalQuarterLabel('2027-04'), 'Q1 FY28');
  assert.equal(fiscalQuarterLabel('2026-07'), 'Q2 FY27');
});

test('quarter FTE is the average of its months', () => {
  const rows = toQuarterRows([{ key: '2026-10', capacity: 30 }, { key: '2026-11', capacity: 33 }, { key: '2026-12', capacity: 36 }]);
  assert.equal(rows[0].capacity, 33);
});
