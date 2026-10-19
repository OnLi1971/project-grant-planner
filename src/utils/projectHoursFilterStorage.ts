import type { ProjectHoursFilterValue } from '../components/ProjectHoursFilter';

const key = 'project-hours-filter-v1';
const defaults = (): ProjectHoursFilterValue => ({ mode: 'program', programs: ['All'], engineers: [] });
type FilterStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function readProjectHoursFilter(storage: FilterStorage): ProjectHoursFilterValue {
  try {
    const value = JSON.parse(storage.getItem(key) || 'null');
    if (!value || !['program', 'custom'].includes(value.mode) ||
      !Array.isArray(value.programs) || !value.programs.every((p: unknown) => typeof p === 'string') ||
      !Array.isArray(value.engineers) || !value.engineers.every((n: unknown) => typeof n === 'string')) return defaults();
    return { mode: value.mode, programs: value.programs, engineers: value.engineers, viewId: typeof value.viewId === 'string' ? value.viewId : null };
  } catch { return defaults(); }
}

export function writeProjectHoursFilter(storage: FilterStorage, value: ProjectHoursFilterValue) {
  try { storage.setItem(key, JSON.stringify(value)); } catch { /* Filtering remains usable when storage is unavailable. */ }
}