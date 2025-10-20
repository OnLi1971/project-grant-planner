import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronDown, Filter } from 'lucide-react';
import { usePlanning } from '@/contexts/PlanningContext';
import { customers, projectManagers, programs, projects } from '@/data/projectsData';
import { getWeek } from 'date-fns';
import { normalizeName, createNameMapping } from '@/utils/nameNormalization';

// Company mappings
const spolocnosti = [
  'Všichni',
  'MB Idea',
  'AERTEC',
  'TM-CZ'
];

// Mapping engineers to companies
const engineerCompanyMapping: { [key: string]: string } = {
  // MB Idea
  'bohusik martin': 'MB Idea',
  'chrenko daniel': 'MB Idea',
  'chrenko peter': 'MB Idea',
  'pupava marian': 'MB Idea',
  'jurcisin peter': 'MB Idea',
  // AERTEC
  'ivan bellamy': 'AERTEC',
  'jose carreras': 'AERTEC',
  'marta lopez': 'AERTEC',
  // All others default to TM-CZ
};

const getEngineerCompany = (engineerName: string): string => {
  const normalized = normalizeName(engineerName);
  return engineerCompanyMapping[normalized] || 'TM-CZ';
};



// Funkce pro výpočet aktuálního kalendářního týdne
const getCurrentWeek = (): number => {
  return getWeek(new Date(), { weekStartsOn: 1 });
};

// Funkce pro generování týdnů od aktuálního týdne do konce roku
const getAllWeeks = (): string[] => {
  const currentWeek = getCurrentWeek();
  const startWeek = Math.max(32, currentWeek); // Začneme od aktuálního týdne, ale minimálně od CW32
  
  const weeks = [];
  // CW32-52 pro rok 2025
  for (let cw = startWeek; cw <= 52; cw++) {
    weeks.push(`CW${cw.toString().padStart(2, '0')}-2025`);
  }
  // CW01-52 pro rok 2026 - opraveno na celý rok
  for (let cw = 1; cw <= 52; cw++) {
    weeks.push(`CW${cw.toString().padStart(2, '0')}-2026`);
  }
  return weeks;
};

const weeks = getAllWeeks();

const months = [
  { name: 'srpen 2025', weeks: ['CW32-2025', 'CW33-2025', 'CW34-2025', 'CW35-2025'] },
  { name: 'září 2025', weeks: ['CW36-2025', 'CW37-2025', 'CW38-2025', 'CW39-2025'] },
  { name: 'říjen 2025', weeks: ['CW40-2025', 'CW41-2025', 'CW42-2025', 'CW43-2025', 'CW44-2025'] },
  { name: 'listopad 2025', weeks: ['CW45-2025', 'CW46-2025', 'CW47-2025', 'CW48-2025'] },
  { name: 'prosinec 2025', weeks: ['CW49-2025', 'CW50-2025', 'CW51-2025', 'CW52-2025'] },
  { name: 'leden 2026', weeks: ['CW01-2026', 'CW02-2026', 'CW03-2026', 'CW04-2026', 'CW05-2026'] },
  { name: 'únor 2026', weeks: ['CW06-2026', 'CW07-2026', 'CW08-2026', 'CW09-2026'] },
  { name: 'březen 2026', weeks: ['CW10-2026', 'CW11-2026', 'CW12-2026', 'CW13-2026', 'CW14-2026'] },
  { name: 'duben 2026', weeks: ['CW15-2026', 'CW16-2026', 'CW17-2026', 'CW18-2026'] },
  { name: 'květen 2026', weeks: ['CW19-2026', 'CW20-2026', 'CW21-2026', 'CW22-2026', 'CW23-2026'] },
  { name: 'červen 2026', weeks: ['CW24-2026', 'CW25-2026', 'CW26-2026'] },
  { name: 'červenec 2026', weeks: ['CW27-2026', 'CW28-2026', 'CW29-2026', 'CW30-2026'] },
  { name: 'srpen 2026', weeks: ['CW31-2026', 'CW32-2026', 'CW33-2026', 'CW34-2026', 'CW35-2026'] },
  { name: 'září 2026', weeks: ['CW36-2026', 'CW37-2026', 'CW38-2026', 'CW39-2026'] },
  { name: 'říjen 2026', weeks: ['CW40-2026', 'CW41-2026', 'CW42-2026', 'CW43-2026', 'CW44-2026'] },
  { name: 'listopad 2026', weeks: ['CW45-2026', 'CW46-2026', 'CW47-2026', 'CW48-2026'] },
  { name: 'prosinec 2026', weeks: ['CW49-2026', 'CW50-2026', 'CW51-2026', 'CW52-2026'] }
].map(month => ({
  ...month,
  weeks: month.weeks.filter(week => weeks.includes(week))
})).filter(month => month.weeks.length > 0);

