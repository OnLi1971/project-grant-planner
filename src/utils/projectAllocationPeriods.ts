import { getISOWeekMonday } from './workingDays';

export function allocationWeekPeriod(week: string) {
  const match = /^CW(\d+)-(\d{4})$/.exec(week);
  if (!match) return null;
  const monday = getISOWeekMonday(Number(match[1]), Number(match[2]));
  const thursday = new Date(monday);
  thursday.setDate(monday.getDate() + 3);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return {
    monday,
    friday,
    month: thursday.getMonth() + 1,
    year: thursday.getFullYear(),
  };
}

// Leave is context for a project's allocation period, not a separate allocation
// that should extend its detail into unrelated future years.
export function allocationsWithinProjectPeriod<T extends { week: string; hours: number; alternativeActivity?: string }>(allocations: T[]): T[] {
  const projectDates = allocations
    .filter(a => a.hours > 0 && !a.alternativeActivity)
    .flatMap(a => {
      const period = allocationWeekPeriod(a.week);
      return period ? [period.monday.getTime()] : [];
    });
  if (!projectDates.length) return [];
  const first = Math.min(...projectDates);
  const last = Math.max(...projectDates);
  return allocations.filter(a => {
    if (!a.alternativeActivity) return true;
    const period = allocationWeekPeriod(a.week);
    return period !== null && period.monday.getTime() >= first && period.monday.getTime() <= last;
  });
}