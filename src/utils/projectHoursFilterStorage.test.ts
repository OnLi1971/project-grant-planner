import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readProjectHoursFilter, writeProjectHoursFilter } from './projectHoursFilterStorage';

const storage = () => {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
};
test('F5 preserves the custom engineer selection and saved view identity', () => {
  const store = storage();
  const selection = { mode: 'custom' as const, programs: ['RAIL'], engineers: ['Stránský Radek'], viewId: 'rail-el' };
  writeProjectHoursFilter(store, selection);
  assert.deepEqual(readProjectHoursFilter(store), selection);
});
test('F5 preserves selected programs and an intentionally empty engineer selection', () => {
  const store = storage();
  const selection = { mode: 'program' as const, programs: ['RAIL', 'EL'], engineers: [], viewId: null };
  writeProjectHoursFilter(store, selection);
  assert.deepEqual(readProjectHoursFilter(store), selection);
  writeProjectHoursFilter(store, { ...selection, mode: 'custom' });
  assert.deepEqual(readProjectHoursFilter(store).engineers, []);
  assert.equal(readProjectHoursFilter(store).mode, 'custom');
});
test('corrupted or inaccessible storage falls back safely', () => {
  assert.deepEqual(readProjectHoursFilter({ getItem: () => '{', setItem: () => {} }), { mode: 'program', programs: ['All'], engineers: [] });
  assert.doesNotThrow(() => writeProjectHoursFilter({ getItem: () => null, setItem: () => { throw new Error('blocked'); } }, { mode: 'custom', programs: [], engineers: [] }));
});