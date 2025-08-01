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
}

// Výchozí zákazníci
export const customers: Customer[] = [
  { id: '1', name: 'Siemens Transportation', code: 'ST' },
  { id: '2', name: 'Škoda Transportation', code: 'SKODA' },
  { id: '3', name: 'Alstom', code: 'ALSTOM' },
  { id: '4', name: 'Stadler Rail', code: 'STADLER' },
  { id: '5', name: 'CAF', code: 'CAF' },
];

// Výchozí projektní manažeři
export const projectManagers: ProjectManager[] = [
  { id: '1', name: 'Jan Novák', email: 'jan.novak@company.com' },
  { id: '2', name: 'Petr Svoboda', email: 'petr.svoboda@company.com' },
  { id: '3', name: 'Marie Dvořáková', email: 'marie.dvorakova@company.com' },
  { id: '4', name: 'Pavel Černý', email: 'pavel.cerny@company.com' },
];

// Výchozí programy
export const programs: Program[] = [
  { id: '1', name: 'EMU Interiéry', code: 'EMU_INT' },
  { id: '2', name: 'Tramvaje Interiéry', code: 'TRAM_INT' },
  { id: '3', name: 'Tramvaje High Speed', code: 'TRAM_HS' },
  { id: '4', name: 'Mainz Project', code: 'MAINZ' },
  { id: '5', name: 'Kassel Project', code: 'KASSEL' },
  { id: '6', name: 'Blava Project', code: 'BLAVA' },
  { id: '7', name: 'FEM Analýzy', code: 'FEM' },
  { id: '8', name: 'Požární Analýzy', code: 'POZAR' },
  { id: '9', name: 'HVAC Systémy', code: 'HVAC' },
  { id: '10', name: 'Přípravky', code: 'JIGS' },
];

// Výchozí projekty odvozené z existujících dat
export const projects: Project[] = [
  { id: '1', name: 'ST EMU Interiéry', code: 'ST_EMU_INT', customerId: '1', projectManagerId: '1', programId: '1', status: 'active' },
  { id: '2', name: 'ST Tramvaje Interiéry', code: 'ST_TRAM_INT', customerId: '1', projectManagerId: '2', programId: '2', status: 'active' },
  { id: '3', name: 'ST Mainz', code: 'ST_MAINZ', customerId: '1', projectManagerId: '1', programId: '4', status: 'active' },
  { id: '4', name: 'ST Kassel', code: 'ST_KASSEL', customerId: '1', projectManagerId: '3', programId: '5', status: 'active' },
  { id: '5', name: 'ST Blava', code: 'ST_BLAVA', customerId: '1', projectManagerId: '2', programId: '6', status: 'active' },
  { id: '6', name: 'ST FEM', code: 'ST_FEM', customerId: '1', projectManagerId: '4', programId: '7', status: 'active' },
  { id: '7', name: 'ST Požární analýzy', code: 'ST_POZAR', customerId: '1', projectManagerId: '3', programId: '8', status: 'active' },
  { id: '8', name: 'NU Crain', code: 'NU_CRAIN', customerId: '2', projectManagerId: '1', programId: '1', status: 'active' },
  { id: '9', name: 'WA HVAC', code: 'WA_HVAC', customerId: '3', projectManagerId: '4', programId: '9', status: 'active' },
  { id: '10', name: 'ST Přípravky', code: 'ST_JIGS', customerId: '1', projectManagerId: '2', programId: '10', status: 'active' },
  { id: '11', name: 'ST Tramvaje HS', code: 'ST_TRAM_HS', customerId: '1', projectManagerId: '3', programId: '3', status: 'active' },
  { id: '12', name: 'SAF FEM', code: 'SAF_FEM', customerId: '4', projectManagerId: '1', programId: '7', status: 'active' },
];