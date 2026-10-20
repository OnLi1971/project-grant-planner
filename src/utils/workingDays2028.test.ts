import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { getWorkingDaysInMonth, isHoliday } from './workingDays';

test('2028 Easter reduces April to 18 working days', () => {
  assert.equal(isHoliday(new Date(2028, 3, 14)), true);
  assert.equal(isHoliday(new Date(2028, 3, 17)), true);
  assert.equal(getWorkingDaysInMonth(2028, 4), 18);
  assert.equal(getWorkingDaysInMonth(2028, 4, true), 18);
});

test('2028 Slovak January 6 reduces only the Slovak calendar', () => {
  assert.equal(getWorkingDaysInMonth(2028, 1), 21);
  assert.equal(getWorkingDaysInMonth(2028, 1, true), 20);
});

test('2028 Christmas excludes December 25 and 26', () => {
  assert.equal(getWorkingDaysInMonth(2028, 12), 19);
  assert.equal(getWorkingDaysInMonth(2028, 12, true), 19);
});