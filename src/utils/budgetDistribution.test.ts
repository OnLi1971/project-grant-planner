import { describe, expect, test } from 'bun:test';
import { distribute, rebalance } from './budgetDistribution';

const months = ['2026-11', '2026-12', '2027-01', '2027-02', '2027-03'];
const sum = (p: { hours: number }[]) => p.reduce((s, m) => s + m.hours, 0);

describe('budgetDistribution', () => {
  test('every profile sums exactly to budget', () => {
    for (const p of ['even', 'ramp-up', 's-curve', 'ramp-down'] as const) {
      expect(sum(distribute(1003, months, p))).toBe(1003);
    }
  });
  test('ramp-up starts lower than it ends', () => {
    const d = distribute(1000, months, 'ramp-up');
    expect(d[0].hours).toBeLessThan(d[4].hours);
  });
  test('rebalance keeps total and locked months', () => {
    const d = distribute(1000, months, 'even');
    const r = rebalance(d, 0, 50, new Set(['2026-12']), 1000);
    expect(sum(r)).toBe(1000);
    expect(r[0].hours).toBe(50);
    expect(r[1].hours).toBe(200);
  });
});