const getProjectBadgeStyle = (projekt: string) => {
  // Free, vacation, sick leave and overtime
  if (projekt === 'FREE') return 'bg-destructive/20 text-destructive border-destructive/30 font-semibold dark:bg-destructive/30 dark:text-destructive-foreground';
  if (projekt === 'DOVOLENÁ') return 'bg-success/30 text-success-foreground border-success dark:bg-success/40 dark:text-success-foreground';
  if (projekt === 'NEMOC') return 'bg-destructive/30 text-destructive-foreground border-destructive dark:bg-destructive/40 dark:text-destructive-foreground';  
  if (projekt === 'OVER') return 'bg-warning/30 text-warning-foreground border-warning dark:bg-warning/40 dark:text-warning-foreground';
  
  // ST projects - different shades of blue/primary
  if (projekt === 'ST_EMU_INT') return 'bg-blue-500 text-white border-blue-600';
  if (projekt === 'ST_TRAM_INT') return 'bg-blue-600 text-white border-blue-700';
  if (projekt === 'ST_MAINZ') return 'bg-blue-400 text-white border-blue-500';
  if (projekt === 'ST_KASSEL') return 'bg-blue-700 text-white border-blue-800';
  if (projekt === 'ST_BLAVA') return 'bg-cyan-500 text-white border-cyan-600';
  if (projekt === 'ST_FEM') return 'bg-blue-300 text-blue-900 border-blue-400';
  if (projekt === 'ST_POZAR') return 'bg-indigo-500 text-white border-indigo-600';
  if (projekt === 'ST_JIGS') return 'bg-sky-500 text-white border-sky-600';
  if (projekt === 'ST_TRAM_HS') return 'bg-blue-800 text-white border-blue-900';
  
  // NUVIA - green family
  if (projekt.startsWith('NU_')) return 'bg-green-600 text-white border-green-700';
  
  // WABTEC - orange family
  if (projekt.startsWith('WA_')) return 'bg-orange-500 text-white border-orange-600';
  
  // SAFRAN - purple family
  if (projekt.startsWith('SAF_')) return 'bg-purple-500 text-white border-purple-600';
  
  // BUCHER - brown family
  if (projekt.startsWith('BUCH_')) return 'bg-amber-700 text-white border-amber-800';
  
  // AIRBUS - teal family
  if (projekt.startsWith('AIRB_')) return 'bg-teal-600 text-white border-teal-700';
  
  // OVER (overtime) - yellow family
  if (projekt === 'OVER') return 'bg-yellow-500 text-yellow-900 border-yellow-600';
  
  // Default
  return 'bg-gray-500 text-white border-gray-600';
};

