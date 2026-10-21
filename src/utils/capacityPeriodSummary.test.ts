import { test } from 'node:test';
import assert from 'node:assert/strict';
import { capacityPeriodSummary } from './capacityPeriodSummary';

test('reports shortage when demand exceeds capacity', () => {
  const t = capacityPeriodSummary('Oct 26', [{ code: 'A', presales: false, fte: 8 }, { code: 'B', presales: true, fte: 4 }], 10);
  assert.ok(t.includes('Shortage of 2.0 FTE'));
  assert.ok(t.includes('80 % of capacity'));
});

test('reports surplus when capacity exceeds demand', () => {
  assert.ok(capacityPeriodSummary('Nov 26', [{ code: 'A', presales: false, fte: 5 }], 7, 1).includes('Surplus of 2.0 FTE'));
});
