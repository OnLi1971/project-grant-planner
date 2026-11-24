import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { buildFteCapacityCalendar } from './fteCapacityCalendar';

test('2027 FTE capacity calendar matches Czech holidays and standard absence profile', () => {
  const cal = buildFteCapacityCalendar(2027);
  assert.equal(cal.theoreticalDays, 261);
  assert.equal(cal.theoreticalHours, 2088);
  assert.equal(cal.holidayHours, 72);
  assert.equal(cal.workingFundAfterHolidays, 2016);
  assert.equal(cal.vacationHours, 200);
  assert.equal(cal.totalSickAndSickDayHours, 48);
  assert.equal(cal.productiveHours, 1768);

  const jan = cal.months[0];
  const mar = cal.months[2];
  const apr = cal.months[3];
  const jul = cal.months[6];
  assert.equal(jan?.holidayHours, 8);
  assert.equal(jan?.productiveHours, 144);
  assert.equal(mar?.holidayHours, 16);
  assert.equal(mar?.workingFundAfterHolidays, 168);
  assert.equal(apr?.productiveHours, 176);
  assert.equal(Math.round(apr?.utilizationPct ?? 0), 100);
  assert.equal(jul?.holidayHours, 16);
  assert.equal(jul?.productiveHours, 120);

  assert.equal(Math.round((cal.quarters[0]?.avgProductiveHours ?? 0) * 10) / 10, 141.3);
  assert.equal(Math.round((cal.quarters[1]?.avgProductiveHours ?? 0) * 10) / 10, 165.3);
  assert.equal(cal.quarters[2]?.avgProductiveHours, 136);
});

test('2026 FTE capacity calendar applies 2026 Czech holidays with identical absence model', () => {
  const cal = buildFteCapacityCalendar(2026);
  assert.equal(cal.theoreticalDays, 261);
  assert.equal(cal.theoreticalHours, 2088);
  assert.equal(cal.holidayHours, 88);
  assert.equal(cal.workingFundAfterHolidays, 2000);
  assert.equal(cal.vacationHours, 200);
  assert.equal(cal.totalSickAndSickDayHours, 48);
  assert.equal(cal.productiveHours, 1752);
  assert.equal(cal.avgPerMonth, 146);
  assert.equal(Math.round(cal.totalUtilizationPct * 100) / 100, 87.6);

  // Easter 2026 is in April (2 holidays), May has May 1 and May 8 on Fridays (2 holidays).
  assert.equal(cal.months[3]?.holidayHours, 16);
  assert.equal(cal.months[4]?.holidayHours, 16);
  assert.equal(cal.months[11]?.holidayHours, 16);
});