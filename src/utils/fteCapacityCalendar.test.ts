import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { buildFteCapacityCalendar, calculateRangeFteCapacity, calculateProjectCapacity } from './fteCapacityCalendar';

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

test('range MH calculator matches annual calendar totals and scales by people count', () => {
  const r2027 = calculateRangeFteCapacity('2027-01-01', '2027-12-31', 1);
  assert.equal(r2027.ok, true);
  if (!r2027.ok) return;
  assert.equal(r2027.data.workingDays, 252);
  assert.equal(r2027.data.holidayDays, 9);
  assert.equal(r2027.data.perFte.productiveHours, 1768);
  assert.equal(r2027.data.total.productiveHours, 1768);

  const r2026For5 = calculateRangeFteCapacity('2026-01-01', '2026-12-31', 5);
  assert.equal(r2026For5.ok, true);
  if (!r2026For5.ok) return;
  assert.equal(r2026For5.data.perFte.productiveHours, 1752);
  assert.equal(r2026For5.data.total.productiveHours, 8760);
});

test('range MH calculator handles partial months additively and spans across years', () => {
  const part1 = calculateRangeFteCapacity('2027-03-01', '2027-03-15', 2);
  const part2 = calculateRangeFteCapacity('2027-03-16', '2027-03-31', 2);
  const fullMar = calculateRangeFteCapacity('2027-03-01', '2027-03-31', 2);
  assert.equal(part1.ok && part2.ok && fullMar.ok, true);
  if (!part1.ok || !part2.ok || !fullMar.ok) return;
  assert.equal(fullMar.data.perFte.productiveHours, 144);
  assert.equal(fullMar.data.total.productiveHours, 288);
  assert.ok(Math.abs(part1.data.total.productiveHours + part2.data.total.productiveHours - 288) < 1e-9);

  const crossYear = calculateRangeFteCapacity('2026-12-01', '2027-01-31', 1.5);
  assert.equal(crossYear.ok, true);
  if (!crossYear.ok) return;
  const dec2026 = buildFteCapacityCalendar(2026).months[11]?.productiveHours ?? 0;
  const jan2027 = buildFteCapacityCalendar(2027).months[0]?.productiveHours ?? 0;
  assert.equal(crossYear.data.perFte.productiveHours, dec2026 + jan2027);
  assert.equal(crossYear.data.total.productiveHours, (dec2026 + jan2027) * 1.5);
});

test('range MH calculator rejects invalid dates, reversed ranges and non-positive people', () => {
  assert.equal(calculateRangeFteCapacity('', '2027-01-31', 1).ok, false);
  assert.equal(calculateRangeFteCapacity('2027-05-10', '2027-05-01', 1).ok, false);
  assert.equal(calculateRangeFteCapacity('2027-01-01', '2027-01-31', 0).ok, false);
  assert.equal(calculateRangeFteCapacity('2027-01-01', '2027-01-31', -2).ok, false);
  assert.equal(calculateRangeFteCapacity('2027-01-01', '2027-01-31', Number.NaN).ok, false);
  assert.equal(calculateRangeFteCapacity('2024-12-31', '2026-01-10', 1).ok, false);
});

test('project calculation multiplies productive MH by hourly price for each month and total', () => {
  const result = calculateProjectCapacity('2027-01-01', '2027-02-28', 5, 1200);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.months[0]?.productiveHours, 720);
  assert.equal(result.data.months[0]?.price, 864000);
  assert.equal(result.data.months[1]?.productiveHours, 680);
  assert.equal(result.data.total.productiveHours, 1400);
  assert.equal(result.data.totalPrice, 1680000);
  assert.equal(result.data.months.reduce((sum, m) => sum + m.price, 0), result.data.totalPrice);
});

test('monthly project breakdown conserves partial-month and cross-year MH', () => {
  const result = calculateProjectCapacity('2026-12-16', '2027-01-15', 2.5, 900);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.data.months.map(m => m.month), ['2026-12', '2027-01']);
  assert.ok(Math.abs(result.data.months.reduce((sum, m) => sum + m.productiveHours, 0) - result.data.total.productiveHours) < 1e-9);
});

test('hourly rate accepts zero and rejects negative or invalid values', () => {
  const free = calculateProjectCapacity('2027-01-01', '2027-01-31', 1, 0);
  assert.equal(free.ok, true);
  if (free.ok) assert.equal(free.data.totalPrice, 0);
  assert.equal(calculateProjectCapacity('2027-01-01', '2027-01-31', 1, -1).ok, false);
  assert.equal(calculateProjectCapacity('2027-01-01', '2027-01-31', 1, Number.NaN).ok, false);
});