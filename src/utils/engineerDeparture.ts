import { getISOWeekMonday } from '@/utils/workingDays';

/**
 * Check if an engineer has departed (end_date passed) for a given CW key.
 * Returns true if the week's Monday is strictly after the engineer's end_date.
 */
export function isEngineerDepartedForWeek(endDate: string | null | undefined, cwKey: string): boolean {
  if (!endDate) return false;
  const match = cwKey.match(/CW(\d+)-(\d+)/);
  if (!match) return false;
  const cwNum = parseInt(match[1]);
  const year = parseInt(match[2]);
  const monday = getISOWeekMonday(cwNum, year);
  const endDateObj = new Date(endDate + 'T00:00:00');
  return monday > endDateObj;
}

/**
 * Check if an engineer has departed for a given month.
 * Returns true if the 1st of that month is strictly after end_date.
 */
export function isEngineerDepartedForMonth(endDate: string | null | undefined, year: number, month: number): boolean {
  if (!endDate) return false;
  const firstOfMonth = new Date(year, month - 1, 1);
  const endDateObj = new Date(endDate + 'T00:00:00');
  return firstOfMonth > endDateObj;
}