export const ProjectAssignmentMatrix = () => {
  const { planningData, engineers } = usePlanning();
  const [viewMode, setViewMode] = useState<'weeks' | 'months'>('weeks');
  const [filterSpolecnost, setFilterSpolecnost] = useState<string[]>(['Všichni']);
  const [filterPM, setFilterPM] = useState<string[]>(['Všichni']);
  const [filterZakaznik, setFilterZakaznik] = useState<string[]>(['Všichni']);
  const [filterProgram, setFilterProgram] = useState<string[]>(['Všichni']);
  const [weekFilters, setWeekFilters] = useState<{ [week: string]: string[] }>({});

  const displayNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    engineers.forEach(e => {
      map[normalizeName(e.display_name)] = e.display_name;
    });
    planningData.forEach(e => {
      const key = normalizeName(e.konstrukter);
      if (!map[key]) map[key] = e.konstrukter;
    });
    return map;
  }, [planningData, engineers]);

  // Dynamic project mappings based on projectsData
  const projektInfo = useMemo(() => {
    const info: { [key: string]: { zakaznik: string, pm: string, program: string } } = {};
    
    projects.forEach(project => {
      const customer = customers.find(c => c.id === project.customerId);
      const pm = projectManagers.find(p => p.id === project.projectManagerId);
      const program = programs.find(pr => pr.id === project.programId);
      
      info[project.code] = {
        zakaznik: customer?.name || 'N/A',
        pm: pm?.name || 'N/A',
        program: program?.code || 'N/A'
      };
    });
    
    return info;
  }, []);

  // Dynamic filter arrays based on projectsData
  const projektManagersList = useMemo(() => {
    const pmNames = projectManagers.map(pm => pm.name);
    return ['Všichni', ...pmNames];
  }, []);

  const zakazniciList = useMemo(() => {
    const customerNames = customers.map(c => c.name);
    return ['Všichni', ...customerNames];
  }, []);

  const programyList = useMemo(() => {
    const programCodes = programs.map(p => p.code);
    return ['Všichni', ...programCodes, 'N/A'];
  }, []);

  // Get unique projects for a specific week
  const getProjectsForWeek = (week: string): string[] => {
    const projects = new Set<string>();
    Object.keys(matrixData).forEach(engineer => {
      const project = matrixData[engineer][week];
      if (project) {
        projects.add(project);
      }
    });
    return ['Všechny', ...Array.from(projects).sort()];
  };

  // Toggle week filter
  const toggleWeekFilter = (week: string, project: string) => {
    setWeekFilters(prev => {
      const currentFilters = prev[week] || ['Všechny'];
      let newFilters: string[];
      
      if (project === 'Všechny') {
        newFilters = ['Všechny'];
      } else {
        const filtered = currentFilters.filter(p => p !== 'Všechny');
        if (filtered.includes(project)) {
          newFilters = filtered.filter(p => p !== project);
          if (newFilters.length === 0) newFilters = ['Všechny'];
        } else {
          newFilters = [...filtered, project];
        }
      }
      
      return { ...prev, [week]: newFilters };
    });
  };

  // Check if week filter is active
  const isWeekFilterActive = (week: string, project: string): boolean => {
    const filters = weekFilters[week] || ['Všechny'];
    return filters.includes(project) || (filters.includes('Všechny') && project === 'Všechny');
  };

  // Check if week has active filters
  const hasActiveWeekFilter = (week: string): boolean => {
    const filters = weekFilters[week];
    return filters && !filters.includes('Všechny') && filters.length > 0;
  };

// Create matrix data structure
  const matrixData = useMemo(() => {
    const engineerKeys = Array.from(new Set([
      ...engineers.map(e => normalizeName(e.display_name)),
      ...planningData.map(entry => normalizeName(entry.konstrukter))
    ]));
    const matrix: { [engineer: string]: { [week: string]: string } } = {};
    
    engineerKeys.forEach(engineerKey => {
      matrix[engineerKey] = {};
      weeks.forEach(week => {
        const entry = planningData.find(e => normalizeName(e.konstrukter) === engineerKey && e.cw === week);
        // Default to 'DOVOLENÁ' for CW52, otherwise 'FREE' if no entry exists
        matrix[engineerKey][week] = entry?.projekt || (week.includes('CW52') ? 'DOVOLENÁ' : 'FREE');
      });
    });
    
    return matrix;
  }, [planningData, engineers]);

