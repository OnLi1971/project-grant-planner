import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { filterProjectHoursEntries } from './projectHoursFilter';
import type { PlanningEntry } from '../types/planning';
import { projectHours } from './projectHours';
import { projectCapacitySummary } from './projectCapacitySummary';
const entries: PlanningEntry[] = [
  { engineer_id: null, konstrukter: 'Věčer Jiří', cw: 'CW44-2026', mesic: '', projekt: 'FREE', projekt2: 'ST_JIGS', mhTyden2: 20 },
  { engineer_id: null, konstrukter: 'Other', cw: 'CW44-2026', mesic: '', projekt: 'NU_CRAIN', mhTyden: 36 },
];
test('custom selection matches normalized saved names', () => {
  assert.deepEqual(filterProjectHoursEntries(entries, ['CW44-2026'], { mode: 'custom', programs: [], engineers: ['vecer jiri'] }, new Map()), [entries[0]]);
});
test('empty custom selection excludes all hours and capacity', () => {
  assert.equal(filterProjectHoursEntries(entries, ['CW44-2026'], { mode: 'custom', programs: [], engineers: [] }, new Map()).length, 0);
});
test('program selection includes secondary projects within displayed weeks', () => {
  const map = new Map([['ST_JIGS', 'RAIL'], ['NU_CRAIN', 'MACH']]);
  assert.deepEqual(filterProjectHoursEntries(entries, ['CW44-2026'], { mode: 'program', programs: ['RAIL'], engineers: [] }, map), [entries[0]]);
  assert.equal(filterProjectHoursEntries(entries, ['CW45-2026'], { mode: 'program', programs: ['RAIL'], engineers: [] }, map).length, 0);
});
test('missing secondary project does not falsely qualify for NA program', () => {
  const row = { ...entries[1], projekt2: null };
  assert.equal(filterProjectHoursEntries([row], ['CW44-2026'], { mode: 'program', programs: ['NA'], engineers: [] }, new Map([['NU_CRAIN', 'MACH']])).length, 0);
});
test('RAIL/MACH includes live Doosan allocation and excludes Safran even for a shared engineer', () => {
  const weeks = ['CW43-2026'];
  const rows: PlanningEntry[] = [
    { engineer_id: null, konstrukter: 'Shared', cw: weeks[0], mesic: '', projekt: 'SAF_FEM', mhTyden: 20, projekt2: 'DS_Doosan', mhTyden2: 16 },
    { engineer_id: null, konstrukter: 'Rail', cw: weeks[0], mesic: '', projekt: 'ST_JIGS', mhTyden: 36 },
  ];
  const filtered = filterProjectHoursEntries(rows, weeks, { mode: 'program', programs: ['RAIL', 'MACH'], engineers: [] }, new Map([['SAF_FEM', 'AERO'], ['DS_Doosan', 'MACH'], ['ST_JIGS', 'RAIL']]));
  for (const mode of ['weeks', 'months'] as const) {
    const period = mode === 'weeks' ? weeks[0] : '2026-10';
    const hours = projectHours(filtered, weeks, mode);
    assert.equal(hours.has('SAF_FEM'), false);
    assert.equal(hours.get('DS_Doosan')?.get(period), 16);
    assert.equal(hours.get('ST_JIGS')?.get(period), 36);
    assert.equal(projectCapacitySummary(filtered, [], weeks, mode).get(period)?.realHours, 52);
  }
  assert.equal(rows[0].mhTyden, 20);
});
test('custom and All retain the selected engineers complete split allocations', () => {
  const row = { ...entries[1], projekt2: 'SAF_FEM', mhTyden2: 10 };
  assert.deepEqual(filterProjectHoursEntries([row], ['CW44-2026'], { mode: 'custom', programs: ['MACH'], engineers: ['Other'] }, new Map()), [row]);
  assert.deepEqual(filterProjectHoursEntries([row], ['CW44-2026'], { mode: 'program', programs: ['All'], engineers: [] }, new Map()), [row]);
});