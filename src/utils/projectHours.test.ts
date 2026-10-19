import { describe, expect, test } from 'bun:test';
import { projectHours } from './projectHours';
import type { PlanningEntry } from '../types/planning';

const entry: PlanningEntry = { engineer_id: null, konstrukter: 'Engineer', cw: 'CW40-2026', mesic: '', projekt: 'ST_JIGS', mhTyden: 20, projekt2: 'ST_EMU_INT', mhTyden2: 20 };
describe('project planning hours', () => {
  test('counts both 20 MH allocations exactly once', () => {
    const synthetic = { ...entry, isSecondary: true, projekt: 'ST_EMU_INT', mhTyden: 20, projekt2: null };
    const rows = projectHours([entry, synthetic], ['CW40-2026'], 'weeks');
    expect(rows.get('ST_JIGS')?.get('CW40-2026')).toBe(20);
    expect(rows.get('ST_EMU_INT')?.get('CW40-2026')).toBe(20);
  });
  test('splits cross-month week while conserving planned hours', () => {
    const rows = projectHours([entry], ['CW40-2026'], 'months');
    expect(rows.get('ST_JIGS')?.get('2026-09')).toBeCloseTo(12);
    expect(rows.get('ST_JIGS')?.get('2026-10')).toBeCloseTo(8);
  });
  test('excludes non-project activities', () => {
    const rows = projectHours([{ ...entry, projekt: 'DOVOLENÁ', mhTyden: 40, projekt2: null }], ['CW40-2026'], 'weeks');
    expect(rows.size).toBe(0);
  });
  test('excludes hours outside the selected period', () => {
    expect(projectHours([entry], ['CW41-2026'], 'weeks').size).toBe(0);
  });
});