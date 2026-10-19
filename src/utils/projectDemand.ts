import { projectWeekDays } from './projectHoursPeriods';
import { monthKey } from './projectHours';

export interface MonthlyDemand {
  projectCode: string;
  month: string; // YYYY-MM
  hours: number;
}

/**
 * Distributes monthly project demand into matrix periods.
 * Weeks overlapping a month boundary get a share proportional to working days.
 */
export function projectDemand(demand: MonthlyDemand[], weeks: string[], mode: 'weeks' | 'months') {
  const result = new Map<string, Map<string, number>>();
  if (mode === 'months') {
    for (const { projectCode, month, hours } of demand) {
      if (hours <= 0) continue;
      const row = result.get(projectCode) || new Map<string, number>();
      row.set(month, (row.get(month) || 0) + hours);
      result.set(projectCode, row);
    }
    return result;
  }
  // Weeks mode: split each month across the selected weeks by working days.
  const monthTotalDays = new Map<string, number>();
  const weekMonthDays = new Map<string, Map<string, number>>();
  for (const week of weeks) {
    const days = new Map<string, number>();
    for (const { date, working } of projectWeekDays(week, '')) {
      if (!working) continue;
      const key = monthKey(date);
      days.set(key, (days.get(key) || 0) + 1);
      monthTotalDays.set(key, (monthTotalDays.get(key) || 0) + 1);
    }
    weekMonthDays.set(week, days);
  }
  for (const { projectCode, month, hours } of demand) {
    const total = monthTotalDays.get(month) || 0;
    if (hours <= 0 || total === 0) continue;
    const row = result.get(projectCode) || new Map<string, number>();
    for (const [week, days] of weekMonthDays) {
      const share = days.get(month) || 0;
      if (share > 0) row.set(week, (row.get(week) || 0) + hours * share / total);
    }
    result.set(projectCode, row);
  }
  return result;
}
