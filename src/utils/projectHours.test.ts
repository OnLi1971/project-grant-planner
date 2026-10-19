import { describe, test } from 'node:test';
import { strict as assert } from 'node:assert';
import { projectHours } from './projectHours';
import type { PlanningEntry } from '../types/planning';

const entry: PlanningEntry = { engineer_id: null, konstrukter: 'Engineer', cw: 'CW40-2026', mesic: '', projekt: 'ST_JIGS', mhTyden: 20, projekt2: 'ST_EMU_INT', mhTyden2: 20 };
describe('project planning hours', () => {
  test('counts both 20 MH allocations exactly once', () => {
    const synthetic = { ...entry, isSecondary: true, projekt: 'ST_EMU_INT', mhTyden: 20, projekt2: null };
    const rows = projectHours([entry, synthetic], ['CW40-2026'], 'weeks');
    assert.equal(rows.get('ST_JIGS')?.get('CW40-2026'), 20);
    assert.equal(rows.get('ST_EMU_INT')?.get('CW40-2026'), 20);
  });
  test('splits cross-month week while conserving planned hours', () => {
    const rows = projectHours([entry], ['CW40-2026'], 'months');
    assert.equal(rows.get('ST_JIGS')?.get('2026-09'), 10);
    assert.equal(rows.get('ST_JIGS')?.get('2026-10'), 10);
  });
  test('excludes non-project activities', () => {
    const rows = projectHours([{ ...entry, projekt: 'DOVOLENÁ', mhTyden: 40, projekt2: null }], ['CW40-2026'], 'weeks');
    assert.equal(rows.size, 0);
  });
  test('excludes hours outside the selected period', () => {
    assert.equal(projectHours([entry], ['CW41-2026'], 'weeks').size, 0);
  });
  test('CW53 2026 assigns no planned hours to the January 1 2027 holiday', () => {
    const rows = projectHours([{ ...entry, cw: 'CW53-2026' }], ['CW53-2026'], 'months');
    assert.equal(rows.get('ST_JIGS')?.get('2026-12'), 20);
    assert.equal(rows.get('ST_JIGS')?.get('2027-01'), 0);
  });
  test('a holiday on May 31 2027 leaves the whole CW22 allocation in June', () => {
    // April 30–May 4 2026: May 1 is a holiday, so April gets half the week.
    const rows = projectHours([{ ...entry, cw: 'CW18-2026' }], ['CW18-2026'], 'months');
    assert.equal(rows.get('ST_JIGS')?.get('2026-04'), 20);
    assert.equal(rows.get('ST_JIGS')?.get('2026-05'), 0);
  });
});