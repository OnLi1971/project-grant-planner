import type { PlanningEntry } from '../types/planning';
import { projectWeekDays } from './projectHoursPeriods';

const excluded = new Set(['', 'FREE', 'OVER', 'DEPARTED', 'DOVOLENA', 'NEMOC', 'VACATION', 'SICK LEAVE']);
export const isHoursProject = (code: string) => !excluded.has(code.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase());
export const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export function projectHours(entries: PlanningEntry[], weeks: string[], mode: 'weeks' | 'months') {
  const allowed = new Set(weeks);
  const result = new Map<string, Map<string, number>>();
  for (const entry of entries) {
    if (entry.isSecondary) continue;
    const match = entry.cw.match(/^CW(\d+)[-_](\d{4})$/);
    if (!match) continue;
    const key = `CW${match[1].padStart(2, '0')}-${match[2]}`;
    if (!allowed.has(key)) continue;
    const targets = new Map<string, number>();
    if (mode === 'weeks') targets.set(key, 1);
    else {
      const days = projectWeekDays(key, entry.konstrukter);
      const workingDays = days.filter(day => day.working).length;
      for (const { date, working } of days) {
        const month = monthKey(date);
        targets.set(month, (targets.get(month) || 0) + (working && workingDays ? 1 / workingDays : 0));
      }
    }
    const allocations: [string, number][] = [[entry.projekt, entry.mhTyden || 0], [entry.projekt2 || '', entry.mhTyden2 || 0]];
    for (const [code, hours] of allocations) {
      if (!isHoursProject(code) || hours <= 0) continue;
      const row = result.get(code) || new Map<string, number>();
      for (const [period, fraction] of targets) row.set(period, (row.get(period) || 0) + hours * fraction);
      result.set(code, row);
    }
  }
  return result;
}