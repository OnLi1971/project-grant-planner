import { describe, test } from 'node:test';
import { strict as assert } from 'node:assert';
import { distribute, rebalance } from './budgetDistribution';

const months = ['2026-11', '2026-12', '2027-01', '2027-02', '2027-03'];
const sum = (p: { hours: number }[]) => p.reduce((s, m) => s + m.hours, 0);

describe('budgetDistribution', () => {
  test('every profile sums exactly to budget', () => {
    for (const p of ['even', 'ramp-up', 's-curve', 'ramp-down'] as const) {
      assert.equal(sum(distribute(1003, months, p)), 1003);
    }
  });
  test('ramp-up starts lower than it ends', () => {
    const d = distribute(1000, months, 'ramp-up');
    assert.ok(d[0].hours < d[4].hours);
  });
  test('rebalance keeps total and locked months', () => {
    const d = distribute(1000, months, 'even');
    const r = rebalance(d, 0, 50, new Set(['2026-12']), 1000);
    assert.equal(sum(r), 1000);
    assert.equal(r[0].hours, 50);
    assert.equal(r[1].hours, 200);
  });
});
