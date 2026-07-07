import React, { useState, useMemo, useEffect } from 'react';
import { usePlanning } from '@/contexts/PlanningContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { TrendingUp, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getProjectColorWithIndex } from '@/utils/colorSystem';
import { getWeekToMonthFractions, getWorkingDaysInMonth as getWorkingDaysInMonthFromUtils } from '@/utils/workingDays';

interface DatabaseProject {
  id: string;
  name: string;
  code: string;
  customer_id: string;
  project_manager_id: string;
  program_id: string;
  project_type: string;
  budget?: number;
  hourly_rate?: number;
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
  defaultViewType = 'mesic',
  defaultProgramCodes = ['MACH', 'RAIL']
}: RevenueOverviewProps) => {
  const { planningData } = usePlanning();
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'program' | 'project'>('program');
  const [filterValue, setFilterValue] = useState<string>('all');
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [viewType, setViewType] = useState<'mesic' | 'kvartal'>(defaultViewType);
  // Indické fiskální kvartály: Q1=Apr-Jun, Q2=Jul-Sep, Q3=Oct-Dec, Q4=Jan-Mar (FY = Apr-Mar)
  const [selectedQuarters, setSelectedQuarters] = useState<string[]>(['Q3-FY26', 'Q4-FY26', 'Q1-FY27', 'Q2-FY27', 'Q3-FY27']);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([
    'leden_2026', 'únor_2026', 'březen_2026', 'duben_2026', 'květen_2026', 'červen_2026',
    'červenec_2026', 'srpen_2026', 'září_2026', 'říjen_2026', 'listopad_2026', 'prosinec_2026'
  ]);
  const [currency, setCurrency] = useState<'CZK' | 'USD'>(defaultCurrency);
  const [displayUnit, setDisplayUnit] = useState<'kc' | 'hodiny'>('kc');
  const [projectStatusFilter, setProjectStatusFilter] = useState<'all' | 'realizace' | 'presales' | 'P0' | 'P1' | 'P2' | 'P3'>(defaultStatusFilter);
  const [projects, setProjects] = useState<DatabaseProject[]>([]);
  const [customers, setCustomers] = useState<DatabaseCustomer[]>([]);
  const [programs, setPrograms] = useState<DatabaseProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultProgramsApplied, setDefaultProgramsApplied] = useState(false);
  const [monthCoefficients, setMonthCoefficients] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('revenueMonthCoefficients');
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });

  const getCoeff = (month: string): number => {
    const v = monthCoefficients[month];
    return (typeof v === 'number' && !isNaN(v)) ? v : 1;
  };

  const handleCoeffChange = (month: string, raw: string) => {
    const parsed = parseFloat(raw.replace(',', '.'));
    setMonthCoefficients(prev => {
      const next = { ...prev };
      if (raw === '' || isNaN(parsed)) delete next[month];
      else next[month] = parsed;
      try { localStorage.setItem('revenueMonthCoefficients', JSON.stringify(next)); } catch {}
      return next;
    });
  };

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
    if (displayUnit === 'hodiny') {
      if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k h`;
      return `${Math.round(value)} h`;
    }
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

  // Format hours
  const formatHours = (value: number): string => {
    return `${value.toLocaleString('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} h`;
  };

  // Active value formatter based on displayUnit
  const formatValue = (value: number): string => {
    return displayUnit === 'kc' ? formatCurrency(value) : formatHours(value);
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

  // Month name to number mapping for working days calculation
  const monthNameToNumber: { [key: string]: number } = {
    'leden': 1, 'únor': 2, 'březen': 3, 'duben': 4, 'květen': 5, 'červen': 6,
    'červenec': 7, 'srpen': 8, 'září': 9, 'říjen': 10, 'listopad': 11, 'prosinec': 12
  };

  // Shared helper: get working days for a monthKey like "červen_2026"
  const getWorkingDaysForMonthKey = (monthKey: string): number => {
    const parts = monthKey.split('_');
    if (parts.length !== 2) return 22;
    const monthNum = monthNameToNumber[parts[0]];
    const year = parseInt(parts[1]);
    if (!monthNum || !year) return 22;
    return getWorkingDaysInMonthFromUtils(year, monthNum);
  };

  // Dynamic week-to-month mapping using shared utility
  const getWeekMapping = (cwKey: string): { [month: string]: number } | null => {
    const fractions = getWeekToMonthFractions(cwKey);
    if (fractions.length === 0) return null;
    const result: { [month: string]: number } = {};
    fractions.forEach(f => { result[f.monthKey] = f.fraction; });
    return result;
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
        'Q3-FY26': ['říjen_2025', 'listopad_2025', 'prosinec_2025'],
        'Q4-FY26': ['leden_2026', 'únor_2026', 'březen_2026'],
        'Q1-FY27': ['duben_2026', 'květen_2026', 'červen_2026'],
        'Q2-FY27': ['červenec_2026', 'srpen_2026', 'září_2026'],
        'Q3-FY27': ['říjen_2026', 'listopad_2026', 'prosinec_2026']
      };
      
      const allSelectedMonths = selectedQuarters.flatMap(quarter => quarterMonths[quarter] || []);
      data = data.filter(entry => {
        const cwKey = entry.cw.includes('-2026')
          ? entry.cw.replace('-', '_')
          : entry.cw.split('-')[0];
        const weekMapping = getWeekMapping(cwKey);
        if (!weekMapping) return false;
        return Object.keys(weekMapping).some(monthYear => allSelectedMonths.includes(monthYear));
        
        // Zkontrolujeme, zda některý z měsíců je v selectedMonths
        return Object.keys(weekMapping).some(monthYear => allSelectedMonths.includes(monthYear));
      });
    } else if (viewType === 'mesic' && selectedMonths.length > 0) {
      data = data.filter(entry => {
        const cwKey = entry.cw.includes('-2026')
          ? entry.cw.replace('-', '_')
          : entry.cw.split('-')[0];
        const weekMapping = getWeekMapping(cwKey);
        if (!weekMapping) return false;
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
      const weekMapping = getWeekMapping(cwKey);
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
      } else if (project.project_type === 'Hodinovka' && project.hourly_rate) {
        hourlyRate = project.hourly_rate;
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
        // Inicializace měsíce a projektu v měsíci (pokud měsíc není v seznamu, přeskočit)
        if (!monthlyData[month]) return;
        if (!monthlyData[month][entry.projekt]) {
          monthlyData[month][entry.projekt] = 0;
        }

        // Koeficient pravděpodobnosti pro presales projekty
        let probabilityCoefficient = 1;
        if (project.project_status === 'Pre sales' && project.probability) {
          probabilityCoefficient = project.probability / 100;
        }

        // Revenue = hodiny * sazba * poměr týdne * pravděpodobnost
        const monthlyRevenue = entry.mhTyden * hourlyRate * (ratio as number) * probabilityCoefficient;
        monthlyData[month][entry.projekt] += monthlyRevenue;
      });
    });

    // Přidáme presales projekty, které nemají plánovaná data, ale mají definované období
    projects.forEach(project => {
      if (project.project_status === 'Pre sales' && 
          project.presales_start_date && 
          project.presales_end_date &&
          project.budget &&
          (project.project_type === 'WP' ? project.average_hourly_rate : project.hourly_rate)) {
        
        // Zkontrolujeme, zda projekt už není zahrnut v plánovaných datech
        const hasPlannedData = data.some(entry => entry.projekt === project.code);
        if (hasPlannedData) return;

        const startDate = new Date(project.presales_start_date);
        const endDate = new Date(project.presales_end_date);
        
        // Určíme hodinovou sazbu
        let hourlyRate = 0;
        if (project.project_type === 'WP' && project.average_hourly_rate) {
          hourlyRate = project.average_hourly_rate;
        } else if (project.project_type === 'Hodinovka' && project.hourly_rate) {
          hourlyRate = project.hourly_rate;
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
            totalWorkingDays += getWorkingDaysForMonthKey(monthName);
          }
          
          current.setMonth(current.getMonth() + 1);
        }

        if (totalWorkingDays === 0) return;

        // Rozdělíme revenue poměrně mezi měsíce
        monthsInPeriod.forEach(monthName => {
          const workingDaysInMonth = getWorkingDaysForMonthKey(monthName);
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

  // Výpočet hodin po měsících (bez násobení sazbou)
  const calculateMonthlyHoursByProject = (data = filteredData) => {
    const monthlyData: { [month: string]: { [projectCode: string]: number } } = {};
    const months = [
      'říjen_2025', 'listopad_2025', 'prosinec_2025',
      'leden_2026', 'únor_2026', 'březen_2026', 'duben_2026', 'květen_2026', 'červen_2026',
      'červenec_2026', 'srpen_2026', 'září_2026', 'říjen_2026', 'listopad_2026', 'prosinec_2026'
    ];
    months.forEach(month => { monthlyData[month] = {}; });

    const nonRevenueActivities = ['FREE', 'Dovolena', 'DOVOLENÁ', 'Nemoc', 'NEMOC', 'Školení', 'ŠKOLENÍ', 'Interní', 'INTERNÍ'];

    data.forEach(entry => {
      const cwKey = entry.cw.includes('-2026') ? entry.cw.replace('-', '_') : entry.cw.split('-')[0];
      const weekMapping = getWeekMapping(cwKey);
      if (!weekMapping || entry.mhTyden === 0) return;
      if (entry.is_tentative === true) return;
      const projektTrimmed = entry.projekt?.trim();
      if (nonRevenueActivities.some(activity => activity.toLowerCase() === projektTrimmed?.toLowerCase())) return;
      const project = projects.find(p => p.code === entry.projekt);
      if (!project) return;

      // Pro hodiny stále potřebujeme, aby projekt měl sazbu (aby se zobrazoval ve výpočtu)
      let hourlyRate = 0;
      if (project.project_type === 'WP' && project.average_hourly_rate) hourlyRate = project.average_hourly_rate;
      else if (project.project_type === 'Hodinovka' && project.hourly_rate) hourlyRate = project.hourly_rate;
      if (hourlyRate === 0) return;

      Object.entries(weekMapping).forEach(([month, ratio]) => {
        if (!monthlyData[month]) return;
        if (!monthlyData[month][entry.projekt]) monthlyData[month][entry.projekt] = 0;
        let probabilityCoefficient = 1;
        if (project.project_status === 'Pre sales' && project.probability) probabilityCoefficient = project.probability / 100;
        // Hodiny = raw hodiny * poměr týdne * pravděpodobnost (BEZ holiday koeficientu — sjednoceno s maticí)
        monthlyData[month][entry.projekt] += entry.mhTyden * (ratio as number) * probabilityCoefficient;
      });
    });

    // Presales projekty bez plánovaných dat
    projects.forEach(project => {
      if (project.project_status === 'Pre sales' && project.presales_start_date && project.presales_end_date && project.budget &&
          (project.project_type === 'WP' ? project.average_hourly_rate : project.hourly_rate)) {
        const hasPlannedData = data.some(entry => entry.projekt === project.code);
        if (hasPlannedData) return;
        const startDate = new Date(project.presales_start_date);
        const endDate = new Date(project.presales_end_date);
        const totalHours = project.project_type === 'WP' ? project.budget : 100;
        const probabilityCoefficient = project.probability ? project.probability / 100 : 0.5;
        const numberToMonth: { [key: string]: string } = {
          '10_2025': 'říjen_2025', '11_2025': 'listopad_2025', '12_2025': 'prosinec_2025',
          '1_2026': 'leden_2026', '2_2026': 'únor_2026', '3_2026': 'březen_2026', '4_2026': 'duben_2026', '5_2026': 'květen_2026', '6_2026': 'červen_2026',
          '7_2026': 'červenec_2026', '8_2026': 'srpen_2026', '9_2026': 'září_2026', '10_2026': 'říjen_2026', '11_2026': 'listopad_2026', '12_2026': 'prosinec_2026'
        };
        let totalWD = 0;
        const monthsInPeriod: string[] = [];
        const current = new Date(startDate);
        while (current <= endDate) {
          const monthKey = `${current.getMonth() + 1}_${current.getFullYear()}`;
          const monthName = numberToMonth[monthKey];
          if (monthName && !monthsInPeriod.includes(monthName)) {
            monthsInPeriod.push(monthName);
            totalWD += getWorkingDaysForMonthKey(monthName);
          }
          current.setMonth(current.getMonth() + 1);
        }
        if (totalWD === 0) return;
        monthsInPeriod.forEach(monthName => {
          const wd = getWorkingDaysForMonthKey(monthName);
          const monthHours = totalHours * (wd / totalWD) * probabilityCoefficient;
          if (!monthlyData[monthName][project.code]) monthlyData[monthName][project.code] = 0;
          monthlyData[monthName][project.code] += monthHours;
        });
      }
    });

    return monthlyData;
  };

  const monthlyRevenueByProject = calculateMonthlyRevenueByProject();
  const monthlyHoursByProject = calculateMonthlyHoursByProject();
  const rawActiveData = displayUnit === 'kc' ? monthlyRevenueByProject : monthlyHoursByProject;
  // Apply per-month correction coefficient
  const activeData = useMemo(() => {
    const result: { [month: string]: { [projectCode: string]: number } } = {};
    Object.entries(rawActiveData).forEach(([month, projData]) => {
      const c = getCoeff(month);
      result[month] = {};
      Object.entries(projData).forEach(([code, value]) => {
        result[month][code] = (value as number) * c;
      });
    });
    return result;
  }, [rawActiveData, monthCoefficients]);
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
  Object.values(activeData).forEach(monthData => {
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
      const monthData = activeData[month] || {};
      return sum + filteredProjectList.reduce((monthSum, projectCode) => monthSum + (monthData[projectCode] || 0), 0);
    }, 0);
  }, [months, activeData, filteredProjectList]);

  // Data pro stackovaný graf
  const chartData = useMemo(() => {
    if (viewType === 'kvartal') {
      // Kvartální data
      const quarterData = [
        {
          quarter: 'Q3 FY25-26',
          months: ['říjen_2025', 'listopad_2025', 'prosinec_2025'],
          label: 'Q3 FY26'
        },
        {
          quarter: 'Q4 FY25-26',
          months: ['leden_2026', 'únor_2026', 'březen_2026'],
          label: 'Q4 FY26'
        },
        {
          quarter: 'Q1 FY26-27',
          months: ['duben_2026', 'květen_2026', 'červen_2026'],
          label: 'Q1 FY27'
        },
        {
          quarter: 'Q2 FY26-27',
          months: ['červenec_2026', 'srpen_2026', 'září_2026'],
          label: 'Q2 FY27'
        },
        {
          quarter: 'Q3 FY26-27',
          months: ['říjen_2026', 'listopad_2026', 'prosinec_2026'],
          label: 'Q3 FY27'
        }
      ];

      return quarterData.map(({ quarter, months, label }) => {
        const data: any = {
          month: label,
          total: 0
        };
        
        // Sečteme data za všechny měsíce v kvartálu (pouze filtrované projekty)
        months.forEach(month => {
          const monthData = activeData[month] || {};
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
        const monthData = activeData[month] || {};
        // Lepší zkracování názvu měsíce pro graf
        const monthLabels: { [key: string]: string } = {
          'říjen_2025': 'Oct 25', 'listopad_2025': 'Nov 25', 'prosinec_2025': 'Dec 25',
          'leden_2026': 'Jan 26', 'únor_2026': 'Feb 26', 'březen_2026': 'Mar 26',
          'duben_2026': 'Apr 26', 'květen_2026': 'May 26', 'červen_2026': 'Jun 26',
          'červenec_2026': 'Jul 26', 'srpen_2026': 'Aug 26', 'září_2026': 'Sep 26',
          'říjen_2026': 'Oct 26', 'listopad_2026': 'Nov 26', 'prosinec_2026': 'Dec 26'
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
  }, [activeData, filteredProjectList, viewType, months]);

  // Možnosti pro filtrování
  const getFilterOptions = () => {
    switch (filterType) {
      case 'customer':
        return customers.map(c => ({ value: c.id, label: c.name }));
      case 'program':
        return programs.map(p => ({ value: p.id, label: p.name }));
      case 'project':
        return projects.filter(p => (p.project_type === 'WP' && p.average_hourly_rate) || (p.project_type === 'Hodinovka' && p.hourly_rate)).map(p => ({ value: p.id, label: p.name }));
      default:
        return [];
    }
  };

  // Možnosti pro kvartální filtr
  const getQuarterOptions = () => [
    { value: 'Q3-FY26', label: 'Q3 FY25-26 (Oct-Dec 2025)' },
    { value: 'Q4-FY26', label: 'Q4 FY25-26 (Jan-Mar 2026)' },
    { value: 'Q1-FY27', label: 'Q1 FY26-27 (Apr-Jun 2026)' },
    { value: 'Q2-FY27', label: 'Q2 FY26-27 (Jul-Sep 2026)' },
    { value: 'Q3-FY27', label: 'Q3 FY26-27 (Oct-Dec 2026)' }
  ];

  // Month filter options
  const getMonthOptions = () => [
    { value: 'říjen_2025', label: 'October 2025' },
    { value: 'listopad_2025', label: 'November 2025' },
    { value: 'prosinec_2025', label: 'December 2025' },
    { value: 'leden_2026', label: 'January 2026' },
    { value: 'únor_2026', label: 'February 2026' },
    { value: 'březen_2026', label: 'March 2026' },
    { value: 'duben_2026', label: 'April 2026' },
    { value: 'květen_2026', label: 'May 2026' },
    { value: 'červen_2026', label: 'June 2026' },
    { value: 'červenec_2026', label: 'July 2026' },
    { value: 'srpen_2026', label: 'August 2026' },
    { value: 'září_2026', label: 'September 2026' },
    { value: 'říjen_2026', label: 'October 2026' },
    { value: 'listopad_2026', label: 'November 2026' },
    { value: 'prosinec_2026', label: 'December 2026' }
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
      setSelectedQuarters(['Q3-FY26', 'Q4-FY26', 'Q1-FY27', 'Q2-FY27', 'Q3-FY27']);
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
        <div className="text-center py-8">Loading data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-card-custom">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue - Monthly Turnover
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtry */}
          <div className="space-y-4 mb-6 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <Label className="font-medium text-sm">Filter by:</Label>
              </div>
              <Button variant="ghost" size="sm" onClick={() => loadData()} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh data
              </Button>
            </div>
            
            {/* Kompaktní řádek s hlavními filtry */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[120px]">
                <Label htmlFor="viewType" className="text-xs text-muted-foreground">View</Label>
                <Select value={viewType} onValueChange={handleViewTypeChange}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="mesic">Monthly</SelectItem>
                    <SelectItem value="kvartal">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[130px]">
                <Label htmlFor="filterType" className="text-xs text-muted-foreground">Filter type</Label>
                <Select value={filterType} onValueChange={handleFilterTypeChange}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="program">Program</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filterType !== 'all' && filterType !== 'program' && (
                <div className="min-w-[150px]">
                  <Label htmlFor="filterValue" className="text-xs text-muted-foreground">Value</Label>
                  <Select value={filterValue} onValueChange={setFilterValue}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      <SelectItem value="all">All</SelectItem>
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
                <Label htmlFor="displayUnit" className="text-xs text-muted-foreground">Units</Label>
                <Select value={displayUnit} onValueChange={(value: 'kc' | 'hodiny') => setDisplayUnit(value)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="kc">Currency</SelectItem>
                    <SelectItem value="hodiny">Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {displayUnit === 'kc' && (
                <div className="min-w-[100px]">
                  <Label htmlFor="currency" className="text-xs text-muted-foreground">Currency</Label>
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
              )}

              <div className="min-w-[130px]">
                <Label htmlFor="projectStatus" className="text-xs text-muted-foreground">Project status</Label>
                <Select value={projectStatusFilter} onValueChange={(value: 'all' | 'realizace' | 'presales' | 'P0' | 'P1' | 'P2' | 'P3') => setProjectStatusFilter(value)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="all">PreSales + Delivery</SelectItem>
                    <SelectItem value="realizace">Delivery</SelectItem>
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
                  <Label className="text-xs text-muted-foreground">Quarters</Label>
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
                  <Label className="text-xs text-muted-foreground">Months</Label>
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
                  <Label className="text-xs text-muted-foreground">Programs</Label>
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

            {/* Correction coefficients per month */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs text-muted-foreground">
                  Correction coefficient per month (multiplies the value, default 1.0)
                </Label>
                {Object.keys(monthCoefficients).length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => {
                      setMonthCoefficients({});
                      try { localStorage.removeItem('revenueMonthCoefficients'); } catch {}
                    }}
                  >
                    Reset all
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-2 p-2 border rounded-md bg-background/50">
                {(viewType === 'mesic' ? selectedMonths : months).map(month => {
                  const shortMap: Record<string, string> = {
                    'leden': 'Jan', 'únor': 'Feb', 'březen': 'Mar', 'duben': 'Apr',
                    'květen': 'May', 'červen': 'Jun', 'červenec': 'Jul', 'srpen': 'Aug',
                    'září': 'Sep', 'říjen': 'Oct', 'listopad': 'Nov', 'prosinec': 'Dec'
                  };
                  const [cz, yr] = month.split('_');
                  const label = `${shortMap[cz] || cz} ${yr.slice(2)}`;
                  const val = monthCoefficients[month];
                  return (
                    <div key={month} className="flex flex-col">
                      <Label className="text-[10px] text-muted-foreground">{label}</Label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="1.00"
                        value={val ?? ''}
                        onChange={(e) => handleCoeffChange(month, e.target.value)}
                        className="h-7 text-xs px-2 rounded border bg-background"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

           {/* Celkový obrat */}
           <div className="mb-6">
              <div className="text-2xl font-bold text-primary">
                {displayUnit === 'kc' ? 'Total revenue' : 'Total hours'}: {formatValue(totalRevenue)}
             </div>
             <p className="text-sm text-muted-foreground mt-1">
               {filterType === 'program' && selectedPrograms.length > 0
                 ? `Filtered by programs: ${selectedPrograms.map(id => programs.find(p => p.id === id)?.name).join(', ')}`
                 : filterType !== 'all' && filterValue !== 'all'
                 ? `Filtered by: ${
                     filterType === 'customer' ? 'customer' :
                     filterType === 'project' ? 'project' :
                     'program'
                   }`
                 : 'All projects with revenue'
                 } | View: {viewType === 'mesic' ? 'Monthly' : 'Quarterly'}
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
                    if (displayUnit === 'hodiny') {
                      if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k h`;
                      return `${Math.round(value)} h`;
                    }
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
                          {viewType === 'kvartal' ? 'Quarter' : 'Month'}: {props.label}
                        </p>
                        
                        {/* Realizace sekce */}
                        {realizaceItems.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">
                              DELIVERY ({formatValue(realizaceSum)})
                            </p>
                            <div className="space-y-0.5 pl-2">
                              {realizaceItems.map(item => {
                                const projectIndex = filteredProjectList.indexOf(item.code);
                                const color = getProjectColorWithIndex(item.code, projectIndex);
                                return (
                                  <div key={item.code} className="flex justify-between text-sm gap-4 items-center">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span 
                                        className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0" 
                                        style={{ backgroundColor: color }}
                                      />
                                      <span className="truncate">{item.code}</span>
                                    </div>
                                    <span className="font-mono text-right flex-shrink-0">{formatValue(item.value)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Presales sekce */}
                        {presalesItems.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">
                              PRESALES ({formatValue(presalesSum)})
                            </p>
                            <div className="space-y-0.5 pl-2">
                              {presalesItems.map(item => {
                                const projectIndex = filteredProjectList.indexOf(item.code);
                                const color = getProjectColorWithIndex(item.code, projectIndex);
                                return (
                                  <div key={item.code} className="flex justify-between text-sm gap-4 items-center">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span 
                                        className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0" 
                                        style={{ backgroundColor: color, opacity: 0.7 }}
                                      />
                                      <span className="truncate">
                                        {item.code}
                                        {item.probability && (
                                          <span className="text-xs text-muted-foreground ml-1">
                                            ({item.probability}%)
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                    <span className="font-mono text-right flex-shrink-0">{formatValue(item.value)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Celkem */}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between font-semibold">
                            <span>Total:</span>
                            <span>{formatValue(total)}</span>
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
          <CardTitle>Detailed breakdown by project</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Project</TableHead>
                   {months.map(month => {
                    const shortMap: Record<string, string> = {
                      'leden': 'Jan', 'únor': 'Feb', 'březen': 'Mar', 'duben': 'Apr',
                      'květen': 'May', 'červen': 'Jun', 'červenec': 'Jul', 'srpen': 'Aug',
                      'září': 'Sep', 'říjen': 'Oct', 'listopad': 'Nov', 'prosinec': 'Dec'
                    };
                    const [czName, year] = month.split('_');
                    const monthDisplay = `${shortMap[czName] || czName} ${year.slice(2)}`;
                    return (
                      <TableHead key={month} className="text-right font-bold min-w-[120px]">
                        {monthDisplay}
                      </TableHead>
                    );
                  })}
                  <TableHead className="text-right font-bold">Total</TableHead>
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
                    const totalA = Object.values(activeData).reduce((sum, monthData) => 
                      sum + (monthData[a] || 0), 0);
                    const totalB = Object.values(activeData).reduce((sum, monthData) => 
                      sum + (monthData[b] || 0), 0);
                    return totalB - totalA;
                  })
                  .map((projectCode, index) => {
                    const project = projects.find(p => p.code === projectCode);
                    const isPresales = project?.project_status === 'Pre sales';
                    const projectTotal = Object.values(activeData).reduce((sum, monthData) => 
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
                                  {project.presales_phase} • {project.probability}% probability
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                         {months.map(month => {
                           const revenue = activeData[month]?.[projectCode] || 0;
                           return (
                             <TableCell key={month} className={`text-right font-mono ${isPresales ? 'text-muted-foreground' : ''}`}>
                               {revenue > 0 ? formatValue(revenue) : '-'}
                             </TableCell>
                           );
                         })}
                         <TableCell className={`text-right font-mono font-bold ${isPresales ? 'text-muted-foreground' : ''}`}>
                           {formatValue(projectTotal)}
                         </TableCell>
                      </TableRow>
                    );
                  })
                  .filter(Boolean)}
                
                {/* Celkový řádek */}
                <TableRow className="font-bold border-t-2">
                  <TableCell className="font-bold">TOTAL</TableCell>
                   {months.map(month => {
                     const monthData = activeData[month] || {};
                     const monthTotal = filteredProjectList.reduce((sum: number, projectCode) => sum + (monthData[projectCode] || 0), 0);
                     return (
                       <TableCell key={month} className="text-right font-mono font-bold">
                         {formatValue(monthTotal)}
                       </TableCell>
                     );
                   })}
                   <TableCell className="text-right font-mono font-bold text-primary">
                     {formatValue(totalRevenue)}
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