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
import { normalizeName, createNameMapping } from '@/utils/nameNormalization';
import { useEngineers } from '@/hooks/useEngineers';

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
  'Dodavatel'
];

// Funkce pro výpočet aktuálního kalendářního týdne
const getCurrentWeek = (): number => {
  return getWeek(new Date(), { weekStartsOn: 1 });
};

// Funkce pro generování týdnů od aktuálního týdne do konce roku
const getAllWeeks = (): string[] => {
  const currentWeek = getCurrentWeek();
  const startWeek = Math.max(32, currentWeek);
  
  const weeks = [];
  // CW32-52 pro rok 2025
  for (let cw = startWeek; cw <= 52; cw++) {
    weeks.push(`CW${cw.toString().padStart(2, '0')}-2025`);
  }
  // CW01-52 pro rok 2026
  for (let cw = 1; cw <= 52; cw++) {
    weeks.push(`CW${cw.toString().padStart(2, '0')}-2026`);
  }
  
  return weeks;
};

const weeks = getAllWeeks();

// Měsíce pro agregaci
const months = [
  { name: 'Srp 2025', weeks: ['CW32-2025', 'CW33-2025', 'CW34-2025', 'CW35-2025'] },
  { name: 'Zář 2025', weeks: ['CW36-2025', 'CW37-2025', 'CW38-2025', 'CW39-2025'] },
  { name: 'Říj 2025', weeks: ['CW40-2025', 'CW41-2025', 'CW42-2025', 'CW43-2025'] },
  { name: 'Lis 2025', weeks: ['CW44-2025', 'CW45-2025', 'CW46-2025', 'CW47-2025'] },
  { name: 'Pro 2025', weeks: ['CW48-2025', 'CW49-2025', 'CW50-2025', 'CW51-2025', 'CW52-2025'] },
  { name: 'Led 2026', weeks: ['CW01-2026', 'CW02-2026', 'CW03-2026', 'CW04-2026'] },
  { name: 'Úno 2026', weeks: ['CW05-2026', 'CW06-2026', 'CW07-2026', 'CW08-2026'] },
  { name: 'Bře 2026', weeks: ['CW09-2026', 'CW10-2026', 'CW11-2026', 'CW12-2026'] },
  { name: 'Dub 2026', weeks: ['CW13-2026', 'CW14-2026', 'CW15-2026', 'CW16-2026'] },
  { name: 'Kvě 2026', weeks: ['CW17-2026', 'CW18-2026', 'CW19-2026', 'CW20-2026'] },
  { name: 'Čvn 2026', weeks: ['CW21-2026', 'CW22-2026', 'CW23-2026', 'CW24-2026'] },
  { name: 'Čvc 2026', weeks: ['CW25-2026', 'CW26-2026', 'CW27-2026', 'CW28-2026'] },
  { name: 'Srp 2026', weeks: ['CW29-2026', 'CW30-2026', 'CW31-2026', 'CW32-2026'] },
];

