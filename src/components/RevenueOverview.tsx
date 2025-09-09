import React, { useState, useMemo, useEffect } from 'react';
import { usePlanning } from '@/contexts/PlanningContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

export const RevenueOverview = () => {
  const { planningData } = usePlanning();
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'program' | 'project'>('all');
  const [filterValue, setFilterValue] = useState<string>('all');
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [viewType, setViewType] = useState<'mesic' | 'kvartal'>('mesic');
  const [selectedQuarters, setSelectedQuarters] = useState<string[]>(['Q3-2025', 'Q4-2025', 'Q1-2026', 'Q2-2026']);
  const [projects, setProjects] = useState<DatabaseProject[]>([]);
  const [customers, setCustomers] = useState<DatabaseCustomer[]>([]);
  const [programs, setPrograms] = useState<DatabaseProgram[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Funkce pro výpočet počtu dnů v měsíci
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

  // Funkce pro výpočet pracovních dnů v měsíci (5 dnů v týdnu) pro roky 2025-2026
  const getWorkingDaysInMonth = (month: string): number => {
    // Přesný počet pracovních dnů pro roky 2025-2026
    const workingDays: { [key: string]: number } = {
      'srpen': 21,      // srpen 2025
      'září': 22,       // září 2025  
      'říjen': 23,      // říjen 2025
      'listopad': 20,   // listopad 2025
      'prosinec': 22,   // prosinec 2025
      'leden': 22,      // leden 2026
      'únor': 20,       // únor 2026
      'březen': 21,     // březen 2026
      'duben': 22,      // duben 2026
      'květen': 21,     // květen 2026
      'červen': 21      // červen 2026
    };
    return workingDays[month] || 22;
  };

  // Přesnější mapování týdnů na měsíce s poměrným rozdělením pro roky 2025-2026
  const weekToMonthMapping: { [key: string]: { [month: string]: number } } = {
    // Rok 2025 (CW32-52)
    'CW32': { 'srpen': 1.0 },           // 4-10 srpna 2025 (celý týden)
    'CW33': { 'srpen': 1.0 },           // 11-17 srpna 2025 (celý týden)  
    'CW34': { 'srpen': 1.0 },           // 18-24 srpna 2025 (celý týden)
    'CW35': { 'srpen': 0.6, 'září': 0.4 },  // 25-31 srpna 2025 (3:2 dny)
    'CW36': { 'září': 1.0 },        // 1-7 září 2025 (celý týden)
    'CW37': { 'září': 1.0 },        // 8-14 září 2025 (celý týden)
    'CW38': { 'září': 1.0 },        // 15-21 září 2025 (celý týden)
    'CW39': { 'září': 1.0 },        // 22-28 září 2025 (celý týden)
    'CW40': { 'září': 0.4, 'říjen': 0.6 },   // 29 září - 5 října 2025 (2:3 dny)
    'CW41': { 'říjen': 1.0 },          // 6-12 října 2025 (celý týden)
    'CW42': { 'říjen': 1.0 },          // 13-19 října 2025 (celý týden)
    'CW43': { 'říjen': 1.0 },          // 20-26 října 2025 (celý týden)
    'CW44': { 'říjen': 0.8, 'listopad': 0.2 },    // 27 října - 2 listopadu 2025 (4:1 dny)
    'CW45': { 'listopad': 1.0 },         // 3-9 listopadu 2025 (celý týden)
    'CW46': { 'listopad': 1.0 },         // 10-16 listopadu 2025 (celý týden)
    'CW47': { 'listopad': 1.0 },         // 17-23 listopadu 2025 (celý týden)
    'CW48': { 'listopad': 0.6, 'prosinec': 0.4 },   // 24-30 listopadu 2025 (3:2 dny)
    'CW49': { 'prosinec': 1.0 },         // 1-7 prosince 2025 (celý týden)
    'CW50': { 'prosinec': 1.0 },         // 8-14 prosince 2025 (celý týden)
    'CW51': { 'prosinec': 1.0 },         // 15-21 prosince 2025 (celý týden)
    'CW52': { 'prosinec': 1.0 },         // 22-28 prosince 2025 (celý týden)
    // Rok 2026 (CW01-26) - všichni budou FREE
    'CW01': { 'leden': 1.0 },            // 29 prosince 2025 - 4 ledna 2026 (celý týden)
    'CW02': { 'leden': 1.0 },            // 5-11 ledna 2026 (celý týden)
    'CW03': { 'leden': 1.0 },            // 12-18 ledna 2026 (celý týden)
    'CW04': { 'leden': 1.0 },            // 19-25 ledna 2026 (celý týden)
    'CW05': { 'leden': 0.8, 'únor': 0.2 },   // 26 ledna - 1 února 2026 (4:1 dny)
    'CW06': { 'únor': 1.0 },             // 2-8 února 2026 (celý týden)
    'CW07': { 'únor': 1.0 },             // 9-15 února 2026 (celý týden)
    'CW08': { 'únor': 1.0 },             // 16-22 února 2026 (celý týden)
    'CW09': { 'únor': 0.6, 'březen': 0.4 },  // 23 února - 1 března 2026 (3:2 dny)
    'CW10': { 'březen': 1.0 },           // 2-8 března 2026 (celý týden)
    'CW11': { 'březen': 1.0 },           // 9-15 března 2026 (celý týden)
    'CW12': { 'březen': 1.0 },           // 16-22 března 2026 (celý týden)
    'CW13': { 'březen': 1.0 },           // 23-29 března 2026 (celý týden)
    'CW14': { 'březen': 0.4, 'duben': 0.6 },     // 30 března - 5 dubna 2026 (2:3 dny)
    'CW15': { 'duben': 1.0 },            // 6-12 dubna 2026 (celý týden)
    'CW16': { 'duben': 1.0 },            // 13-19 dubna 2026 (celý týden)
    'CW17': { 'duben': 1.0 },            // 20-26 dubna 2026 (celý týden)
    'CW18': { 'duben': 0.6, 'květen': 0.4 },     // 27 dubna - 3 května 2026 (3:2 dny)
    'CW19': { 'květen': 1.0 },           // 4-10 května 2026 (celý týden)
    'CW20': { 'květen': 1.0 },           // 11-17 května 2026 (celý týden)
    'CW21': { 'květen': 1.0 },           // 18-24 května 2026 (celý týden)
    'CW22': { 'květen': 1.0 },           // 25-31 května 2026 (celý týden)
    'CW23': { 'květen': 0.2, 'červen': 0.8 },    // 1-7 června 2026 (1:4 dny)
    'CW24': { 'červen': 1.0 },           // 8-14 června 2026 (celý týden)
    'CW25': { 'červen': 1.0 },           // 15-21 června 2026 (celý týden)
    'CW26': { 'červen': 1.0 }            // 22-28 června 2026 (celý týden)
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
        'Q3-2025': ['srpen', 'září'],
        'Q4-2025': ['říjen', 'listopad', 'prosinec'],
        'Q1-2026': ['leden', 'únor', 'březen'],
        'Q2-2026': ['duben', 'květen', 'červen']
      };
      
      const allSelectedMonths = selectedQuarters.flatMap(quarter => quarterMonths[quarter] || []);
      data = data.filter(entry => allSelectedMonths.includes(entry.mesic));
    }

    return data;
  }, [planningData, filterType, filterValue, selectedPrograms, projects, viewType, selectedQuarters]);

  // Výpočet revenue po měsících s rozložením podle projektů a poměrným rozdělením týdnů
  const calculateMonthlyRevenueByProject = (data = filteredData) => {
    const monthlyData: { [month: string]: { [projectCode: string]: number } } = {};

    // Inicializace struktur pro všechny měsíce
    const months = ['srpen', 'září', 'říjen', 'listopad', 'prosinec', 'leden', 'únor', 'březen', 'duben', 'květen', 'červen'];
    months.forEach(month => {
      monthlyData[month] = {};
    });

    // Projdeme všechny záznamy v plánovacích datech
    data.forEach(entry => {
      const weekMapping = weekToMonthMapping[entry.cw];
      if (!weekMapping || entry.mhTyden === 0) return;

      // Najdeme projekt podle kódu
      const project = projects.find(p => p.code === entry.projekt);
      if (!project) return;

      let hourlyRate = 0;
      
      // Určíme hodinovou sazbu podle typu projektu z databáze
      // Pro WP projekty používáme average_hourly_rate
      // Pro Hodinovka projekty používáme budget jako hodinovou sazbu
      if (project.project_type === 'WP' && project.average_hourly_rate) {
        hourlyRate = project.average_hourly_rate;
      } else if (project.project_type === 'Hodinovka' && project.budget) {
        hourlyRate = project.budget;
      }

      // Pokud nemáme sazbu, přeskočíme
      if (hourlyRate === 0) return;

      // Rozdělíme týdenní výkon podle poměru dnů v měsících
      Object.entries(weekMapping).forEach(([month, ratio]) => {
        // Inicializace projektu v měsíci
        if (!monthlyData[month][entry.projekt]) {
          monthlyData[month][entry.projekt] = 0;
        }

        // Přičteme poměrnou část týdenního revenue k měsíčnímu součtu
        const monthlyRevenue = entry.mhTyden * hourlyRate * ratio;
        monthlyData[month][entry.projekt] += monthlyRevenue;
      });
    });

    return monthlyData;
  };

  const monthlyRevenueByProject = calculateMonthlyRevenueByProject();
  const months = ['srpen', 'září', 'říjen', 'listopad', 'prosinec', 'leden', 'únor', 'březen', 'duben', 'květen', 'červen'];
  
  // Získání všech unikátních projektů s revenue
  const allProjects = new Set<string>();
  Object.values(monthlyRevenueByProject).forEach(monthData => {
    Object.keys(monthData).forEach(projectCode => allProjects.add(projectCode));
  });
  const projectList = Array.from(allProjects);

  // Výpočet celkového revenue
  const totalRevenue = Object.values(monthlyRevenueByProject).reduce((sum, monthData) => {
    return sum + Object.values(monthData).reduce((monthSum, projectRevenue) => monthSum + projectRevenue, 0);
  }, 0);

  // Data pro stackovaný graf
  const chartData = useMemo(() => {
    if (viewType === 'kvartal') {
      // Kvartální data
      const quarterData = [
        {
          quarter: 'Q3 2025',
          months: ['srpen', 'září'],
          label: 'Q3 25'
        },
        {
          quarter: 'Q4 2025', 
          months: ['říjen', 'listopad', 'prosinec'],
          label: 'Q4 25'
        },
        {
          quarter: 'Q1 2026',
          months: ['leden', 'únor', 'březen'], 
          label: 'Q1 26'
        },
        {
          quarter: 'Q2 2026',
          months: ['duben', 'květen', 'červen'],
          label: 'Q2 26'
        }
      ];

      return quarterData.map(({ quarter, months, label }) => {
        const data: any = {
          month: label,
          total: 0
        };
        
        // Sečteme data za všechny měsíce v kvartálu
        months.forEach(month => {
          const monthData = monthlyRevenueByProject[month] || {};
          data.total += Object.values(monthData).reduce((sum: number, value: number) => sum + value, 0);
          
          // Přidáme data pro každý projekt
          projectList.forEach(projectCode => {
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
        const data: any = {
          month: month.slice(0, 3),
          total: Object.values(monthData).reduce((sum: number, value: number) => sum + value, 0)
        };
        
        // Přidáme data pro každý projekt
        projectList.forEach(projectCode => {
          data[projectCode] = monthData[projectCode] || 0;
        });
        
        return data;
      });
    }
  }, [monthlyRevenueByProject, projectList, viewType, months]);

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
    { value: 'Q3-2025', label: 'Q3 2025 (srpen-září)' },
    { value: 'Q4-2025', label: 'Q4 2025 (říjen-prosinec)' },
    { value: 'Q1-2026', label: 'Q1 2026 (leden-březen)' },
    { value: 'Q2-2026', label: 'Q2 2026 (duben-červen)' }
  ];

  const filterOptions = getFilterOptions();
  const quarterOptions = getQuarterOptions();

  // Reset filter value when filter type changes
  const handleFilterTypeChange = (value: string) => {
    setFilterType(value as any);
    setFilterValue('all');
    setSelectedPrograms([]);
  };

  // Handle view type change
  const handleViewTypeChange = (value: 'mesic' | 'kvartal') => {
    setViewType(value);
    // Reset to all quarters when switching to quarter view
    if (value === 'kvartal') {
      setSelectedQuarters(['Q3-2025', 'Q4-2025', 'Q1-2026', 'Q2-2026']);
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
          <div className="grid grid-cols-1 gap-4 mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Label className="font-medium">Filtrovat podle:</Label>
            </div>
            
            {/* Pohled (Měsíc/Kvartal) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="viewType">Pohled</Label>
                <Select value={viewType} onValueChange={handleViewTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="mesic">Měsíční</SelectItem>
                    <SelectItem value="kvartal">Kvartální</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Kvartální filtr */}
              {viewType === 'kvartal' && (
                <div>
                  <Label>Kvartály</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 p-3 border rounded-md bg-background max-h-32 overflow-y-auto">
                    {quarterOptions.map((quarter) => (
                      <div key={quarter.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`quarter-${quarter.value}`}
                          checked={selectedQuarters.includes(quarter.value)}
                          onChange={(e) => handleQuarterChange(quarter.value, e.target.checked)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label 
                          htmlFor={`quarter-${quarter.value}`} 
                          className="text-sm font-normal cursor-pointer"
                        >
                          {quarter.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Standardní filtry */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="filterType">Typ filtru</Label>
                <Select value={filterType} onValueChange={handleFilterTypeChange}>
                  <SelectTrigger>
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
              {filterType === 'program' ? (
                <div>
                  <Label>Programy</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 p-3 border rounded-md bg-background max-h-32 overflow-y-auto">
                    {programs.map((program) => (
                      <div key={program.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`program-${program.id}`}
                          checked={selectedPrograms.includes(program.id)}
                          onChange={(e) => handleProgramChange(program.id, e.target.checked)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label 
                          htmlFor={`program-${program.id}`} 
                          className="text-sm font-normal cursor-pointer"
                        >
                          {program.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ) : filterType !== 'all' && (
                <div>
                  <Label htmlFor="filterValue">Hodnota</Label>
                  <Select value={filterValue} onValueChange={setFilterValue}>
                    <SelectTrigger>
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
            </div>
          </div>

          {/* Celkový obrat */}
          <div className="mb-6">
            <div className="text-2xl font-bold text-primary">
              Celkový obrat: {totalRevenue.toLocaleString('cs-CZ')} Kč
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
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  cursor={false}
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString('cs-CZ')} Kč`, 
                    name === 'total' ? 'Celkem' : name
                  ]}
                  labelFormatter={(label) => `${viewType === 'kvartal' ? 'Kvartal' : 'Měsíc'}: ${label}`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                {projectList.map((projectCode, index) => (
                  <Bar 
                    key={projectCode}
                    dataKey={projectCode} 
                    stackId="revenue"
                    fill={getProjectColorWithIndex(projectCode, index)}
                    name={projectCode}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Celkové hodnoty pod grafem */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {viewType === 'kvartal' ? (
              [
                { key: 'Q3-2025', label: 'Q3 2025', months: ['srpen', 'září'] },
                { key: 'Q4-2025', label: 'Q4 2025', months: ['říjen', 'listopad', 'prosinec'] },
                { key: 'Q1-2026', label: 'Q1 2026', months: ['leden', 'únor', 'březen'] },
                { key: 'Q2-2026', label: 'Q2 2026', months: ['duben', 'květen', 'červen'] }
              ].map(({ key, label, months }) => {
                const quarterTotal = months.reduce((sum, month) => {
                  const monthData = monthlyRevenueByProject[month] || {};
                  return sum + Object.values(monthData).reduce((monthSum: number, value: number) => monthSum + value, 0);
                }, 0);
                
                const monthBreakdown = months.map(month => {
                  const monthData = monthlyRevenueByProject[month] || {};
                  const monthTotal = Object.values(monthData).reduce((sum: number, value: number) => sum + value, 0);
                  return `${month.slice(0, 3)}: ${monthTotal.toLocaleString('cs-CZ', { maximumFractionDigits: 0 })}`;
                }).join(' + ');
                
                return (
                  <div key={key} className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      {label}
                    </div>
                    <div className="text-lg font-bold mb-1">
                      {quarterTotal.toLocaleString('cs-CZ', { maximumFractionDigits: 0 })} Kč
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ({monthBreakdown})
                    </div>
                  </div>
                );
              })
            ) : (
              months.map((month) => {
                const monthData = monthlyRevenueByProject[month] || {};
                const monthTotal = Object.values(monthData).reduce((sum: number, value: number) => sum + value, 0);
                return (
                  <div key={month} className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground">
                      {month.slice(0, 3)}
                    </div>
                    <div className="text-lg font-bold">
                      {monthTotal.toLocaleString('cs-CZ', { maximumFractionDigits: 0 })} Kč
                    </div>
                  </div>
                );
              })  
            )}
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
                  {months.map(month => (
                    <TableHead key={month} className="text-right font-bold min-w-[120px]">
                      {month}
                    </TableHead>
                  ))}
                  <TableHead className="text-right font-bold">Celkem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectList
                  .sort((a, b) => {
                    // Seřadíme podle celkové revenue (sestupně)
                    const totalA = Object.values(monthlyRevenueByProject).reduce((sum, monthData) => 
                      sum + (monthData[a] || 0), 0);
                    const totalB = Object.values(monthlyRevenueByProject).reduce((sum, monthData) => 
                      sum + (monthData[b] || 0), 0);
                    return totalB - totalA;
                  })
                  .map((projectCode, index) => {
                    const projectTotal = Object.values(monthlyRevenueByProject).reduce((sum, monthData) => 
                      sum + (monthData[projectCode] || 0), 0);
                    
                    if (projectTotal === 0) return null;

                    return (
                      <TableRow key={projectCode}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded" 
                              style={{ backgroundColor: getProjectColorWithIndex(projectCode, index) }}
                            />
                            {projectCode}
                          </div>
                        </TableCell>
                        {months.map(month => {
                          const revenue = monthlyRevenueByProject[month]?.[projectCode] || 0;
                          return (
                            <TableCell key={month} className="text-right font-mono">
                              {revenue > 0 ? `${revenue.toLocaleString('cs-CZ')} Kč` : '-'}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-right font-mono font-bold">
                          {projectTotal.toLocaleString('cs-CZ')} Kč
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
                    const monthTotal = Object.values(monthData).reduce((sum: number, value: number) => sum + value, 0);
                    return (
                      <TableCell key={month} className="text-right font-mono font-bold">
                        {monthTotal.toLocaleString('cs-CZ')} Kč
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right font-mono font-bold text-primary">
                    {totalRevenue.toLocaleString('cs-CZ')} Kč
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