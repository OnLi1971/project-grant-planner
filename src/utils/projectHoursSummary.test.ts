import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { projectHoursSummary } from './projectHoursSummary';
import { projectHours } from './projectHours';
import type { PlanningEntry } from '../types/planning';

const week = 'CW45-2026';
const statuses = new Map([['ST_DEL', 'Realizace'], ['ST_PRE', 'Presales']]);
const entries: PlanningEntry[] = [
  { engineer_id: null, konstrukter: 'A', cw: week, mesic: '', projekt: 'ST_DEL', mhTyden: 20, projekt2: 'ST_PRE', mhTyden2: 16 },
  { engineer_id: null, konstrukter: 'B', cw: week, mesic: '', projekt: 'ST_PRE', mhTyden: 36 },
  { engineer_id: null, konstrukter: 'C', cw: week, mesic: '', projekt: 'FREE', mhTyden: 40 },
];
test('delivery and presales totals include generic plans and add up to all project hours', () => {
  const plans = new Map([['ST_DEL', new Map([[week, 10]])], ['ST_PRE', new Map([[week, 8]])]]);
  const summary = projectHoursSummary(projectHours(entries, [week], 'weeks'), plans, entries, [], [week], 'weeks', statuses).get(week);
  assert.equal(summary?.deliveryHours, 30);
  assert.equal(summary?.presalesHours, 60);
  assert.equal(summary?.totalHours, 90);
});
test('delivery count counts unique named delivery engineers, including second allocation, not presales or generic plans', () => {
  const split = { ...entries[0], konstrukter: 'D', projekt: 'ST_PRE', mhTyden: 16, projekt2: 'ST_DEL', mhTyden2: 20 };
  const input = [...entries, split, { ...split, isSecondary: true }];
  const summary = projectHoursSummary(projectHours(input, [week], 'weeks'), new Map(), input, [], [week], 'weeks', statuses).get(week);
  assert.equal(summary?.deliveryEngineerCount, 2);
});