export const ProjectAssignmentMatrix: React.FC = () => {
  const { planningData } = usePlanning();
  const { engineers, loading: engineersLoading } = useEngineers();

  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('monthly');
  const [filterOrgVedouci, setFilterOrgVedouci] = useState<string[]>(['Všichni']);
  const [filterCustomer, setFilterCustomer] = useState<string[]>(['Všichni']);
  const [filterProgram, setFilterProgram] = useState<string[]>(['Všichni']);

  // Create engineer to organizational leader mapping
  const konstrukterVedouci = useMemo(() => {
    if (engineersLoading || engineers.length === 0) return {};
    return Object.fromEntries(engineers.map(e => [normalizeName(e.jmeno), e.orgVedouci]));
  }, [engineers, engineersLoading]);

  const displayNameMap = useMemo(() => {
    if (engineersLoading || engineers.length === 0) return {};
    
    const map: Record<string, string> = {};
    engineers.forEach(e => {
      map[normalizeName(e.jmeno)] = e.jmeno;
    });
    planningData.forEach(e => {
      const key = normalizeName(e.konstrukter);
      if (!map[key]) map[key] = e.konstrukter;
    });
    return map;
  }, [planningData, engineers, engineersLoading]);

  // Dynamic project mappings based on projectsData
  const projektInfo = useMemo(() => {
    const info: Record<string, { customer: string; program: string }> = {};
    projects.forEach(project => {
      const customer = customers.find(c => c.id === project.customerId);
      const program = programs.find(p => p.id === project.programId);
      info[project.code] = {
        customer: customer ? customer.name : 'Unknown',
        program: program ? program.name : 'Unknown'
      };
    });
    return info;
  }, []);

  const customeryList = useMemo(() => {
    const customerNames = Array.from(new Set(Object.values(projektInfo).map(p => p.customer)));
    return ['Všichni', ...customerNames];
  }, [projektInfo]);

  const programyList = useMemo(() => {
    const programCodes = programs.map(p => p.code);
    return ['Všichni', ...programCodes];
  }, []);

  // Create matrix data structure
  const matrixData = useMemo(() => {
    if (engineersLoading || engineers.length === 0) return {};
    
    const engineerKeys = Array.from(new Set([
      ...engineers.map(e => normalizeName(e.jmeno)),
      ...planningData.map(entry => normalizeName(entry.konstrukter))
    ]));
    const matrix: { [engineer: string]: { [week: string]: string } } = {};
    
    engineerKeys.forEach(engineerKey => {
      matrix[engineerKey] = {};
      weeks.forEach(week => {
        const entry = planningData.find(e => normalizeName(e.konstrukter) === engineerKey && e.cw === week);
        matrix[engineerKey][week] = entry?.projekt || (week.includes('CW52') ? 'DOVOLENÁ' : 'FREE');
      });
    });
    
    return matrix;
  }, [planningData, engineers, engineersLoading]);

  // Create monthly aggregated data
  const monthlyData = useMemo(() => {
    if (engineersLoading || engineers.length === 0) return {};
    
    const engineerKeys = Array.from(new Set([
      ...engineers.map(e => normalizeName(e.jmeno)),
      ...planningData.map(entry => normalizeName(entry.konstrukter))
    ]));
    const monthlyMatrix: { [engineer: string]: { [month: string]: { projects: string[], totalHours: number, dominantProject: string } } } = {};
    
    engineerKeys.forEach(engineerKey => {
      monthlyMatrix[engineerKey] = {};
      months.forEach(month => {
        const monthProjects: { [project: string]: number } = {};
        let totalHours = 0;
        
        month.weeks.forEach(week => {
          const weekData = matrixData[engineerKey]?.[week];
          if (weekData && weekData !== 'FREE') {
            monthProjects[weekData] = (monthProjects[weekData] || 0) + 1;
            totalHours += 40; // Předpokládáme 40h týdně pro jednoduchost
          }
        });
        
        // Najdi dominantní projekt
        let dominantProject = 'FREE';
        let maxWeeks = 0;
        Object.entries(monthProjects).forEach(([project, weekCount]) => {
          if (weekCount > maxWeeks) {
            maxWeeks = weekCount;
            dominantProject = project;
          }
        });
        
        monthlyMatrix[engineerKey][month.name] = {
          projects: Object.keys(monthProjects),
          totalHours,
          dominantProject
        };
      });
    });
    
    return monthlyMatrix;
  }, [matrixData, engineers, engineersLoading]);

  // Get unique engineers from planning data
  const allEngineersInData = useMemo(() => {
    if (engineersLoading || engineers.length === 0) return [];
    
    const engineersSet = new Set([
      ...planningData.map(entry => normalizeName(entry.konstrukter)),
      ...engineers.map(e => normalizeName(e.jmeno)),
    ]);
    return Array.from(engineersSet).sort();
  }, [planningData, engineers, engineersLoading]);

  // Get unique engineers from planning data and database
  const uniqueEngineersInData = useMemo(() => {
    if (engineersLoading || engineers.length === 0) return [];
    
    const engineersSet = new Set([
      ...planningData.map(entry => normalizeName(entry.konstrukter)),
      ...engineers.map(e => normalizeName(e.jmeno)),
    ]);
    return Array.from(engineersSet).sort();
  }, [planningData, engineers, engineersLoading]);

  const displayData = viewMode === 'weekly' ? matrixData : monthlyData;
  const displayHeaders = viewMode === 'weekly' ? weeks : months.map(m => m.name);

  // Multi-select helper function for displaying selected items
  const getDisplayText = (filter: string[]) => {
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
    if (engineersLoading || engineers.length === 0) return [];
    
    let engineerList = Object.keys(displayData);
    
    // Filter by organizational leader
    if (!filterOrgVedouci.includes('Všichni')) {
      engineerList = engineerList.filter(engineer => 
        filterOrgVedouci.includes(konstrukterVedouci[engineer])
      );
    }

    // Filter by customer
    if (!filterCustomer.includes('Všichni')) {
      engineerList = engineerList.filter(engineer => {
        if (engineersLoading || engineers.length === 0) return false;
        
        // Check if engineer has any project assigned from selected customers
        const engineerData = displayData[engineer];
        if (!engineerData) return false;
        
        const hasCustomerProject = Object.values(engineerData).some((cellData: any) => {
          if (viewMode === 'weekly') {
            const project = cellData as string;
            const projectInfo = projektInfo[project];
            return projectInfo && filterCustomer.includes(projectInfo.customer);
          } else {
            const monthData = cellData as { projects: string[], dominantProject: string };
            return monthData.projects.some(project => {
              const projectInfo = projektInfo[project];
              return projectInfo && filterCustomer.includes(projectInfo.customer);
            });
          }
        });
        
        return hasCustomerProject;
      });
    }

    // Filter by program
    if (!filterProgram.includes('Všichni')) {
      engineerList = engineerList.filter(engineer => {
        if (engineersLoading || engineers.length === 0) return false;
        
        // Check if engineer has any project assigned from selected programs
        const engineerData = displayData[engineer];
        if (!engineerData) return false;
        
        const hasProgramProject = Object.values(engineerData).some((cellData: any) => {
          if (viewMode === 'weekly') {
            const project = cellData as string;
            const projectInfo = projektInfo[project];
            return projectInfo && filterProgram.includes(projectInfo.program);
          } else {
            const monthData = cellData as { projects: string[], dominantProject: string };
            return monthData.projects.some(project => {
              const projectInfo = projektInfo[project];
              return projectInfo && filterProgram.includes(projectInfo.program);
            });
          }
        });
        
        return hasProgramProject;
      });
    }

    return engineerList.sort((a, b) => {
      const displayNameA = displayNameMap[a] || a;
      const displayNameB = displayNameMap[b] || b;
      return displayNameA.localeCompare(displayNameB);
    });
  }, [displayData, filterOrgVedouci, filterCustomer, filterProgram, konstrukterVedouci, displayNameMap, projektInfo, viewMode, engineers, engineersLoading]);

  const getBadgeForProject = (project: string) => {
    if (project === 'FREE') return <Badge variant="secondary" className="bg-green-100 text-green-800">FREE</Badge>;
    if (project === 'DOVOLENÁ') return <Badge variant="outline" className="bg-blue-100 text-blue-800">Dovolená</Badge>;
    if (project === 'NEMOC') return <Badge variant="destructive">Nemoc</Badge>;
    if (project === 'OVER') return <Badge variant="outline" className="bg-orange-100 text-orange-800">Over</Badge>;
    
    const info = projektInfo[project];
    const customer = info?.customer || 'Unknown';
    
    // Color coding based on customer
    let badgeClass = "bg-gray-100 text-gray-800";
    if (customer.includes('Siemens')) badgeClass = "bg-blue-100 text-blue-800";
    if (customer.includes('NUVIA')) badgeClass = "bg-green-100 text-green-800";
    if (customer.includes('Wabtec')) badgeClass = "bg-purple-100 text-purple-800";
    if (customer.includes('Safran')) badgeClass = "bg-red-100 text-red-800";
    
    return <Badge className={badgeClass}>{project}</Badge>;
  };

  if (engineersLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Načítání konstruktérů...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matice přiřazení projektů</CardTitle>
        <div className="flex flex-wrap gap-4 items-center">
          <Select value={viewMode} onValueChange={(value: 'weekly' | 'monthly') => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Týdně</SelectItem>
              <SelectItem value="monthly">Měsíčně</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between">
                {getDisplayText(filterOrgVedouci)}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-2">
                <h4 className="font-medium">Organizační vedoucí</h4>
                {organizacniVedouci.map((vedouci) => (
                  <div key={vedouci} className="flex items-center space-x-2">
                    <Checkbox
                      id={vedouci}
                      checked={filterOrgVedouci.includes(vedouci)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          if (vedouci === 'Všichni') {
                            setFilterOrgVedouci(['Všichni']);
                          } else {
                            setFilterOrgVedouci(prev => 
                              prev.filter(v => v !== 'Všichni').concat(vedouci)
                            );
                          }
                        } else {
                          setFilterOrgVedouci(prev => prev.filter(v => v !== vedouci));
                        }
                      }}
                    />
                    <label htmlFor={vedouci} className="text-sm">{vedouci}</label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between">
                {getDisplayText(filterCustomer)}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-2">
                <h4 className="font-medium">Zákazník</h4>
                {customeryList.map((customer) => (
                  <div key={customer} className="flex items-center space-x-2">
                    <Checkbox
                      id={customer}
                      checked={filterCustomer.includes(customer)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          if (customer === 'Všichni') {
                            setFilterCustomer(['Všichni']);
                          } else {
                            setFilterCustomer(prev => 
                              prev.filter(v => v !== 'Všichni').concat(customer)
                            );
                          }
                        } else {
                          setFilterCustomer(prev => prev.filter(v => v !== customer));
                        }
                      }}
                    />
                    <label htmlFor={customer} className="text-sm">{customer}</label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border p-2 text-left bg-muted sticky left-0">Konstruktér</th>
                {displayHeaders.map(header => (
                  <th key={header} className="border p-2 text-center min-w-[100px]">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEngineers.map(engineer => (
                <tr key={engineer}>
                  <td className="border p-2 font-medium bg-muted sticky left-0">
                    {displayNameMap[engineer] || engineer}
                  </td>
                  {displayHeaders.map(header => {
                    const cellData = displayData[engineer]?.[header];
                    return (
                      <td key={header} className="border p-1 text-center">
                        {viewMode === 'weekly' ? (
                          getBadgeForProject(cellData as string || 'FREE')
                        ) : (
                          <div className="space-y-1">
                            {cellData && (cellData as any).dominantProject ? 
                              getBadgeForProject((cellData as any).dominantProject) : 
                              getBadgeForProject('FREE')
                            }
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};