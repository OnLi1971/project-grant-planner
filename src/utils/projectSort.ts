export interface ProjectSortInput {
  customerName?: string | null;
  projectName?: string | null;
  code?: string | null;
}

const locale = 'cs';
const options: Intl.CollatorOptions = { sensitivity: 'base', numeric: true };

// Režimové aktivity patří vždy úplně na konec, v tomto pořadí.
const TAIL_CODES = ['FREE', 'NEMOC', 'OVER', 'DOVOLENÁ'];

const tailIndex = (code?: string | null): number =>
  TAIL_CODES.indexOf(String(code ?? '').trim().toUpperCase());

export function compareProjectsForManagement(a: ProjectSortInput, b: ProjectSortInput): number {
  const tailA = tailIndex(a.code);
  const tailB = tailIndex(b.code);

  if (tailA !== -1 || tailB !== -1) {
    if (tailA !== -1 && tailB !== -1) return tailA - tailB;
    return tailA === -1 ? -1 : 1;
  }

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