// Create monthly aggregated data
  const monthlyData = useMemo(() => {
    const engineerKeys = Array.from(new Set([
      ...engineers.map(e => normalizeName(e.display_name)),
      ...planningData.map(entry => normalizeName(entry.konstrukter))
    ]));
    const monthlyMatrix: { [engineer: string]: { [month: string]: { projects: string[], totalHours: number, dominantProject: string } } } = {};
    
    engineerKeys.forEach(engineerKey => {
      monthlyMatrix[engineerKey] = {};
      months.forEach(month => {
        const monthProjects: { [project: string]: number } = {};
        let totalHours = 0;
        
        month.weeks.forEach(week => {
          const entry = planningData.find(e => normalizeName(e.konstrukter) === engineerKey && e.cw === week);
          let projekt: string;
          let hours: number;
          
          if (entry && entry.projekt) {
            projekt = entry.projekt;
            hours = typeof entry.mhTyden === 'number' ? entry.mhTyden : 0;
          } else {
            // Default values for weeks without entries
            projekt = week.includes('CW52') ? 'DOVOLENÁ' : 'FREE';
            hours = 36; // Default hours
          }
          
          monthProjects[projekt] = (monthProjects[projekt] || 0) + hours;
          totalHours += hours;
        });
        
        const projects = Object.keys(monthProjects);
        const dominantProject = projects.reduce((a, b) => 
          monthProjects[a] > monthProjects[b] ? a : b, projects[0] || ''
        );
        
        monthlyMatrix[engineerKey][month.name] = {
          projects,
          totalHours,
          dominantProject
        };
      });
    });
    
    return monthlyMatrix;
  }, [planningData]);

  // Get display data based on view mode
  const displayData = viewMode === 'weeks' ? matrixData : monthlyData;

  // Helper functions for multi-select
  const toggleFilterValue = (currentFilter: string[], value: string, setter: (value: string[]) => void) => {
    if (value === 'Všichni') {
      setter(['Všichni']);
    } else {
      const filteredArray = currentFilter.filter(item => item !== 'Všichni');
      if (filteredArray.includes(value)) {
        const newArray = filteredArray.filter(item => item !== value);
        setter(newArray.length === 0 ? ['Všichni'] : newArray);
      } else {
        setter([...filteredArray, value]);
      }
    }
  };

  const isFilterActive = (filter: string[], value: string) => {
    return filter.includes(value) || (filter.includes('Všichni') && value === 'Všichni');
  };

  const getFilterDisplayText = (filter: string[]) => {
    if (filter.includes('Všichni') || filter.length === 0) {
      return 'Všichni';
    }
    if (filter.length === 1) {
      return filter[0];
    }
    return `${filter.length} vybraných`;
  };

  // Filter engineers based on selected filters
  const filteredEngineers = useMemo(() => {
    let engineers = Object.keys(displayData);
    
    // Filter by company
    if (!filterSpolecnost.includes('Všichni')) {
      engineers = engineers.filter(engineer => {
        const displayName = displayNameMap[engineer] || engineer;
        const company = getEngineerCompany(displayName);
        return filterSpolecnost.includes(company);
      });
    }

    // Filter by week-specific filters
    if (viewMode === 'weeks') {
      // Check if any week has active filters
      const activeWeekFilters = Object.entries(weekFilters).filter(
        ([_, projects]) => !projects.includes('Všechny') && projects.length > 0
      );
      
      if (activeWeekFilters.length > 0) {
        engineers = engineers.filter(engineer => {
          // Engineer must match ALL active week filters (AND logic)
          return activeWeekFilters.every(([week, projects]) => {
            const engineerProject = matrixData[engineer][week];
            return projects.includes(engineerProject);
          });
        });
      }
    }
    
    if (viewMode === 'weeks') {
      // Filter by PM
      if (!filterPM.includes('Všichni')) {
        engineers = engineers.filter(engineer => {
          return weeks.some(week => {
            const project = matrixData[engineer][week];
            return projektInfo[project]?.pm && filterPM.includes(projektInfo[project].pm);
          });
        });
      }
      
      // Filter by customer
      if (!filterZakaznik.includes('Všichni')) {
        engineers = engineers.filter(engineer => {
          return weeks.some(week => {
            const project = matrixData[engineer][week];
            return projektInfo[project]?.zakaznik && filterZakaznik.includes(projektInfo[project].zakaznik);
          });
        });
      }
      
      // Filter by program
      if (!filterProgram.includes('Všichni')) {
        engineers = engineers.filter(engineer => {
          return weeks.some(week => {
            const project = matrixData[engineer][week];
            // Non-project states (FREE, DOVOLENÁ, NEMOC, OVER) are considered as N/A program
            const nonProjectStates = ['FREE', 'DOVOLENÁ', 'NEMOC', 'OVER'];
            if (nonProjectStates.includes(project)) {
              return filterProgram.includes('N/A');
            }
            return projektInfo[project]?.program && filterProgram.includes(projektInfo[project].program);
          });
        });
      }
    } else {
      // Monthly view filters
      if (!filterPM.includes('Všichni')) {
        engineers = engineers.filter(engineer => {
          return months.some(month => {
            const monthData = monthlyData[engineer][month.name];
            return monthData.projects.some(project => 
              projektInfo[project]?.pm && filterPM.includes(projektInfo[project].pm)
            );
          });
        });
      }
      
      if (!filterZakaznik.includes('Všichni')) {
        engineers = engineers.filter(engineer => {
          return months.some(month => {
            const monthData = monthlyData[engineer][month.name];
            return monthData.projects.some(project => 
              projektInfo[project]?.zakaznik && filterZakaznik.includes(projektInfo[project].zakaznik)
            );
          });
        });
      }
      
      if (!filterProgram.includes('Všichni')) {
        engineers = engineers.filter(engineer => {
          return months.some(month => {
            const monthData = monthlyData[engineer][month.name];
            return monthData.projects.some(project => {
              // Non-project states (FREE, DOVOLENÁ, NEMOC, OVER) are considered as N/A program
              const nonProjectStates = ['FREE', 'DOVOLENÁ', 'NEMOC', 'OVER'];
              if (nonProjectStates.includes(project)) {
                return filterProgram.includes('N/A');
              }
              return projektInfo[project]?.program && filterProgram.includes(projektInfo[project].program);
            });
          });
        });
      }
    }
    
    return engineers.sort();
  }, [displayData, matrixData, monthlyData, viewMode, filterSpolecnost, filterPM, filterZakaznik, filterProgram, weekFilters, displayNameMap]);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Matice plánování projektů</CardTitle>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Zobrazení:</label>
              <Select value={viewMode} onValueChange={(value: 'weeks' | 'months') => setViewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weeks">Týdny</SelectItem>
                  <SelectItem value="months">Měsíce</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Společnost</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {getFilterDisplayText(filterSpolecnost)}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-0" align="start">
                  <div className="p-2 max-h-64 overflow-y-auto">
                    {spolocnosti.map(spolecnost => (
                      <div key={spolecnost} className="flex items-center space-x-2 py-2 px-2 rounded hover:bg-muted/50">
                        <Checkbox
                          id={`company-${spolecnost}`}
                          checked={isFilterActive(filterSpolecnost, spolecnost)}
                          onCheckedChange={() => toggleFilterValue(filterSpolecnost, spolecnost, setFilterSpolecnost)}
                        />
                        <label htmlFor={`company-${spolecnost}`} className="text-sm cursor-pointer flex-1">
                          {spolecnost}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Project Manager</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {getFilterDisplayText(filterPM)}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-0" align="start">
                  <div className="p-2 max-h-64 overflow-y-auto">
                    {projektManagersList.map(pm => (
                      <div key={pm} className="flex items-center space-x-2 py-2 px-2 rounded hover:bg-muted/50">
                        <Checkbox
                          id={`pm-${pm}`}
                          checked={isFilterActive(filterPM, pm)}
                          onCheckedChange={() => toggleFilterValue(filterPM, pm, setFilterPM)}
                        />
                        <label htmlFor={`pm-${pm}`} className="text-sm cursor-pointer flex-1">
                          {pm}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Zákazník</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {getFilterDisplayText(filterZakaznik)}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-0" align="start">
                  <div className="p-2 max-h-64 overflow-y-auto">
                    {zakazniciList.map(zakaznik => (
                      <div key={zakaznik} className="flex items-center space-x-2 py-2 px-2 rounded hover:bg-muted/50">
                        <Checkbox
                          id={`customer-${zakaznik}`}
                          checked={isFilterActive(filterZakaznik, zakaznik)}
                          onCheckedChange={() => toggleFilterValue(filterZakaznik, zakaznik, setFilterZakaznik)}
                        />
                        <label htmlFor={`customer-${zakaznik}`} className="text-sm cursor-pointer flex-1">
                          {zakaznik}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            
            <div>
              <label className="text-sm font-medium mb-2 block">Program</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {getFilterDisplayText(filterProgram)}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-0" align="start">
                  <div className="p-2 max-h-64 overflow-y-auto">
                    {programyList.map(program => (
                      <div key={program} className="flex items-center space-x-2 py-2 px-2 rounded hover:bg-muted/50">
                        <Checkbox
                          id={`program-${program}`}
                          checked={isFilterActive(filterProgram, program)}
                          onCheckedChange={() => toggleFilterValue(filterProgram, program, setFilterProgram)}
                        />
                        <label htmlFor={`program-${program}`} className="text-sm cursor-pointer flex-1">
                          {program}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto overflow-y-auto max-h-[85vh]">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-20">
                {viewMode === 'weeks' ? (
                  <>
                    <tr>
                      <th className="border-2 border-border p-2 bg-background text-left sticky left-0 sticky top-0 z-30 min-w-[200px] font-semibold text-sm">
                        Konstruktér
                      </th>
                      {months.map((month, monthIndex) => (
                        <th 
                          key={month.name} 
                          className={`border-2 border-border p-2 bg-background text-center font-bold text-base sticky top-0 z-20 ${
                            monthIndex > 0 ? 'border-l-4 border-l-primary/50' : ''
                          }`} 
                          colSpan={month.weeks.length}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-primary">{month.name}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                    <tr>
                      <th className="border border-border p-1.5 bg-background sticky left-0 sticky top-[48px] z-30 font-medium text-sm"></th>
                      {months.map((month, monthIndex) => 
                        month.weeks.map((week, weekIndex) => (
                          <th 
                            key={week} 
                            className={`border border-border p-1.5 bg-background text-xs min-w-[90px] font-medium sticky top-[48px] z-20 ${
                              monthIndex > 0 && weekIndex === 0 ? 'border-l-4 border-l-primary/50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-muted-foreground">{week}</span>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className={`h-5 w-5 p-0 ${hasActiveWeekFilter(week) ? 'text-primary' : 'text-muted-foreground'}`}
                                  >
                                    <Filter className="h-3 w-3" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-60 p-0" align="start">
                                  <div className="p-2 max-h-64 overflow-y-auto">
                                    <div className="font-medium text-sm mb-2 px-2">{week}</div>
                                    {getProjectsForWeek(week).map(project => (
                                      <div key={project} className="flex items-center space-x-2 py-2 px-2 rounded hover:bg-muted/50">
                                        <Checkbox
                                          id={`week-${week}-project-${project}`}
                                          checked={isWeekFilterActive(week, project)}
                                          onCheckedChange={() => toggleWeekFilter(week, project)}
                                        />
                                        <label 
                                          htmlFor={`week-${week}-project-${project}`} 
                                          className="text-sm cursor-pointer flex-1"
                                        >
                                          {project}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </th>
                        ))
                      )}
                    </tr>
                  </>
                ) : (
                  <tr>
                    <th className="border-2 border-border p-2 bg-background text-left sticky left-0 sticky top-0 z-30 min-w-[200px] font-semibold text-sm">
                      Konstruktér
                    </th>
                    {months.map((month, monthIndex) => (
                      <th 
                        key={month.name} 
                        className={`border-2 border-border p-2 bg-background text-center font-bold text-base min-w-[150px] sticky top-0 z-20 ${
                          monthIndex > 0 ? 'border-l-4 border-l-primary/50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-primary">{month.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody>
                {filteredEngineers.map((engineer, index) => (
                  <tr key={engineer} className={`transition-colors hover:bg-muted/20 ${index % 2 === 1 ? 'bg-muted/30' : 'bg-background'}`}>
                    <td className="border border-border p-2 font-semibold sticky left-0 bg-inherit z-10 text-foreground text-sm">
                      {displayNameMap[engineer] || engineer}
                    </td>
                    {viewMode === 'weeks' ? (
                      months.map((month, monthIndex) => 
                        month.weeks.map((week, weekIndex) => {
                          const project = matrixData[engineer][week];
                          return (
                            <td 
                              key={week} 
                              className={`border border-border p-1 text-center ${
                                monthIndex > 0 && weekIndex === 0 ? 'border-l-4 border-l-primary/50' : ''
                              }`}
                            >
                              {project && (
                                <div 
                                  className={`text-xs px-1.5 py-0.5 w-full justify-center font-medium shadow-sm hover:shadow-md transition-all duration-200 rounded-md inline-flex items-center ${getProjectBadgeStyle(project)}`}
                                >
                                  <span className="truncate max-w-[65px]" title={project}>
                                    {project}
                                  </span>
                                </div>
                              )}
                            </td>
                          );
                        })
                      )
                    ) : (
                      months.map((month, monthIndex) => {
                        const monthData = monthlyData[engineer][month.name];
                        const hasProjects = monthData.projects.length > 0;
                        
                        // Sort projects by hours descending
                        const sortedProjects = monthData.projects.sort((a, b) => {
                          const aHours = month.weeks.reduce((sum, week) => {
                            const entry = planningData.find(e => normalizeName(e.konstrukter) === engineer && e.cw === week && e.projekt === a);
                            return sum + (typeof entry?.mhTyden === 'number' ? entry.mhTyden : 0);
                          }, 0);
                          const bHours = month.weeks.reduce((sum, week) => {
                            const entry = planningData.find(e => normalizeName(e.konstrukter) === engineer && e.cw === week && e.projekt === b);
                            return sum + (typeof entry?.mhTyden === 'number' ? entry.mhTyden : 0);
                          }, 0);
                          return bHours - aHours;
                        });
                        
                        return (
                           <td 
                             key={month.name} 
                             className={`border border-border p-1.5 text-center align-top ${
                               monthIndex > 0 ? 'border-l-4 border-l-primary/50' : ''
                             }`}
                           >
                              {hasProjects && (
                                <div className="flex flex-col gap-1">
                                  {/* Main project */}
                                  <div 
                                    className={`text-xs px-1.5 py-0.5 w-full justify-center font-medium shadow-sm hover:shadow-md transition-all duration-200 rounded-md inline-flex items-center ${getProjectBadgeStyle(sortedProjects[0])}`}
                                  >
                                    <span className="truncate max-w-[95px]" title={sortedProjects[0]}>
                                      {sortedProjects[0]}
                                    </span>
                                  </div>
                                  
                                  {/* Additional projects */}
                                  {sortedProjects.slice(1).map((project, index) => (
                                    <div 
                                      key={index}
                                      className={`text-xs px-1 py-0.5 w-full justify-center font-normal opacity-75 rounded-sm inline-flex items-center ${getProjectBadgeStyle(project)}`}
                                    >
                                      <span className="truncate max-w-[85px] text-xs" title={project}>
                                        {project}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                           </td>
                        );
                      })
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            Zobrazeno {filteredEngineers.length} konstruktérů
          </div>
        </CardContent>
      </Card>
    </div>
  );
};