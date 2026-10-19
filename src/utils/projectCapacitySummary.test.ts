import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import type { PlanningEntry } from '../types/planning';
import { projectCapacitySummary } from './projectCapacitySummary';
const base: PlanningEntry = { engineer_id: null, konstrukter: 'A', cw: 'CW44-2026', mesic: '', projekt: 'ST_JIGS', mhTyden: 20, projekt2: 'ST_EMU_INT', mhTyden2: 20 };
test('holiday week capacity is 4 days × 7.2 and overplanning cannot hide another engineer’s free time', () => {
  const free = { ...base, konstrukter: 'B', projekt: 'FREE', mhTyden: 40, projekt2: null };
  const stats = projectCapacitySummary([base, free], [], [base.cw], 'weeks').get(base.cw);
  assert.ok(stats);
  assert.ok(Math.abs(stats.maxHours - 57.6) < 0.00001);
  assert.ok(Math.abs(stats.freeHours - 28.8) < 0.00001);
  assert.equal(stats.realHours, 40);
  assert.equal(stats.engineerCount, 1);
  assert.equal(stats.utilization, 50);
});
test('full leave FTE and hours share holiday-adjusted denominator', () => {
  const stats = projectCapacitySummary([{ ...base, projekt: 'DOVOLENÁ', mhTyden: 40, projekt2: null }], [], [base.cw], 'weeks').get(base.cw);
  assert.ok(stats);
  assert.ok(Math.abs(stats.leaveHours - 28.8) < 0.00001);
  assert.equal(stats.leaveFte, 1);
  assert.equal(stats.freeHours, 0);
});
test('partial leave reduces capacity, not free hours', () => {
  const stats = projectCapacitySummary([{ ...base, mhTyden: 14.4, projekt2: null, leaveDays: 2 }], [], [base.cw], 'weeks').get(base.cw);
  assert.ok(stats);
  assert.ok(Math.abs(stats.leaveHours - 14.4) < 0.00001);
  assert.ok(Math.abs(stats.freeHours) < 0.00001);
});
test('monthly raw productive hours equal project row totals and secondary is counted once', () => {
  const entry = { ...base, cw: 'CW40-2026' };
  const stats = projectCapacitySummary([entry, { ...entry, isSecondary: true }], [], [entry.cw], 'months');
  assert.ok(Math.abs((stats.get('2026-09')?.realHours || 0) - 24) < 0.00001);
  assert.equal(stats.get('2026-10')?.realHours, 16);
});
test('missing weeks stay free, departed engineers are excluded', () => {
  const stats = projectCapacitySummary([base], [{ id: 'a', display_name: 'A', slug: 'a', status: 'active', end_date: '2026-10-30' }], ['CW45-2026'], 'weeks').get('CW45-2026');
  assert.equal(stats?.maxHours, 0);
  const active = projectCapacitySummary([base], [], ['CW45-2026'], 'weeks').get('CW45-2026');
  assert.equal(active?.freeHours, 36);
});