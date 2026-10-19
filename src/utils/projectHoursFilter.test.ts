import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { filterProjectHoursEntries } from './projectHoursFilter';
import type { PlanningEntry } from '../types/planning';
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