export interface ProjectSortInput {
  customerName?: string | null;
  projectName?: string | null;
  code?: string | null;
}

const locale = 'cs';
const options: Intl.CollatorOptions = { sensitivity: 'base', numeric: true };

/**
 * Řadí projekty primárně podle zákazníka (A–Z), potom podle názvu projektu.
 * Projekty bez zákazníka (FREE, DOVOLENÁ, ...) jsou až za ostatními.
 */
export function compareProjectsForManagement(a: ProjectSortInput, b: ProjectSortInput): number {
  const customerA = String(a.customerName ?? '').trim();
  const customerB = String(b.customerName ?? '').trim();

  if (!customerA && customerB) return 1;
  if (customerA && !customerB) return -1;

  const byCustomer = customerA.localeCompare(customerB, locale, options);
  if (byCustomer !== 0) return byCustomer;

  const nameA = String(a.projectName ?? '').trim() || String(a.code ?? '').trim();
  const nameB = String(b.projectName ?? '').trim() || String(b.code ?? '').trim();
  return nameA.localeCompare(nameB, locale, options);
}
