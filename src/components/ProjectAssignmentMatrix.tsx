import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { usePlanning } from '@/contexts/PlanningContext';
import { customers, projectManagers, programs, projects } from '@/data/projectsData';
import { getWeek } from 'date-fns';

// Organizational structure and project mappings
const organizacniVedouci = [
  'Všichni',
  'JoMa',
  'OnLi', 
  'KaSo',
  'PaHo',
  'PeMa',
  'DaAm',
  'PeNe',
  'Subdodavka'
];

// Mapping of engineers to organizational leaders
const konstrukterVedouci: { [key: string]: string } = {
  'Hlavan Martin': 'JoMa',
  'Fica Ladislav': 'JoMa',
  'Ambrož David': 'OnLi',
  'Slavík Ondřej': 'KaSo',
  'Chrenko Peter': 'Subdodavka',
  'Jurčišin Peter': 'Subdodavka',
  'Púpava Marián': 'Subdodavka',
  'Bohušík Martin': 'Subdodavka',
  'Uher Tomáš': 'KaSo',
  'Weiss Ondřej': 'PaHo',
  'Borský Jan': 'PaHo',
  'Pytela Martin': 'PaHo',
  'Litvinov Evgenii': 'PaHo',
  'Jandečka Karel': 'KaSo',
  'Heřman Daniel': 'JoMa',
  'Karlesz Michal': 'PeMa',
  'Matta Jozef': 'OnLi',
  'Pecinovský Pavel': 'JoMa',
  'Anovčín Branislav': 'DaAm',
  'Bartovič Anton': 'DaAm',
  'Břicháček Miloš': 'JoMa',
  'Fenyk Pavel': 'PeMa',
  'Kalafa Ján': 'JoMa',
  'Lengyel Martin': 'JoMa',
  'Šoupa Karel': 'OnLi',
  'Večeř Jiří': 'JoMa',
  'Bartovičová Agáta': 'KaSo',
  'Hrachová Ivana': 'KaSo',
  'Karlík Štěpán': 'JoMa',
  'Friedlová Jiřina': 'OnLi',
  'Fuchs Pavel': 'DaAm',
  'Mohelník Martin': 'JoMa',
  'Nedavaška Petr': 'OnLi',
  'Šedovičová Darina': 'PeNe',
  'Ješš Jozef': 'PeNe',
  'Melichar Ondřej': 'PeNe',
  'Klíma Milan': 'KaSo',
  'Hibler František': 'KaSo',
  'Brojír Jaroslav': 'JoMa',
  'Madanský Peter': 'OnLi',
  'Samko Mikuláš': 'JoMa',
  'Chrenko Daniel': 'Subdodavka',
  'Jiřička Aleš': 'JoMa',
  'Stránský Martin': 'PeMa',
  'Trač Vasyl': 'PeMa'
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
    weeks.push(`CW${cw.toString().padStart(2, '0')}`);
  }
  // CW01-26 pro rok 2026
  for (let cw = 1; cw <= 26; cw++) {
    weeks.push(`CW${cw.toString().padStart(2, '0')}`);
  }
  return weeks;
};

const weeks = getAllWeeks();

const months = [
  { name: 'srpen', weeks: ['CW32', 'CW33', 'CW34', 'CW35'] },
  { name: 'září', weeks: ['CW36', 'CW37', 'CW38', 'CW39'] },
  { name: 'říjen', weeks: ['CW40', 'CW41', 'CW42', 'CW43', 'CW44'] },
  { name: 'listopad', weeks: ['CW45', 'CW46', 'CW47', 'CW48'] },
  { name: 'prosinec', weeks: ['CW49', 'CW50', 'CW51', 'CW52'] },
  { name: 'leden', weeks: ['CW01', 'CW02', 'CW03', 'CW04', 'CW05'] },
  { name: 'únor', weeks: ['CW06', 'CW07', 'CW08', 'CW09'] },
  { name: 'březen', weeks: ['CW10', 'CW11', 'CW12', 'CW13', 'CW14'] },
  { name: 'duben', weeks: ['CW15', 'CW16', 'CW17', 'CW18'] },
  { name: 'květen', weeks: ['CW19', 'CW20', 'CW21', 'CW22', 'CW23'] },
  { name: 'červen', weeks: ['CW24', 'CW25', 'CW26'] }
].map(month => ({
  ...month,
  weeks: month.weeks.filter(week => weeks.includes(week))
})).filter(month => month.weeks.length > 0);

