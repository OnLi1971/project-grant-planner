export interface Customer {
  id: string;
  name: string;
  code: string;
}

export interface ProjectManager {
  id: string;
  name: string;
  email: string;
}

export interface Program {
  id: string;
  name: string;
  code: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  customerId: string;
  projectManagerId: string;
  programId: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'inactive' | 'completed';
  hourlyRate?: number;
  projectType: 'WP' | 'Hodinovka';
}

// Výchozí zákazníci
export const customers: Customer[] = [
  { id: '1', name: 'ST', code: 'ST' },
  { id: '2', name: 'NUVIA', code: 'NUVIA' },
  { id: '3', name: 'WABTEC', code: 'WABTEC' },
  { id: '4', name: 'SAFRAN DE', code: 'SAFRAN_DE' },
  { id: '5', name: 'BUCHER', code: 'BUCHER' },
  { id: '6', name: 'SAFRAN', code: 'SAFRAN' },
  { id: '7', name: 'AIRBUS', code: 'AIRBUS' },
  { id: '8', name: 'N/A', code: 'NA' },
];

// Výchozí projektní manažeři
export const projectManagers: ProjectManager[] = [
  { id: '1', name: 'KaSo', email: 'kaso@company.com' },
  { id: '2', name: 'JoMa', email: 'joma@company.com' },
  { id: '3', name: 'PeNe', email: 'pene@company.com' },
  { id: '4', name: 'OnLi', email: 'onli@company.com' },
  { id: '5', name: 'PeMa', email: 'pema@company.com' },
  { id: '6', name: 'DaAm', email: 'daam@company.com' },
  { id: '7', name: 'PaHo', email: 'paho@company.com' },
  { id: '8', name: 'N/A', email: 'na@company.com' },
];

// Výchozí programy
export const programs: Program[] = [
  { id: '1', name: 'RAIL', code: 'RAIL' },
  { id: '2', name: 'MACH', code: 'MACH' },
  { id: '3', name: 'AERO', code: 'AERO' },
  { id: '4', name: 'N/A', code: 'NA' },
];

// Výchozí projekty podle vašeho seznamu
export const projects: Project[] = [
  { id: '1', name: 'ST EMU INT', code: 'ST_EMU_INT', customerId: '1', projectManagerId: '1', programId: '1', status: 'active', projectType: 'WP' },
  { id: '2', name: 'ST TRAM INT', code: 'ST_TRAM_INT', customerId: '1', projectManagerId: '2', programId: '1', status: 'active', projectType: 'WP' },
  { id: '3', name: 'ST MAINZ', code: 'ST_MAINZ', customerId: '1', projectManagerId: '2', programId: '1', status: 'active', projectType: 'WP' },
  { id: '4', name: 'ST KASSEL', code: 'ST_KASSEL', customerId: '1', projectManagerId: '2', programId: '1', status: 'active', projectType: 'WP' },
  { id: '5', name: 'ST BLAVA', code: 'ST_BLAVA', customerId: '1', projectManagerId: '2', programId: '1', status: 'active', projectType: 'WP' },
  { id: '6', name: 'ST FEM', code: 'ST_FEM', customerId: '1', projectManagerId: '3', programId: '1', status: 'active', projectType: 'WP' },
  { id: '7', name: 'ST POZAR', code: 'ST_POZAR', customerId: '1', projectManagerId: '4', programId: '1', status: 'active', projectType: 'WP' },
  { id: '8', name: 'NU CRAIN', code: 'NU_CRAIN', customerId: '2', projectManagerId: '5', programId: '2', status: 'active', projectType: 'WP' },
  { id: '9', name: 'WA HVAC', code: 'WA_HVAC', customerId: '3', projectManagerId: '6', programId: '1', status: 'active', projectType: 'WP' },
  { id: '10', name: 'FREE', code: 'FREE', customerId: '8', projectManagerId: '8', programId: '4', status: 'active', projectType: 'Hodinovka' },
  { id: '11', name: 'ST JIGS', code: 'ST_JIGS', customerId: '1', projectManagerId: '1', programId: '1', status: 'active', projectType: 'WP' },
  { id: '12', name: 'ST TRAM HS', code: 'ST_TRAM_HS', customerId: '1', projectManagerId: '1', programId: '1', status: 'active', projectType: 'WP' },
  { id: '13', name: 'SAF FEM', code: 'SAF_FEM', customerId: '4', projectManagerId: '3', programId: '3', status: 'active', projectType: 'WP' },
  { id: '14', name: 'DOVOLENÁ', code: 'DOVOLENÁ', customerId: '8', projectManagerId: '8', programId: '4', status: 'active', projectType: 'Hodinovka' },
  { id: '15', name: 'BUCH INT', code: 'BUCH_INT', customerId: '5', projectManagerId: '7', programId: '3', status: 'active', projectType: 'WP' },
  { id: '16', name: 'SAF INT', code: 'SAF_INT', customerId: '6', projectManagerId: '7', programId: '3', status: 'active', projectType: 'WP' },
  { id: '17', name: 'OVER', code: 'OVER', customerId: '8', projectManagerId: '8', programId: '4', status: 'active', projectType: 'Hodinovka' },
  { id: '18', name: 'AIRB INT', code: 'AIRB_INT', customerId: '7', projectManagerId: '7', programId: '3', status: 'active', projectType: 'WP' },
];