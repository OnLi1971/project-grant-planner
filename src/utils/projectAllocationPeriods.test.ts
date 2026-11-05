import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { allocationWeekPeriod, allocationsWithinProjectPeriod } from './projectAllocationPeriods';

test('2026 has ISO week 53 spanning December 28 to January 1', () => {
  const period = allocationWeekPeriod('CW53-2026');
  assert.ok(period);
  assert.deepEqual([period.monday.getFullYear(), period.monday.getMonth() + 1, period.monday.getDate()], [2026, 12, 28]);
  assert.deepEqual([period.friday.getFullYear(), period.friday.getMonth() + 1, period.friday.getDate()], [2027, 1, 1]);
  assert.equal(period.month, 12);
  assert.equal(period.year, 2026);
});

test('2027 starts with CW01 on January 4, after CW53-2026', () => {
  const period = allocationWeekPeriod('CW01-2027');
  assert.ok(period);
  assert.deepEqual([period.monday.getFullYear(), period.monday.getMonth() + 1, period.monday.getDate()], [2027, 1, 4]);
  assert.equal(period.month, 1);
  assert.equal(period.year, 2027);
});

test('primary month follows actual ISO Thursday, not a static week number mapping', () => {
  const period = allocationWeekPeriod('CW48-2026');
  assert.ok(period);
  assert.equal(period.month, 11);
  assert.equal(allocationWeekPeriod('CW01-2026')?.year, 2026);
});

test('leave context cannot create unrelated 2027 and 2028 project columns', () => {
  const allocations = [
    { week: 'CW45-2026', hours: 36 },
    { week: 'CW47-2026', hours: 0, alternativeActivity: 'DOVOLENÁ' },
    { week: 'CW53-2026', hours: 36 },
    { week: 'CW01-2027', hours: 0, alternativeActivity: 'DOVOLENÁ' },
    { week: 'CW52-2027', hours: 0, alternativeActivity: 'DOVOLENÁ' },
    { week: 'CW52-2028', hours: 0, alternativeActivity: 'DOVOLENÁ' },
  ];
  const visible = allocationsWithinProjectPeriod(allocations);
  assert.deepEqual(visible.map(a => a.week), ['CW45-2026', 'CW47-2026', 'CW53-2026']);
  assert.equal(visible.reduce((sum, a) => sum + a.hours, 0), 72);
});

test('project allocations across year boundary retain intervening leave', () => {
  const allocations = [
    { week: 'CW51-2026', hours: 18 },
    { week: 'CW53-2026', hours: 0, alternativeActivity: 'DOVOLENÁ' },
    { week: 'CW02-2027', hours: 20 },
  ];
  assert.deepEqual(allocationsWithinProjectPeriod(allocations), allocations);
});