const getProjectBadgeStyle = (projekt: string) => {
  // Free, vacation, sick leave and overtime
  if (projekt === 'FREE') return 'bg-muted text-muted-foreground border-muted';
  if (projekt === 'DOVOLENÁ') return 'bg-accent/20 text-accent border-accent/30';
  if (projekt === 'NEMOC') return 'bg-destructive/20 text-destructive border-destructive/30';  
  if (projekt === 'OVER') return 'bg-warning/20 text-warning border-warning/30';
  if (projekt === 'DOVOLENÁ') return 'bg-destructive text-destructive-foreground border-destructive';
  
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
  const { planningData } = usePlanning();
  const [viewMode, setViewMode] = useState<'weeks' | 'months'>('weeks');
  const [filterOrgVedouci, setFilterOrgVedouci] = useState<string[]>(['Všichni']);
  const [filterPM, setFilterPM] = useState<string[]>(['Všichni']);
  const [filterZakaznik, setFilterZakaznik] = useState<string[]>(['Všichni']);
  const [filterProgram, setFilterProgram] = useState<string[]>(['Všichni']);

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
    return ['Všichni', ...programCodes];
  }, []);

  // Create matrix data structure
  const matrixData = useMemo(() => {
    const engineers = [...new Set(planningData.map(entry => entry.konstrukter))];
    const matrix: { [engineer: string]: { [week: string]: string } } = {};
    
    engineers.forEach(engineer => {
      matrix[engineer] = {};
      weeks.forEach(week => {
        const entry = planningData.find(e => e.konstrukter === engineer && e.cw === week);
        matrix[engineer][week] = entry?.projekt || '';
      });
    });
    
    return matrix;
  }, [planningData]);

  // Create monthly aggregated data
  const monthlyData = useMemo(() => {
    const engineers = [...new Set(planningData.map(entry => entry.konstrukter))];
    const monthlyMatrix: { [engineer: string]: { [month: string]: { projects: string[], totalHours: number, dominantProject: string } } } = {};
    
    engineers.forEach(engineer => {
      monthlyMatrix[engineer] = {};
      months.forEach(month => {
        const monthProjects: { [project: string]: number } = {};
        let totalHours = 0;
        
        month.weeks.forEach(week => {
          const entry = planningData.find(e => e.konstrukter === engineer && e.cw === week);
          if (entry && entry.projekt) {
            const hours = typeof entry.mhTyden === 'number' ? entry.mhTyden : 0;
            monthProjects[entry.projekt] = (monthProjects[entry.projekt] || 0) + hours;
            totalHours += hours;
          }
        });
        
        const projects = Object.keys(monthProjects);
        const dominantProject = projects.reduce((a, b) => 
          monthProjects[a] > monthProjects[b] ? a : b, projects[0] || ''
        );
        
        monthlyMatrix[engineer][month.name] = {
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
    
    // Filter by organizational leader
    if (!filterOrgVedouci.includes('Všichni')) {
      engineers = engineers.filter(engineer => 
        filterOrgVedouci.includes(konstrukterVedouci[engineer])
      );
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
            return monthData.projects.some(project => 
              projektInfo[project]?.program && filterProgram.includes(projektInfo[project].program)
            );
          });
        });
      }
    }
    
    return engineers.sort();
  }, [displayData, matrixData, monthlyData, viewMode, filterOrgVedouci, filterPM, filterZakaznik, filterProgram]);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Matice plánování projektů</CardTitle>
          <div className="flex items-center gap-4 mt-4">
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
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Organizační vedoucí</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {getFilterDisplayText(filterOrgVedouci)}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-0" align="start">
                  <div className="p-2 max-h-64 overflow-y-auto">
                    {organizacniVedouci.map(vedouci => (
                      <div key={vedouci} className="flex items-center space-x-2 py-2 px-2 rounded hover:bg-muted/50">
                        <Checkbox
                          id={`org-${vedouci}`}
                          checked={isFilterActive(filterOrgVedouci, vedouci)}
                          onCheckedChange={() => toggleFilterValue(filterOrgVedouci, vedouci, setFilterOrgVedouci)}
                        />
                        <label htmlFor={`org-${vedouci}`} className="text-sm cursor-pointer flex-1">
                          {vedouci}
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
          <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-20">
                {viewMode === 'weeks' ? (
                  <>
                    <tr>
                      <th className="border-2 border-border p-3 bg-background text-left sticky left-0 sticky top-0 z-30 min-w-[200px] font-semibold">
                        Konstruktér
                      </th>
                      {months.map((month, monthIndex) => (
                        <th 
                          key={month.name} 
                          className={`border-2 border-border p-3 bg-background text-center font-bold text-lg sticky top-0 z-20 ${
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
                      <th className="border border-border p-2 bg-background sticky left-0 sticky top-[52px] z-30 font-medium"></th>
                      {months.map((month, monthIndex) => 
                        month.weeks.map((week, weekIndex) => (
                          <th 
                            key={week} 
                            className={`border border-border p-2 bg-background text-xs min-w-[90px] font-medium sticky top-[52px] z-20 ${
                              monthIndex > 0 && weekIndex === 0 ? 'border-l-4 border-l-primary/50' : ''
                            }`}
                          >
                            <span className="text-muted-foreground">{week}</span>
                          </th>
                        ))
                      )}
                    </tr>
                  </>
                ) : (
                  <tr>
                    <th className="border-2 border-border p-3 bg-background text-left sticky left-0 sticky top-0 z-30 min-w-[200px] font-semibold">
                      Konstruktér
                    </th>
                    {months.map((month, monthIndex) => (
                      <th 
                        key={month.name} 
                        className={`border-2 border-border p-3 bg-background text-center font-bold text-lg min-w-[150px] sticky top-0 z-20 ${
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
                    <td className="border border-border p-3 font-semibold sticky left-0 bg-inherit z-10 text-foreground">
                      {engineer}
                    </td>
                    {viewMode === 'weeks' ? (
                      months.map((month, monthIndex) => 
                        month.weeks.map((week, weekIndex) => {
                          const project = matrixData[engineer][week];
                          return (
                            <td 
                              key={week} 
                              className={`border border-border p-1.5 text-center ${
                                monthIndex > 0 && weekIndex === 0 ? 'border-l-4 border-l-primary/50' : ''
                              }`}
                            >
                              {project && (
                                <div 
                                  className={`text-xs px-2 py-1 w-full justify-center font-medium shadow-sm hover:shadow-md transition-all duration-200 rounded-md inline-flex items-center ${getProjectBadgeStyle(project)}`}
                                >
                                  <span className="truncate max-w-[70px]" title={project}>
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
                            const entry = planningData.find(e => e.konstrukter === engineer && e.cw === week && e.projekt === a);
                            return sum + (typeof entry?.mhTyden === 'number' ? entry.mhTyden : 0);
                          }, 0);
                          const bHours = month.weeks.reduce((sum, week) => {
                            const entry = planningData.find(e => e.konstrukter === engineer && e.cw === week && e.projekt === b);
                            return sum + (typeof entry?.mhTyden === 'number' ? entry.mhTyden : 0);
                          }, 0);
                          return bHours - aHours;
                        });
                        
                        return (
                           <td 
                             key={month.name} 
                             className={`border border-border p-2 text-center align-top ${
                               monthIndex > 0 ? 'border-l-4 border-l-primary/50' : ''
                             }`}
                           >
                              {hasProjects && (
                                <div className="flex flex-col gap-1">
                                  {/* Main project */}
                                  <div 
                                    className={`text-xs px-2 py-1 w-full justify-center font-medium shadow-sm hover:shadow-md transition-all duration-200 rounded-md inline-flex items-center ${getProjectBadgeStyle(sortedProjects[0])}`}
                                  >
                                    <span className="truncate max-w-[100px]" title={sortedProjects[0]}>
                                      {sortedProjects[0]}
                                    </span>
                                  </div>
                                  
                                  {/* Additional projects */}
                                  {sortedProjects.slice(1).map((project, index) => (
                                    <div 
                                      key={index}
                                      className={`text-xs px-1.5 py-0.5 w-full justify-center font-normal opacity-75 rounded-sm inline-flex items-center ${getProjectBadgeStyle(project)}`}
                                    >
                                      <span className="truncate max-w-[90px] text-xs" title={project}>
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