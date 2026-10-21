import type { EngineerInfo, PlanningEntry } from '../types/planning';
import { projectCapacitySummary } from './projectCapacitySummary';

export const isPresalesProject = (code: string, statuses: Map<string, string>) =>
  (statuses.get(code) || '').toLowerCase().includes('pre');

/** Presentation breakdown of existing project hours, without changing capacity rules. */
export function projectHoursSummary(
  rows: Map<string, Map<string, number>>,
  demand: Map<string, Map<string, number>>,
  entries: PlanningEntry[],
  engineers: EngineerInfo[],
  weeks: string[],
  mode: 'weeks' | 'months',
  statuses: Map<string, string>,
) {
  const result = new Map<string, { deliveryHours: number; presalesHours: number; totalHours: number; deliveryEngineerCount: number }>();
  const deliveryEntries = entries.map(entry => ({
    ...entry,
    projekt: isPresalesProject(entry.projekt, statuses) ? 'FREE' : entry.projekt,
    projekt2: isPresalesProject(entry.projekt2 || '', statuses) ? null : entry.projekt2,
  }));
  const delivery = projectCapacitySummary(deliveryEntries, engineers, weeks, mode);
  delivery.forEach((s, period) => result.set(period, { deliveryHours: 0, presalesHours: 0, totalHours: 0, deliveryEngineerCount: s.engineerCount }));
  for (const source of [rows, demand]) {
    for (const [code, periods] of source) {
      for (const [period, hours] of periods) {
        const value = result.get(period) || { deliveryHours: 0, presalesHours: 0, totalHours: 0, deliveryEngineerCount: 0 };
        if (isPresalesProject(code, statuses)) value.presalesHours += hours;
        else value.deliveryHours += hours;
        value.totalHours += hours;
        result.set(period, value);
      }
    }
  }
  return result;
}