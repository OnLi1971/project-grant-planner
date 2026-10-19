import type { PlanningEntry } from '../types/planning';
import { normalizeName } from './nameNormalization';

export function filterProjectHoursEntries(entries: PlanningEntry[], weeks: string[], filter: { mode: 'program' | 'custom'; programs: string[]; engineers: string[] }, programByProject: Map<string, string>) {
  if (filter.mode === 'custom') {
    const names = new Set(filter.engineers.map(normalizeName));
    return entries.filter(entry => names.has(normalizeName(entry.konstrukter)));
  }
  if (filter.programs.includes('All')) return entries;
  const period = new Set(weeks);
  const names = new Set<string>();
  for (const entry of entries) {
    if (!period.has(entry.cw.replace('_', '-'))) continue;
    if ([entry.projekt, entry.projekt2 || ''].some(code => filter.programs.includes(programByProject.get(code) || 'NA'))) names.add(normalizeName(entry.konstrukter));
  }
  return entries.filter(entry => names.has(normalizeName(entry.konstrukter)));
}