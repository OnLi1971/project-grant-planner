import { test } from 'node:test';
import assert from 'node:assert/strict';
import { revenueQuarterPeriods } from './revenueQuarters';

test('revenue Q3 FY27 contains October through December 2026', () => {
  const quarter = revenueQuarterPeriods(2026, 2027).find(q => q.key === 'Q3 FY27');
  assert.deepEqual(quarter?.months, ['říjen_2026', 'listopad_2026', 'prosinec_2026']);
  assert.equal(quarter?.dateRange, '1 Oct – 31 Dec 2026');
});

test('revenue periods preserve both calendar years without overlapping months', () => {
  const quarters = revenueQuarterPeriods(2026, 2027);
  assert.deepEqual(quarters.map(q => q.key), ['Q4 FY26', 'Q1 FY27', 'Q2 FY27', 'Q3 FY27', 'Q4 FY27', 'Q1 FY28', 'Q2 FY28', 'Q3 FY28']);
  const months = quarters.flatMap(q => q.months);
  assert.equal(months.length, 24);
  assert.equal(new Set(months).size, 24);
});