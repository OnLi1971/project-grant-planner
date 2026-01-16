import React, { useState, useMemo, useEffect } from 'react';
import { usePlanning } from '@/contexts/PlanningContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { TrendingUp, Filter } from 'lucide-react';
import { getProjectColorWithIndex } from '@/utils/colorSystem';

interface DatabaseProject {
  id: string;
  name: string;
  code: string;
  customer_id: string;
  project_manager_id: string;
  program_id: string;
  project_type: string;
  budget?: number;
  average_hourly_rate?: number;
  project_status?: string;
  probability?: number;
  presales_phase?: string;
  presales_start_date?: string;
  presales_end_date?: string;
}

interface DatabaseCustomer {
  id: string;
  name: string;
  code: string;
}

interface DatabaseProgram {
  id: string;
  name: string;
  code: string;
}

interface RevenueOverviewProps {
  defaultCurrency?: 'CZK' | 'USD';
  defaultStatusFilter?: 'all' | 'realizace' | 'presales' | 'P0' | 'P1' | 'P2' | 'P3';
  defaultViewType?: 'mesic' | 'kvartal';
  defaultProgramCodes?: string[];
}

export const RevenueOverview = ({ 
  defaultCurrency = 'CZK',
  defaultStatusFilter = 'realizace',
  defaultViewType = 'kvartal',
  defaultProgramCodes = ['MACH', 'RAIL']
}: RevenueOverviewProps) => {
  const { planningData } = usePlanning();
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'program' | 'project'>('program');
  const [filterValue, setFilterValue] = useState<string>('all');
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [viewType, setViewType] = useState<'mesic' | 'kvartal'>(defaultViewType);
  const [selectedQuarters, setSelectedQuarters] = useState<string[]>(['Q4-2025', 'Q1-2026', 'Q2-2026', 'Q3-2026', 'Q4-2026']);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([
    'říjen_2025', 'listopad_2025', 'prosinec_2025',
    'leden_2026', 'únor_2026', 'březen_2026', 'duben_2026', 'květen_2026', 'červen_2026',
    'červenec_2026', 'srpen_2026', 'září_2026', 'říjen_2026', 'listopad_2026', 'prosinec_2026'
  ]);
  const [currency, setCurrency] = useState<'CZK' | 'USD'>(defaultCurrency);
  const [projectStatusFilter, setProjectStatusFilter] = useState<'all' | 'realizace' | 'presales' | 'P0' | 'P1' | 'P2' | 'P3'>(defaultStatusFilter);
  const [projects, setProjects] = useState<DatabaseProject[]>([]);
  const [customers, setCustomers] = useState<DatabaseCustomer[]>([]);
  const [programs, setPrograms] = useState<DatabaseProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultProgramsApplied, setDefaultProgramsApplied] = useState(false);

  // Exchange rate CZK to USD (approximately 23 CZK = 1 USD)
  const exchangeRate = 23;

  // Function to format currency values
  const formatCurrency = (value: number): string => {
    if (currency === 'USD') {
      const usdValue = value / exchangeRate;
      return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return `${value.toLocaleString('cs-CZ')} Kč`;
  };

  // Short currency formatter for bar labels
  const formatShort = (value: number): string => {
    if (currency === 'USD') {
      const usdValue = value / exchangeRate;
      if (usdValue >= 1_000_000) return `$${(usdValue / 1_000_000).toFixed(1)}M`;
      if (usdValue >= 1_000) return `$${Math.round(usdValue / 1_000)}k`;
      return `$${Math.round(usdValue)}`;
    }
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
    return `${Math.round(value)}`;
  };

  // Custom renderer to place total label centered just above the bar
  const renderTotalLabel = (props: any) => {
    const { x = 0, y = 0, width = 0, value } = props;
    if (!value || value <= 0) return null;
    const cx = x + width / 2;
    const cy = y - 6;
    return (
      <text x={cx} y={cy} textAnchor="middle" fontSize={11} fontWeight="bold" fill="hsl(var(--foreground))">
        {formatShort(value as number)}
      </text>
    );
  };

  // Načtení dat z databáze
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projectsRes, customersRes, programsRes] = await Promise.all([
        supabase.from('projects').select('*').order('name'),
        supabase.from('customers').select('*').order('name'),
        supabase.from('programs').select('*').order('name')
      ]);

      if (projectsRes.data) setProjects(projectsRes.data);
      if (customersRes.data) setCustomers(customersRes.data);
      if (programsRes.data) setPrograms(programsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply default program codes after programs are loaded
  useEffect(() => {
    if (programs.length > 0 && defaultProgramCodes.length > 0 && !defaultProgramsApplied) {
      const programIds = programs
        .filter(p => defaultProgramCodes.includes(p.code))
        .map(p => p.id);
      if (programIds.length > 0) {
        setSelectedPrograms(programIds);
        setDefaultProgramsApplied(true);
      }
    }
  }, [programs, defaultProgramCodes, defaultProgramsApplied]);

  const getDaysInMonth = (month: string, year: number = 2025): number => {
    const monthMapping: { [key: string]: number } = {
      'srpen': 8, 'září': 9, 'říjen': 10, 'listopad': 11, 'prosinec': 12,
      'leden': 1, 'únor': 2, 'březen': 3, 'duben': 4, 'květen': 5, 'červen': 6
    };
    
    const monthNum = monthMapping[month];
    // Pro 2026 měsíce použij rok 2026
    const actualYear = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen'].includes(month) ? 2026 : year;
    return new Date(actualYear, monthNum, 0).getDate();
  };

  // Seznam státních svátků v ČR pro roky 2025-2026
  const publicHolidays = {
    '2025-09-28': 'Den české státnosti',
    '2025-10-28': 'Den vzniku samostatného československého státu', 
    '2025-11-17': 'Den boje za svobodu a demokracii',
    '2025-12-24': 'Štědrý den',
    '2025-12-25': '1. svátek vánoční',
    '2025-12-26': '2. svátek vánoční',
    '2026-01-01': 'Nový rok',
    '2026-04-21': 'Velikonoční pondělí',
    '2026-05-01': 'Svátek práce',
    '2026-05-08': 'Den vítězství',
    '2026-07-05': 'Den slovanských věrozvěstů Cyrila a Metoděje',
    '2026-07-06': 'Den upálení mistra Jana Husa'
  };

  // Funkce pro počítání svátků připadajících na pracovní dny v daném měsíci
  const getHolidaysInMonth = (month: string): number => {
    const monthToNumber: { [key: string]: number } = {
      'srpen': 8, 'září': 9, 'říjen': 10, 'listopad': 11, 'prosinec': 12,
      'leden': 1, 'únor': 2, 'březen': 3, 'duben': 4, 'květen': 5, 'červen': 6, 'červenec': 7
    };
    
    const monthNum = monthToNumber[month];
    if (!monthNum) return 0;
    
    const year = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec'].includes(month) ? 2026 : 2025;
    
    let holidayCount = 0;
    
    Object.keys(publicHolidays).forEach(dateStr => {
      const date = new Date(dateStr);
      if (date.getFullYear() === year && date.getMonth() + 1 === monthNum) {
        // Kontrola, zda svátek připadá na pracovní den (pondělí = 1, pátek = 5)
        const dayOfWeek = date.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          holidayCount++;
        }
      }
    });
    
    return holidayCount;
  };

  // Funkce pro výpočet pracovních dnů v měsíci (5 dnů v týdnu) minus státní svátky
  const getWorkingDaysInMonth = (month: string): number => {
    // Základní počet pracovních dnů pro roky 2025-2026 s rokem v názvu
    const baseWorkingDays: { [key: string]: number } = {
      'říjen_2025': 23, 'listopad_2025': 20, 'prosinec_2025': 22,
      'leden_2026': 22, 'únor_2026': 20, 'březen_2026': 21, 'duben_2026': 22, 'květen_2026': 21, 'červen_2026': 21,
      'červenec_2026': 23, 'srpen_2026': 21, 'září_2026': 22, 'říjen_2026': 23, 'listopad_2026': 20, 'prosinec_2026': 23
    };
    
    const baseCount = baseWorkingDays[month] || 22;
    
    // Extrahovat název měsíce bez roku pro státní svátky
    const monthName = month.split('_')[0];
    const holidays = getHolidaysInMonth(monthName);
    
    return Math.max(0, baseCount - holidays);
  };


  // Přesnější mapování týdnů na měsíce s poměrným rozdělením pro roky 2025-2026
  const weekToMonthMapping: { [key: string]: { [month: string]: number } } = {
    // Rok 2025 (CW40-52) - CW32-39 vynechány (srpen-září historie)
    'CW40': { 'říjen_2025': 1.0 },   // 29 září - 5 října 2025 (celý týden započítán do října)
    'CW41': { 'říjen_2025': 1.0 },          // 6-12 října 2025 (celý týden)
    'CW42': { 'říjen_2025': 1.0 },          // 13-19 října 2025 (celý týden)
    'CW43': { 'říjen_2025': 1.0 },          // 20-26 října 2025 (celý týden)
    'CW44': { 'říjen_2025': 0.8, 'listopad_2025': 0.2 },    // 27 října - 2 listopadu 2025 (4:1 dny)
    'CW45': { 'listopad_2025': 1.0 },         // 3-9 listopadu 2025 (celý týden)
    'CW46': { 'listopad_2025': 1.0 },         // 10-16 listopadu 2025 (celý týden)
    'CW47': { 'listopad_2025': 1.0 },         // 17-23 listopadu 2025 (celý týden)
    'CW48': { 'listopad_2025': 0.6, 'prosinec_2025': 0.4 },   // 24-30 listopadu 2025 (3:2 dny)
    'CW49': { 'prosinec_2025': 1.0 },         // 1-7 prosince 2025 (celý týden)
    'CW50': { 'prosinec_2025': 1.0 },         // 8-14 prosince 2025 (celý týden)
    'CW51': { 'prosinec_2025': 1.0 },         // 15-21 prosince 2025 (celý týden)
    'CW52': { 'prosinec_2025': 1.0 },         // 22-28 prosince 2025 (celý týden)
    // Rok 2026 (CW01-52) - všechny s příponou _2026
    'CW01_2026': { 'leden_2026': 1.0 },            // 29 prosince 2025 - 4 ledna 2026 (celý týden)
    'CW02_2026': { 'leden_2026': 1.0 },            // 5-11 ledna 2026 (celý týden)
    'CW03_2026': { 'leden_2026': 1.0 },            // 12-18 ledna 2026 (celý týden)
    'CW04_2026': { 'leden_2026': 1.0 },            // 19-25 ledna 2026 (celý týden)
    'CW05_2026': { 'leden_2026': 0.8, 'únor_2026': 0.2 },   // 26 ledna - 1 února 2026 (4:1 dny)
    'CW06_2026': { 'únor_2026': 1.0 },             // 2-8 února 2026 (celý týden)
    'CW07_2026': { 'únor_2026': 1.0 },             // 9-15 února 2026 (celý týden)
    'CW08_2026': { 'únor_2026': 1.0 },             // 16-22 února 2026 (celý týden)
    'CW09_2026': { 'únor_2026': 0.6, 'březen_2026': 0.4 },  // 23 února - 1 března 2026 (3:2 dny)
    'CW10_2026': { 'březen_2026': 1.0 },           // 2-8 března 2026 (celý týden)
    'CW11_2026': { 'březen_2026': 1.0 },           // 9-15 března 2026 (celý týden)
    'CW12_2026': { 'březen_2026': 1.0 },           // 16-22 března 2026 (celý týden)
    'CW13_2026': { 'březen_2026': 1.0 },           // 23-29 března 2026 (celý týden)
    'CW14_2026': { 'březen_2026': 0.4, 'duben_2026': 0.6 },     // 30 března - 5 dubna 2026 (2:3 dny)
    'CW15_2026': { 'duben_2026': 1.0 },            // 6-12 dubna 2026 (celý týden)
    'CW16_2026': { 'duben_2026': 1.0 },            // 13-19 dubna 2026 (celý týden)
    'CW17_2026': { 'duben_2026': 1.0 },            // 20-26 dubna 2026 (celý týden)
    'CW18_2026': { 'duben_2026': 0.6, 'květen_2026': 0.4 },     // 27 dubna - 3 května 2026 (3:2 dny)
    'CW19_2026': { 'květen_2026': 1.0 },           // 4-10 května 2026 (celý týden)
    'CW20_2026': { 'květen_2026': 1.0 },           // 11-17 května 2026 (celý týden)
    'CW21_2026': { 'květen_2026': 1.0 },           // 18-24 května 2026 (celý týden)
    'CW22_2026': { 'květen_2026': 1.0 },           // 25-31 května 2026 (celý týden)
    'CW23_2026': { 'květen_2026': 0.2, 'červen_2026': 0.8 },    // 1-7 června 2026 (1:4 dny)
    'CW24_2026': { 'červen_2026': 1.0 },           // 8-14 června 2026 (celý týden)
    'CW25_2026': { 'červen_2026': 1.0 },           // 15-21 června 2026 (celý týden)
    'CW26_2026': { 'červen_2026': 1.0 },            // 22-28 června 2026 (celý týden)
    'CW27_2026': { 'červenec_2026': 1.0 },
    'CW28_2026': { 'červenec_2026': 1.0 },
    'CW29_2026': { 'červenec_2026': 1.0 },
    'CW30_2026': { 'červenec_2026': 1.0 },
    'CW31_2026': { 'červenec_2026': 0.6, 'srpen_2026': 0.4 },
    'CW32_2026': { 'srpen_2026': 1.0 },
    'CW33_2026': { 'srpen_2026': 1.0 },
    'CW34_2026': { 'srpen_2026': 1.0 },
    'CW35_2026': { 'srpen_2026': 0.6, 'září_2026': 0.4 },
    'CW36_2026': { 'září_2026': 1.0 },
    'CW37_2026': { 'září_2026': 1.0 },
    'CW38_2026': { 'září_2026': 1.0 },
    'CW39_2026': { 'září_2026': 1.0 },
    'CW40_2026': { 'září_2026': 0.4, 'říjen_2026': 0.6 },
    'CW41_2026': { 'říjen_2026': 1.0 },
    'CW42_2026': { 'říjen_2026': 1.0 },
    'CW43_2026': { 'říjen_2026': 1.0 },
    'CW44_2026': { 'říjen_2026': 0.8, 'listopad_2026': 0.2 },
    'CW45_2026': { 'listopad_2026': 1.0 },
    'CW46_2026': { 'listopad_2026': 1.0 },
    'CW47_2026': { 'listopad_2026': 1.0 },
    'CW48_2026': { 'listopad_2026': 0.6, 'prosinec_2026': 0.4 },
    'CW49_2026': { 'prosinec_2026': 1.0 },
    'CW50_2026': { 'prosinec_2026': 1.0 },
    'CW51_2026': { 'prosinec_2026': 1.0 },
    'CW52_2026': { 'prosinec_2026': 1.0 }
  };

  // Filtrovaná data podle vybraného filtru
  const filteredData = useMemo(() => {
    let data = planningData;

    // Nejprve aplikujeme standardní filtry
    if (filterType !== 'all' && filterType !== 'program' && filterValue !== 'all') {
      data = data.filter(entry => {
        const project = projects.find(p => p.code === entry.projekt);
        if (!project) return false;

        switch (filterType) {
          case 'customer':
            return project.customer_id === filterValue;
          case 'project':
            return project.id === filterValue;
          default:
            return true;
        }
      });
    }

    // Program filtr
    if (filterType === 'program' && selectedPrograms.length > 0) {
      data = data.filter(entry => {
        const project = projects.find(p => p.code === entry.projekt);
        return project && selectedPrograms.includes(project.program_id);
      });
    }

    // Kvartální/měsíční filtrování
    if (viewType === 'kvartal' && selectedQuarters.length > 0) {
      const quarterMonths: { [key: string]: string[] } = {
        'Q4-2025': ['říjen_2025', 'listopad_2025', 'prosinec_2025'],
        'Q1-2026': ['leden_2026', 'únor_2026', 'březen_2026'],
        'Q2-2026': ['duben_2026', 'květen_2026', 'červen_2026'],
        'Q3-2026': ['červenec_2026', 'srpen_2026', 'září_2026'],
        'Q4-2026': ['říjen_2026', 'listopad_2026', 'prosinec_2026']
      };
      
      const allSelectedMonths = selectedQuarters.flatMap(quarter => quarterMonths[quarter] || []);
      data = data.filter(entry => {
        // Použijeme CW mapping k určení, do kterých měsíců entry přispívá
        const cwKey = entry.cw.includes('-2026')
          ? entry.cw.replace('-', '_')
          : entry.cw.split('-')[0];
        const weekMapping = weekToMonthMapping[cwKey];
        if (!weekMapping) return false;
        
        // Zkontrolujeme, zda některý z měsíců je v selectedMonths
        return Object.keys(weekMapping).some(monthYear => allSelectedMonths.includes(monthYear));
      });
    } else if (viewType === 'mesic' && selectedMonths.length > 0) {
      data = data.filter(entry => {
        // Použijeme CW mapping k určení, do kterých měsíců entry přispívá
        const cwKey = entry.cw.includes('-2026')
          ? entry.cw.replace('-', '_')
          : entry.cw.split('-')[0];
        const weekMapping = weekToMonthMapping[cwKey];
        if (!weekMapping) return false;
        
        // Zkontrolujeme, zda některý z měsíců je v selectedMonths
        return Object.keys(weekMapping).some(monthYear => selectedMonths.includes(monthYear));
      });
    }

    return data;
  }, [planningData, filterType, filterValue, selectedPrograms, projects, viewType, selectedQuarters, selectedMonths]);

  // Výpočet revenue po měsících s rozložením podle projektů a poměrným rozdělením týdnů
  const calculateMonthlyRevenueByProject = (data = filteredData) => {
    console.log('=== REVENUE CALCULATION DEBUG ===');
    console.log('Total planning entries:', data.length);
    console.log('Projects in database:', projects.length);
    
    const monthlyData: { [month: string]: { [projectCode: string]: number } } = {};

    // Inicializace struktur pro všechny měsíce s rokem
    const months = [
      'říjen_2025', 'listopad_2025', 'prosinec_2025',
      'leden_2026', 'únor_2026', 'březen_2026', 'duben_2026', 'květen_2026', 'červen_2026',
      'červenec_2026', 'srpen_2026', 'září_2026', 'říjen_2026', 'listopad_2026', 'prosinec_2026'
    ];
    months.forEach(month => {
      monthlyData[month] = {};
    });

    // Seznam neproduktivních aktivit, které negenerují zisk
    const nonRevenueActivities = ['FREE', 'Dovolena', 'DOVOLENÁ', 'Nemoc', 'NEMOC', 'Školení', 'ŠKOLENÍ', 'Interní', 'INTERNÍ'];

    // Projdeme všechny záznamy v plánovacích datech
    data.forEach(entry => {
      const cwKey = entry.cw.includes('-2026')
        ? entry.cw.replace('-', '_')
        : entry.cw.split('-')[0];
      const weekMapping = weekToMonthMapping[cwKey];
      if (!weekMapping || entry.mhTyden === 0) return;

      // Přeskočit tentative rezervace - nepočítají se do potvrzeného revenue
      if (entry.is_tentative === true) return;

      // Přeskočit neproduktivní aktivity (case-insensitive porovnání)
      const projektTrimmed = entry.projekt?.trim();
      if (nonRevenueActivities.some(activity => 
        activity.toLowerCase() === projektTrimmed?.toLowerCase()
      )) return;

      // Najdeme projekt podle kódu
      const project = projects.find(p => p.code === entry.projekt);
      if (!project) {
        console.log(`Project not found in database: ${entry.projekt}`);
        return;
      }

      let hourlyRate = 0;
      
      // Určíme hodinovou sazbu podle typu projektu z databáze
      // Pro WP projekty používáme average_hourly_rate
      // Pro Hodinovka projekty používáme primárně average_hourly_rate, jinak budget, jinak default
      if (project.project_type === 'WP' && project.average_hourly_rate) {
        hourlyRate = project.average_hourly_rate;
      } else if (project.project_type === 'Hodinovka') {
        // Pro Hodinovka projekty: priorita average_hourly_rate > budget > default 1000
        hourlyRate = project.average_hourly_rate || project.budget || 1000;
      }

      // Debug výpis pro realizace projekty
      if (project.project_status === 'Realizace' && entry.cw.includes('CW45')) {
        console.log(`Realizace project ${entry.projekt}: type=${project.project_type}, hourlyRate=${hourlyRate}, avg_rate=${project.average_hourly_rate}, budget=${project.budget}, hours=${entry.mhTyden}`);
      }

      // Pokud nemáme sazbu, přeskočíme
      if (hourlyRate === 0) {
        if (project.project_status === 'Realizace') {
          console.log(`Skipping Realizace project ${entry.projekt} - no hourly rate found`);
        }
        return;
      }

      // Rozdělíme týdenní výkon podle poměru dnů v měsících
      Object.entries(weekMapping).forEach(([month, ratio]) => {
        // Inicializace projektu v měsíci
        if (!monthlyData[month][entry.projekt]) {
          monthlyData[month][entry.projekt] = 0;
        }

        // Koeficient pro snížení o státní svátky
        const baseWorkingDays: { [key: string]: number } = {
          'říjen_2025': 23, 'listopad_2025': 20, 'prosinec_2025': 22,
          'leden_2026': 22, 'únor_2026': 20, 'březen_2026': 21, 'duben_2026': 22, 'květen_2026': 21, 'červen_2026': 21,
          'červenec_2026': 23, 'srpen_2026': 21, 'září_2026': 22, 'říjen_2026': 23, 'listopad_2026': 20, 'prosinec_2026': 23
        };
        const workingDaysWithoutHolidays = getWorkingDaysInMonth(month);
        const totalWorkingDays = baseWorkingDays[month] || 22;
        const holidayCoefficient = workingDaysWithoutHolidays / totalWorkingDays;

        // Koeficient pravděpodobnosti pro presales projekty
        let probabilityCoefficient = 1;
        if (project.project_status === 'Pre sales' && project.probability) {
          probabilityCoefficient = project.probability / 100;
        }

        // Přičteme poměrnou část týdenního revenue k měsíčnímu součtu (snížené o státní svátky a pravděpodobnost)
        const monthlyRevenue = entry.mhTyden * hourlyRate * ratio * holidayCoefficient * probabilityCoefficient;
        monthlyData[month][entry.projekt] += monthlyRevenue;
      });
    });

    // Přidáme presales projekty, které nemají plánovaná data, ale mají definované období
    projects.forEach(project => {
      if (project.project_status === 'Pre sales' && 
          project.presales_start_date && 
          project.presales_end_date &&
          project.budget &&
          (project.project_type === 'Hodinovka' || project.average_hourly_rate)) {
        
        // Zkontrolujeme, zda projekt už není zahrnut v plánovaných datech
        const hasPlannedData = data.some(entry => entry.projekt === project.code);
        if (hasPlannedData) return;

        const startDate = new Date(project.presales_start_date);
        const endDate = new Date(project.presales_end_date);
        
        // Určíme hodinovou sazbu
        let hourlyRate = 0;
        if (project.project_type === 'WP' && project.average_hourly_rate) {
          hourlyRate = project.average_hourly_rate;
        } else if (project.project_type === 'Hodinovka') {
          hourlyRate = 1000; // Default hourly rate for Hodinovka presales
        }

        // Celkový objem v hodinách (budget pro WP projekty, nebo odhad pro Hodinovka)
        const totalHours = project.project_type === 'WP' ? project.budget : 100; // Default 100h pro Hodinovka presales

        // Koeficient pravděpodobnosti
        const probabilityCoefficient = project.probability ? project.probability / 100 : 0.5;

        // Mapování měsíců s rokem
        const numberToMonth: { [key: string]: string } = {
          '10_2025': 'říjen_2025', '11_2025': 'listopad_2025', '12_2025': 'prosinec_2025',
          '1_2026': 'leden_2026', '2_2026': 'únor_2026', '3_2026': 'březen_2026', '4_2026': 'duben_2026', '5_2026': 'květen_2026', '6_2026': 'červen_2026',
          '7_2026': 'červenec_2026', '8_2026': 'srpen_2026', '9_2026': 'září_2026', '10_2026': 'říjen_2026', '11_2026': 'listopad_2026', '12_2026': 'prosinec_2026'
        };
        // Spočítáme celkový počet pracovních dnů v období
        let totalWorkingDays = 0;
        const monthsInPeriod: string[] = [];
        
        const current = new Date(startDate);
        while (current <= endDate) {
          const monthNum = current.getMonth() + 1;
          const year = current.getFullYear();
          const monthKey = `${monthNum}_${year}`;
          const monthName = numberToMonth[monthKey];
          
          if (monthName && !monthsInPeriod.includes(monthName)) {
            monthsInPeriod.push(monthName);
            totalWorkingDays += getWorkingDaysInMonth(monthName);
          }
          
          current.setMonth(current.getMonth() + 1);
        }

        if (totalWorkingDays === 0) return;

        // Rozdělíme revenue poměrně mezi měsíce
        monthsInPeriod.forEach(monthName => {
          const workingDaysInMonth = getWorkingDaysInMonth(monthName);
          const monthRatio = workingDaysInMonth / totalWorkingDays;
          const monthHours = totalHours * monthRatio;
          const monthRevenue = monthHours * hourlyRate * probabilityCoefficient;

          if (!monthlyData[monthName][project.code]) {
            monthlyData[monthName][project.code] = 0;
          }
          monthlyData[monthName][project.code] += monthRevenue;
        });
      }
    });

    return monthlyData;
  };

  const monthlyRevenueByProject = calculateMonthlyRevenueByProject();
  const months = viewType === 'mesic' ? 
    [
      'říjen_2025', 'listopad_2025', 'prosinec_2025',
      'leden_2026', 'únor_2026', 'březen_2026', 'duben_2026', 'květen_2026', 'červen_2026',
      'červenec_2026', 'srpen_2026', 'září_2026', 'říjen_2026', 'listopad_2026', 'prosinec_2026'
    ].filter(month => selectedMonths.includes(month))
    : [
      'říjen_2025', 'listopad_2025', 'prosinec_2025',
      'leden_2026', 'únor_2026', 'březen_2026', 'duben_2026', 'květen_2026', 'červen_2026',
      'červenec_2026', 'srpen_2026', 'září_2026', 'říjen_2026', 'listopad_2026', 'prosinec_2026'
    ];
  
  // Získání všech unikátních projektů s revenue - rozdělení podle statusu
  const allProjects = new Set<string>();
  Object.values(monthlyRevenueByProject).forEach(monthData => {
    Object.keys(monthData).forEach(projectCode => allProjects.add(projectCode));
  });
  const projectList = Array.from(allProjects);
  
  // Rozdělíme projekty podle statusu
  const realizaceProjects = projectList.filter(projectCode => {
    const project = projects.find(p => p.code === projectCode);
    return project?.project_status !== 'Pre sales';
  });
  
  const presalesProjects = projectList.filter(projectCode => {
    const project = projects.find(p => p.code === projectCode);
    return project?.project_status === 'Pre sales';
  });

  // Filtrujeme projekty podle project_status filtru
  const filteredProjectList = useMemo(() => {
    if (projectStatusFilter === 'realizace') {
      return realizaceProjects;
    } else if (projectStatusFilter === 'presales') {
      return presalesProjects;
    } else if (['P0', 'P1', 'P2', 'P3'].includes(projectStatusFilter)) {
      // Filtruj pouze presales projekty s danou fází
      return projectList.filter(projectCode => {
        const project = projects.find(p => p.code === projectCode);
        return project?.project_status === 'Pre sales' && project?.presales_phase === projectStatusFilter;
      });
    }
    return projectList; // 'all'
  }, [projectList, realizaceProjects, presalesProjects, projectStatusFilter, projects]);

  // Výpočet celkového revenue pouze pro vybrané měsíce a filtrované projekty
  const totalRevenue = useMemo(() => {
    return months.reduce((sum, month) => {
      const monthData = monthlyRevenueByProject[month] || {};
      return sum + filteredProjectList.reduce((monthSum, projectCode) => monthSum + (monthData[projectCode] || 0), 0);
    }, 0);
  }, [months, monthlyRevenueByProject, filteredProjectList]);

  // Data pro stackovaný graf
  const chartData = useMemo(() => {
    if (viewType === 'kvartal') {
      // Kvartální data
      const quarterData = [
        {
          quarter: 'Q4 2025',
          months: ['říjen_2025', 'listopad_2025', 'prosinec_2025'],
          label: 'Q4 25'
        },
        {
          quarter: 'Q1 2026',
          months: ['leden_2026', 'únor_2026', 'březen_2026'], 
          label: 'Q1 26'
        },
        {
          quarter: 'Q2 2026',
          months: ['duben_2026', 'květen_2026', 'červen_2026'],
          label: 'Q2 26'
        },
        {
          quarter: 'Q3 2026',
          months: ['červenec_2026', 'srpen_2026', 'září_2026'],
          label: 'Q3 26'
        },
        {
          quarter: 'Q4 2026',
          months: ['říjen_2026', 'listopad_2026', 'prosinec_2026'],
          label: 'Q4 26'
        }
      ];

      return quarterData.map(({ quarter, months, label }) => {
        const data: any = {
          month: label,
          total: 0
        };
        
        // Sečteme data za všechny měsíce v kvartálu (pouze filtrované projekty)
        months.forEach(month => {
          const monthData = monthlyRevenueByProject[month] || {};
          data.total += filteredProjectList.reduce((sum: number, projectCode) => sum + (monthData[projectCode] || 0), 0);
          
          // Přidáme data pouze pro filtrované projekty
          filteredProjectList.forEach(projectCode => {
            if (!data[projectCode]) data[projectCode] = 0;
            data[projectCode] += monthData[projectCode] || 0;
          });
        });
        
        return data;
      });
    } else {
      // Měsíční data
      return months.map(month => {
        const monthData = monthlyRevenueByProject[month] || {};
        // Lepší zkracování názvu měsíce pro graf
        const monthLabels: { [key: string]: string } = {
          'říjen_2025': 'říj 25', 'listopad_2025': 'lis 25', 'prosinec_2025': 'pro 25',
          'leden_2026': 'led 26', 'únor_2026': 'úno 26', 'březen_2026': 'bře 26', 
          'duben_2026': 'dub 26', 'květen_2026': 'kvě 26', 'červen_2026': 'čer 26',
          'červenec_2026': 'čec 26', 'srpen_2026': 'srp 26', 'září_2026': 'zář 26',
          'říjen_2026': 'říj 26', 'listopad_2026': 'lis 26', 'prosinec_2026': 'pro 26'
        };
        const monthNameForDisplay = monthLabels[month] || month;
        const data: any = {
          month: monthNameForDisplay,
          total: filteredProjectList.reduce((sum: number, projectCode) => sum + (monthData[projectCode] || 0), 0)
        };
        
        // Přidáme data pouze pro filtrované projekty
        filteredProjectList.forEach(projectCode => {
          data[projectCode] = monthData[projectCode] || 0;
        });
        
        return data;
      });
    }
  }, [monthlyRevenueByProject, filteredProjectList, viewType, months]);

  // Možnosti pro filtrování
  const getFilterOptions = () => {
    switch (filterType) {
      case 'customer':
        return customers.map(c => ({ value: c.id, label: c.name }));
      case 'program':
        return programs.map(p => ({ value: p.id, label: p.name }));
      case 'project':
        return projects.filter(p => (p.project_type === 'WP' && p.average_hourly_rate) || (p.project_type === 'Hodinovka' && p.budget)).map(p => ({ value: p.id, label: p.name }));
      default:
        return [];
    }
  };

  // Možnosti pro kvartální filtr
  const getQuarterOptions = () => [
    { value: 'Q4-2025', label: 'Q4 2025 (říjen-prosinec)' },
    { value: 'Q1-2026', label: 'Q1 2026 (leden-březen)' },
    { value: 'Q2-2026', label: 'Q2 2026 (duben-červen)' },
    { value: 'Q3-2026', label: 'Q3 2026 (červenec-září)' },
    { value: 'Q4-2026', label: 'Q4 2026 (říjen-prosinec)' }
  ];

  // Možnosti pro měsíční filtr
  const getMonthOptions = () => [
    { value: 'říjen_2025', label: 'Říjen 2025' },
    { value: 'listopad_2025', label: 'Listopad 2025' },
    { value: 'prosinec_2025', label: 'Prosinec 2025' },
    { value: 'leden_2026', label: 'Leden 2026' },
    { value: 'únor_2026', label: 'Únor 2026' },
    { value: 'březen_2026', label: 'Březen 2026' },
    { value: 'duben_2026', label: 'Duben 2026' },
    { value: 'květen_2026', label: 'Květen 2026' },
    { value: 'červen_2026', label: 'Červen 2026' },
    { value: 'červenec_2026', label: 'Červenec 2026' },
    { value: 'srpen_2026', label: 'Srpen 2026' },
    { value: 'září_2026', label: 'Září 2026' },
    { value: 'říjen_2026', label: 'Říjen 2026' },
    { value: 'listopad_2026', label: 'Listopad 2026' },
    { value: 'prosinec_2026', label: 'Prosinec 2026' }
  ];

  const filterOptions = getFilterOptions();
  const quarterOptions = getQuarterOptions();
  const monthOptions = getMonthOptions();

  // Reset filter value when filter type changes
  const handleFilterTypeChange = (value: string) => {
    setFilterType(value as any);
    setFilterValue('all');
    setSelectedPrograms([]);
  };

  // Handle view type change
  const handleViewTypeChange = (value: 'mesic' | 'kvartal') => {
    setViewType(value);
    // Reset to all quarters/months when switching view type
    if (value === 'kvartal') {
      setSelectedQuarters(['Q4-2025', 'Q1-2026', 'Q2-2026', 'Q3-2026', 'Q4-2026']);
    } else {
      setSelectedMonths(['říjen_2025', 'listopad_2025', 'prosinec_2025', 'leden_2026', 'únor_2026', 'březen_2026', 'duben_2026', 'květen_2026', 'červen_2026', 'červenec_2026', 'srpen_2026', 'září_2026', 'říjen_2026', 'listopad_2026', 'prosinec_2026']);
    }
  };

  // Handle quarter checkbox changes
  const handleQuarterChange = (quarterId: string, checked: boolean) => {
    if (checked) {
      setSelectedQuarters(prev => [...prev, quarterId]);
    } else {
      setSelectedQuarters(prev => prev.filter(id => id !== quarterId));
    }
  };

  // Handle program checkbox changes
  const handleProgramChange = (programId: string, checked: boolean) => {
    if (checked) {
      setSelectedPrograms(prev => [...prev, programId]);
    } else {
      setSelectedPrograms(prev => prev.filter(id => id !== programId));
    }
  };

  // Handle month checkbox changes
  const handleMonthChange = (monthId: string, checked: boolean) => {
    if (checked) {
      setSelectedMonths(prev => [...prev, monthId]);
    } else {
      setSelectedMonths(prev => prev.filter(id => id !== monthId));
    }
  };

  if (loading) {
    return (
    <div className="space-y-6">
        <div className="text-center py-8">Načítám data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-card-custom">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue - Obrat po měsících
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtry */}
          <div className="space-y-4 mb-6 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <Label className="font-medium text-sm">Filtrovat podle:</Label>
            </div>
            
            {/* Kompaktní řádek s hlavními filtry */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[120px]">
                <Label htmlFor="viewType" className="text-xs text-muted-foreground">Pohled</Label>
                <Select value={viewType} onValueChange={handleViewTypeChange}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="mesic">Měsíční</SelectItem>
                    <SelectItem value="kvartal">Kvartální</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[130px]">
                <Label htmlFor="filterType" className="text-xs text-muted-foreground">Typ filtru</Label>
                <Select value={filterType} onValueChange={handleFilterTypeChange}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="all">Vše</SelectItem>
                    <SelectItem value="customer">Zákazník</SelectItem>
                    <SelectItem value="program">Program</SelectItem>
                    <SelectItem value="project">Projekt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filterType !== 'all' && filterType !== 'program' && (
                <div className="min-w-[150px]">
                  <Label htmlFor="filterValue" className="text-xs text-muted-foreground">Hodnota</Label>
                  <Select value={filterValue} onValueChange={setFilterValue}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Vyberte..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      <SelectItem value="all">Vše</SelectItem>
                      {filterOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="min-w-[100px]">
                <Label htmlFor="currency" className="text-xs text-muted-foreground">Měna</Label>
                <Select value={currency} onValueChange={(value: 'CZK' | 'USD') => setCurrency(value)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="CZK">CZK</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[130px]">
                <Label htmlFor="projectStatus" className="text-xs text-muted-foreground">Status projektu</Label>
                <Select value={projectStatusFilter} onValueChange={(value: 'all' | 'realizace' | 'presales' | 'P0' | 'P1' | 'P2' | 'P3') => setProjectStatusFilter(value)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="all">PreSales + Realizace</SelectItem>
                    <SelectItem value="realizace">Realizace</SelectItem>
                    <SelectItem value="presales">PreSales</SelectItem>
                    <SelectItem value="P0">P0</SelectItem>
                    <SelectItem value="P1">P1</SelectItem>
                    <SelectItem value="P2">P2</SelectItem>
                    <SelectItem value="P3">P3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rozšířené filtry v novém řádku */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kvartální filtr */}
              {viewType === 'kvartal' && (
                <div>
                  <Label className="text-xs text-muted-foreground">Kvartály</Label>
                  <div className="grid grid-cols-3 gap-1 mt-2 p-2 border rounded-md bg-background/50 max-h-24 overflow-y-auto">
                    {quarterOptions.map((quarter) => (
                      <div key={quarter.value} className="flex items-center space-x-1">
                        <input
                          type="checkbox"
                          id={`quarter-${quarter.value}`}
                          checked={selectedQuarters.includes(quarter.value)}
                          onChange={(e) => handleQuarterChange(quarter.value, e.target.checked)}
                          className="rounded border-gray-300 text-primary focus:ring-primary scale-75"
                        />
                        <Label 
                          htmlFor={`quarter-${quarter.value}`} 
                          className="text-xs font-normal cursor-pointer"
                        >
                          {quarter.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Měsíční filtr */}
              {viewType === 'mesic' && (
                <div>
                  <Label className="text-xs text-muted-foreground">Měsíce</Label>
                  <div className="grid grid-cols-3 gap-1 mt-2 p-2 border rounded-md bg-background/50 max-h-32 overflow-y-auto">
                    {monthOptions.map((month) => (
                      <div key={month.value} className="flex items-center space-x-1">
                        <input
                          type="checkbox"
                          id={`month-${month.value}`}
                          checked={selectedMonths.includes(month.value)}
                          onChange={(e) => handleMonthChange(month.value, e.target.checked)}
                          className="rounded border-gray-300 text-primary focus:ring-primary scale-75"
                        />
                        <Label 
                          htmlFor={`month-${month.value}`} 
                          className="text-xs font-normal cursor-pointer"
                        >
                          {month.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Program filtr */}
              {filterType === 'program' && (
                <div>
                  <Label className="text-xs text-muted-foreground">Programy</Label>
                  <div className="grid grid-cols-2 gap-1 mt-2 p-2 border rounded-md bg-background/50 max-h-32 overflow-y-auto">
                    {programs.map((program) => (
                      <div key={program.id} className="flex items-center space-x-1">
                        <input
                          type="checkbox"
                          id={`program-${program.id}`}
                          checked={selectedPrograms.includes(program.id)}
                          onChange={(e) => handleProgramChange(program.id, e.target.checked)}
                          className="rounded border-gray-300 text-primary focus:ring-primary scale-75"
                        />
                        <Label 
                          htmlFor={`program-${program.id}`} 
                          className="text-xs font-normal cursor-pointer"
                        >
                          {program.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

           {/* Celkový obrat */}
           <div className="mb-6">
             <div className="text-2xl font-bold text-primary">
               Celkový obrat: {formatCurrency(totalRevenue)}
             </div>
             <p className="text-sm text-muted-foreground mt-1">
               {filterType === 'program' && selectedPrograms.length > 0
                 ? `Filtrováno podle programů: ${selectedPrograms.map(id => programs.find(p => p.id === id)?.name).join(', ')}`
                 : filterType !== 'all' && filterValue !== 'all' 
                 ? `Filtrováno podle: ${
                     filterType === 'customer' ? 'zákazník' : 
                     filterType === 'project' ? 'projekt' : 
                     'program'
                   }`
                 : 'Všechny projekty s revenue'
                 } | Pohled: {viewType === 'mesic' ? 'Měsíční' : 'Kvartální'}
                 {viewType === 'kvartal' && selectedQuarters.length > 0 && selectedQuarters.length < quarterOptions.length ? ` - ${selectedQuarters.map(q => quarterOptions.find(opt => opt.value === q)?.label).join(', ')}` : ''}
                 {viewType === 'mesic' && selectedMonths.length > 0 && selectedMonths.length < monthOptions.length ? ` - ${selectedMonths.map(m => monthOptions.find(opt => opt.value === m)?.label).join(', ')}` : ''}
              </p>
          </div>

          {/* Graf */}
          <div className="h-96 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => {
                    if (currency === 'USD') {
                      return `$${(value / exchangeRate / 1000).toFixed(0)}k`;
                    }
                    return `${(value / 1000).toFixed(0)}k`;
                  }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  cursor={false}
                  content={(props) => {
                    if (!props.active || !props.payload || !props.label) return null;
                    
                    const data = props.payload[0]?.payload;
                    if (!data) return null;
                    
                    // Rozdělíme projekty podle statusu a seřadíme podle revenue
                    const realizaceItems: {code: string, value: number}[] = [];
                    const presalesItems: {code: string, value: number, probability?: number}[] = [];
                    
                    filteredProjectList.forEach(projectCode => {
                      const project = projects.find(p => p.code === projectCode);
                      const value = data[projectCode] || 0;
                      if (value === 0) return; // Přeskočit projekty s nulovou hodnotou
                      
                      if (project?.project_status === 'Pre sales') {
                        presalesItems.push({ code: projectCode, value, probability: project?.probability || undefined });
                      } else {
                        realizaceItems.push({ code: projectCode, value });
                      }
                    });
                    
                    // Seřadit podle hodnoty sestupně
                    realizaceItems.sort((a, b) => b.value - a.value);
                    presalesItems.sort((a, b) => b.value - a.value);
                    
                    const realizaceSum = realizaceItems.reduce((sum, item) => sum + item.value, 0);
                    const presalesSum = presalesItems.reduce((sum, item) => sum + item.value, 0);
                    const total = realizaceSum + presalesSum;
                    
                    return (
                      <div className="bg-card border border-border rounded-md p-3 shadow-md max-w-sm max-h-96 overflow-y-auto">
                        <p className="font-medium mb-2 border-b pb-2">
                          {viewType === 'kvartal' ? 'Kvartál' : 'Měsíc'}: {props.label}
                        </p>
                        
                        {/* Realizace sekce */}
                        {realizaceItems.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">
                              REALIZACE ({formatCurrency(realizaceSum)})
                            </p>
                            <div className="space-y-0.5 pl-2">
                              {realizaceItems.map(item => (
                                <div key={item.code} className="flex justify-between text-sm gap-4">
                                  <span className="truncate">{item.code}</span>
                                  <span className="font-mono text-right">{formatCurrency(item.value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Presales sekce */}
                        {presalesItems.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">
                              PRESALES ({formatCurrency(presalesSum)})
                            </p>
                            <div className="space-y-0.5 pl-2">
                              {presalesItems.map(item => (
                                <div key={item.code} className="flex justify-between text-sm gap-4">
                                  <span className="truncate">
                                    {item.code}
                                    {item.probability && (
                                      <span className="text-xs text-muted-foreground ml-1">
                                        ({item.probability}%)
                                      </span>
                                    )}
                                  </span>
                                  <span className="font-mono text-right">{formatCurrency(item.value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Celkem */}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between font-semibold">
                            <span>Celkem:</span>
                            <span>{formatCurrency(total)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                 {/* Všechny projekty v jednom stacku - realizace + presales */}
                 {filteredProjectList.map((projectCode, index) => {
                   const project = projects.find(p => p.code === projectCode);
                   const isPresales = project?.project_status === 'Pre sales';
                   const color = getProjectColorWithIndex(projectCode, index);
                   
                   return (
                     <Bar 
                       key={projectCode}
                       dataKey={projectCode} 
                       stackId="combined"
                       fill={color}
                       fillOpacity={isPresales ? 0.7 : 1}
                       name={isPresales ? `${projectCode} (Presales)` : projectCode}
                       stroke={isPresales ? color : undefined}
                       strokeWidth={isPresales ? 1 : 0}
                       strokeDasharray={isPresales ? "3 3" : undefined}
                     >
                       {index === filteredProjectList.length - 1 && (
                         <LabelList 
                           dataKey="total"
                           content={(props: any) => renderTotalLabel(props)}
                         />
                       )}
                     </Bar>
                   );
                 })}
              </BarChart>
            </ResponsiveContainer>
          </div>
          
        </CardContent>
      </Card>

      {/* Detailní tabulka projektů */}
      <Card className="shadow-card-custom">
        <CardHeader>
          <CardTitle>Detailní rozpis podle projektů</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Projekt</TableHead>
                   {months.map(month => {
                    const monthDisplay = month.replace('_2025', ' 25').replace('_2026', ' 26');
                    return (
                      <TableHead key={month} className="text-right font-bold min-w-[120px]">
                        {monthDisplay}
                      </TableHead>
                    );
                  })}
                  <TableHead className="text-right font-bold">Celkem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjectList
                  .sort((a, b) => {
                    // Najdeme projekty podle kódu
                    const projectA = projects.find(p => p.code === a);
                    const projectB = projects.find(p => p.code === b);
                    
                    // Určíme status projektů (Realizace má prioritu)
                    const statusA = projectA?.project_status || 'Realizace';
                    const statusB = projectB?.project_status || 'Realizace';
                    
                    // Nejprve třídíme podle statusu (Realizace před Pre sales)
                    if (statusA !== statusB) {
                      if (statusA === 'Realizace' && statusB === 'Pre sales') return -1;
                      if (statusA === 'Pre sales' && statusB === 'Realizace') return 1;
                    }
                    
                    // V rámci stejného statusu třídíme podle celkové revenue (sestupně)
                    const totalA = Object.values(monthlyRevenueByProject).reduce((sum, monthData) => 
                      sum + (monthData[a] || 0), 0);
                    const totalB = Object.values(monthlyRevenueByProject).reduce((sum, monthData) => 
                      sum + (monthData[b] || 0), 0);
                    return totalB - totalA;
                  })
                  .map((projectCode, index) => {
                    const project = projects.find(p => p.code === projectCode);
                    const isPresales = project?.project_status === 'Pre sales';
                    const projectTotal = Object.values(monthlyRevenueByProject).reduce((sum, monthData) => 
                      sum + (monthData[projectCode] || 0), 0);
                    
                    if (projectTotal === 0) return null;

                    return (
                      <TableRow key={projectCode} className={isPresales ? "bg-muted/30" : ""}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded" 
                              style={{ backgroundColor: getProjectColorWithIndex(projectCode, index) }}
                            />
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                {projectCode}
                                {isPresales && (
                                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-medium">
                                    Presales
                                  </span>
                                )}
                              </div>
                              {isPresales && project?.presales_phase && (
                                <span className="text-xs text-muted-foreground">
                                  {project.presales_phase} • {project.probability}% pravděpodobnost
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                         {months.map(month => {
                           const revenue = monthlyRevenueByProject[month]?.[projectCode] || 0;
                           return (
                             <TableCell key={month} className={`text-right font-mono ${isPresales ? 'text-muted-foreground' : ''}`}>
                               {revenue > 0 ? formatCurrency(revenue) : '-'}
                             </TableCell>
                           );
                         })}
                         <TableCell className={`text-right font-mono font-bold ${isPresales ? 'text-muted-foreground' : ''}`}>
                           {formatCurrency(projectTotal)}
                         </TableCell>
                      </TableRow>
                    );
                  })
                  .filter(Boolean)}
                
                {/* Celkový řádek */}
                <TableRow className="font-bold border-t-2">
                  <TableCell className="font-bold">CELKEM</TableCell>
                   {months.map(month => {
                     const monthData = monthlyRevenueByProject[month] || {};
                     const monthTotal = filteredProjectList.reduce((sum: number, projectCode) => sum + (monthData[projectCode] || 0), 0);
                     return (
                       <TableCell key={month} className="text-right font-mono font-bold">
                         {formatCurrency(monthTotal)}
                       </TableCell>
                     );
                   })}
                   <TableCell className="text-right font-mono font-bold text-primary">
                     {formatCurrency(totalRevenue)}
                   </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};