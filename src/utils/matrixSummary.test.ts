import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { computeMonthlyMatrixStats, computeWeeklyMatrixStats, type MatrixDataMap } from './matrixSummary';

describe('matrixSummary', () => {
  test('computes weekly summary stats matching holiday-aware 36h/week rules', () => {
    const weeks = ['CW46-2026', 'CW47-2026']; // CW47-2026 has 17.11. CZ holiday -> 4 working days = 28.8h
    const engineers = ['novak jan', 'svoboda petr'];
    const matrixData: MatrixDataMap = {
      'novak jan': {
        'CW46-2026': { projekt: 'ST_MAINZ', isTentative: false, hours: 36, leaveDays: 0 },
        'CW47-2026': { projekt: 'ST_MAINZ', isTentative: false, hours: 32, leaveDays: 0 },
      },
      'svoboda petr': {
        'CW46-2026': { projekt: 'FREE', isTentative: false, hours: 0, leaveDays: 1 },
        'CW47-2026': { projekt: 'DOVOLENÁ', isTentative: false, hours: 40, leaveDays: 0 },
      },
    };

    const stats = computeWeeklyMatrixStats(weeks, engineers, matrixData);

    assert.equal(stats['CW46-2026'].engineerCount, 2);
    assert.ok(Math.abs(stats['CW46-2026'].maxProductive - 64.8) < 1e-5);
    assert.equal(stats['CW46-2026'].realProductive, 36);
    assert.ok(Math.abs(stats['CW46-2026'].freeMh - 28.8) < 1e-5);
    assert.ok(Math.abs(stats['CW46-2026'].leaveFte - 0.2) < 1e-5);
    assert.equal(stats['CW46-2026'].utilization, 56);

    // Holiday week: utilization caps per engineer at 28.8h so it never exceeds 100%
    assert.ok(Math.abs(stats['CW47-2026'].maxProductive - 28.8) < 1e-5);
    assert.equal(stats['CW47-2026'].utilization, 100);
    assert.equal(stats['CW47-2026'].leaveFte, 1);
    assert.ok(Math.abs(stats['CW47-2026'].leaveMh - 28.8) < 1e-5);
  });

  test('computes monthly summary stats across overlapping weeks and respects departures', () => {
    const weeks = ['CW44-2026', 'CW45-2026', 'CW46-2026', 'CW47-2026', 'CW48-2026', 'CW49-2026'];
    const months = [{ name: 'listopad 2026', weeks: ['CW45-2026', 'CW46-2026', 'CW47-2026', 'CW48-2026'] }];
    const engineers = ['novak jan', 'chrenko peter'];
    const displayNameMap = { 'novak jan': 'Novák Jan', 'chrenko peter': 'Chrenko Peter' };
    const endDateMap = { 'novak jan': null, 'chrenko peter': null };
    const matrixData: MatrixDataMap = {
      'novak jan': Object.fromEntries(weeks.map((w) => [w, { projekt: 'ST_MAINZ', isTentative: false, hours: 36, leaveDays: 0 }])),
      'chrenko peter': Object.fromEntries(weeks.map((w) => [w, { projekt: 'FREE', isTentative: false, hours: 0, leaveDays: 0 }])),
    };

    const stats = computeMonthlyMatrixStats(months, weeks, engineers, matrixData, endDateMap, displayNameMap);
    const nov = stats['listopad 2026'];

    assert.equal(nov.engineerCount, 2);
    assert.ok(Math.abs(nov.maxProductive - 288) < 1e-5);
    assert.ok(Math.abs(nov.realProductive - 144) < 1e-5);
    assert.ok(Math.abs(nov.freeMh - 144) < 1e-5);
    assert.equal(nov.utilization, 50);
  });
});