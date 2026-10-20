import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { planningEndYear } from './planningHorizon';

test('planning and project-hours horizon includes the whole of 2028', () => {
  assert.equal(planningEndYear(new Date(2026, 9, 20)), 2028);
  assert.equal(planningEndYear(new Date(2027, 0, 1)), 2028);
});