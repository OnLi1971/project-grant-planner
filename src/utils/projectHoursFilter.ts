import type { PlanningEntry } from '../types/planning';
import { normalizeName } from './nameNormalization';
import { isHoursProject } from './projectHours';

export function filterProjectHoursEntries(entries: PlanningEntry[], weeks: string[], filter: { mode: 'program' | 'custom'; programs: string[]; engineers: string[] }, programByProject: Map<string, string>) {
  if (filter.mode === 'custom') {
    const names = new Set(filter.engineers.map(normalizeName));
    return entries.filter(entry => names.has(normalizeName(entry.konstrukter)));
  }
  if (filter.programs.includes('All')) return entries;
  const matches = (code: string) => !!code && filter.programs.includes(programByProject.get(code) || 'NA');
  const period = new Set(weeks);
  const names = new Set<string>();
  for (const entry of entries) {
    if (!period.has(entry.cw.replace('_', '-'))) continue;
    if ([entry.projekt, entry.projekt2 || ''].some(matches)) names.add(normalizeName(entry.konstrukter));
  }
  return entries.filter(entry => names.has(normalizeName(entry.konstrukter))).map(entry => {
    const excludePrimary = isHoursProject(entry.projekt) && !matches(entry.projekt);
    const excludeSecondary = isHoursProject(entry.projekt2 || '') && !matches(entry.projekt2 || '');
    if (!excludePrimary && !excludeSecondary) return entry;
    return {
      ...entry,
      ...(excludePrimary ? { projekt: '', mhTyden: 0 } : {}),
      ...(excludeSecondary ? { projekt2: null, mhTyden2: 0 } : {}),
    };
  });
}