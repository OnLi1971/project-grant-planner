import { test, expect } from 'bun:test';
import { capacityPeriodSummary } from './capacityPeriodSummary';

test('reports shortage when demand exceeds capacity', () => {
  const t = capacityPeriodSummary('Oct 26', [{ code: 'A', presales: false, fte: 8 }, { code: 'B', presales: true, fte: 4 }], 10);
  expect(t).toContain('Shortage of 2.0 FTE');
  expect(t).toContain('80 % of capacity');
});

test('reports surplus when capacity exceeds demand', () => {
  expect(capacityPeriodSummary('Nov 26', [{ code: 'A', presales: false, fte: 5 }], 7, 1)).toContain('Surplus of 2.0 FTE');
});
