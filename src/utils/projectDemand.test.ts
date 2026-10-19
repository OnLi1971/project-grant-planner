import { describe, test } from 'node:test';
import { strict as assert } from 'node:assert';
import { projectDemand } from './projectDemand';

describe('project monthly demand', () => {
  const demand = [{ projectCode: 'ST_EMU_INT', month: '2026-10', hours: 100 }];
  test('months mode keeps monthly hours as-is', () => {
    const rows = projectDemand(demand, ['CW40-2026'], 'months');
    assert.equal(rows.get('ST_EMU_INT')?.get('2026-10'), 100);
  });
  test('weeks mode conserves hours across weeks of the month', () => {
    const weeks = ['CW40-2026', 'CW41-2026', 'CW42-2026', 'CW43-2026', 'CW44-2026'];
    const rows = projectDemand(demand, weeks, 'weeks');
    const total = weeks.reduce((sum, w) => sum + (rows.get('ST_EMU_INT')?.get(w) || 0), 0);
    assert.ok(Math.abs(total - 100) < 1e-9, `expected 100, got ${total}`);
  });
  test('cross-month week splits demand by working days', () => {
    // CW40-2026: Sep 28–Oct 2; October has 3 of its 22 working days in this week.
    const weeks = ['CW40-2026', 'CW41-2026', 'CW42-2026', 'CW43-2026', 'CW44-2026'];
    const rows = projectDemand(demand, weeks, 'weeks');
    const value = rows.get('ST_EMU_INT')?.get('CW40-2026') || 0;
    assert.ok(Math.abs(value - 100 * 3 / 22) < 1e-9, `expected ${100 * 3 / 22}, got ${value}`);
  });
});
