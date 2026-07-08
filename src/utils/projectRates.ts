// Utility pro časově platné hodinové sazby projektu

export interface RateHistoryEntry {
  id?: string;
  project_id: string;
  valid_from: string; // ISO date (YYYY-MM-DD)
  hourly_rate?: number | null;
  average_hourly_rate?: number | null;
}

interface ProjectLike {
  id: string;
  project_type: string;
  hourly_rate?: number | null;
  average_hourly_rate?: number | null;
}

// Convert monthKey like "červenec_2026" to first-of-month Date
const CZ_MONTHS: Record<string, number> = {
  leden: 0, únor: 1, unor: 1, březen: 2, brezen: 2, duben: 3, květen: 4, kveten: 4,
  červen: 5, cerven: 5, červenec: 6, cervenec: 6, srpen: 7, září: 8, zari: 8,
  říjen: 9, rijen: 9, listopad: 10, prosinec: 11,
};

export function monthKeyToDate(monthKey: string): Date | null {
  const [m, y] = monthKey.split('_');
  if (!m || !y) return null;
  const month = CZ_MONTHS[m.toLowerCase()];
  if (month === undefined) return null;
  return new Date(parseInt(y), month, 1);
}

/**
 * Vrátí efektivní hodinovou sazbu projektu pro daný měsíc.
 * Vybere se záznam s nejnovějším valid_from ≤ 1. den měsíce.
 * Když žádný neexistuje, použije se základní sazba z projektu.
 */
export function getEffectiveRate(
  project: ProjectLike,
  history: RateHistoryEntry[],
  monthKey: string
): number {
  const monthDate = monthKeyToDate(monthKey);
  const baseRate =
    project.project_type === 'WP'
      ? project.average_hourly_rate ?? 0
      : project.hourly_rate ?? 0;

  if (!monthDate) return baseRate;

  const relevant = history
    .filter((h) => h.project_id === project.id)
    .filter((h) => new Date(h.valid_from) <= monthDate)
    .sort((a, b) => (a.valid_from < b.valid_from ? 1 : -1));

  const latest = relevant[0];
  if (!latest) return baseRate;

  const rate =
    project.project_type === 'WP'
      ? latest.average_hourly_rate ?? latest.hourly_rate
      : latest.hourly_rate ?? latest.average_hourly_rate;

  return rate ?? baseRate;
}
