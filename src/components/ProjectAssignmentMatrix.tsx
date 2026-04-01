import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronDown, Filter, History, Save, Trash2, Users, X } from 'lucide-react';
import { PlanningHistoryDialog } from './PlanningHistoryDialog';
import { ProjectAllocationDialog, AllocationEntry } from './ProjectAllocationDialog';
import { usePlanning } from '@/contexts/PlanningContext';
import { customers, projectManagers, programs, projects } from '@/data/projectsData';
import { getWeek } from 'date-fns';
import { normalizeName, createNameMapping } from '@/utils/nameNormalization';
import { getWorkingDaysFromMonthName, getWorkingDaysInWeekForMonth, getWorkingDaysInCW, getISOWeekMonday, getWorkingDaysInMonth } from '@/utils/workingDays';
import { isEngineerDepartedForWeek } from '@/utils/engineerDeparture';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useCustomEngineerViews } from '@/hooks/useCustomEngineerViews';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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



// Funkce pro výpočet aktuálního kalendářního týdne a roku
const getCurrentWeekAndYear = (): { week: number; year: number } => {
  const now = new Date();
  return {
    week: getWeek(now, { weekStartsOn: 1, firstWeekContainsDate: 4 }),
    year: now.getFullYear()
  };
};

// Funkce pro generování týdnů od aktuálního týdne na 52 týdnů dopředu
const getAllWeeks = (): string[] => {
  const { week: currentWeek, year: currentYear } = getCurrentWeekAndYear();
  
  const weeks = [];
  let week = currentWeek;
  let year = currentYear;
  
  // Generujeme 52 týdnů od aktuálního
  for (let i = 0; i < 52; i++) {
    weeks.push(`CW${week.toString().padStart(2, '0')}-${year}`);
    week++;
    if (week > 52) {
      week = 1;
      year++;
    }
  }
  
  return weeks;
};

const allWeeks = getAllWeeks();

// Czech month names by number
const monthNumberToNameCZ: { [key: number]: string } = {
  1: 'leden', 2: 'únor', 3: 'březen', 4: 'duben', 5: 'květen', 6: 'červen',
  7: 'červenec', 8: 'srpen', 9: 'září', 10: 'říjen', 11: 'listopad', 12: 'prosinec'
};

// Dynamically get the primary month for a CW key (based on ISO week Monday's month)
const getMonthForWeek = (cwKey: string): { month: number; year: number; name: string } | null => {
  const match = cwKey.match(/CW(\d+)-(\d+)/);
  if (!match) return null;
  const cwNum = parseInt(match[1]);
  const year = parseInt(match[2]);
  const monday = getISOWeekMonday(cwNum, year);
  // Use Thursday (ISO standard) to determine the "primary" month of the week
  const thursday = new Date(monday);
  thursday.setDate(monday.getDate() + 3);
  const m = thursday.getMonth() + 1;
  const y = thursday.getFullYear();
  return { month: m, year: y, name: monthNumberToNameCZ[m] };
};

// Filter weeks based on maxEndDate
const filterWeeksByMaxDate = (weeksList: string[], maxEndDate?: { month: number; year: number }): string[] => {
  if (!maxEndDate) return weeksList;
  
  return weeksList.filter(week => {
    const monthInfo = getMonthForWeek(week);
    if (!monthInfo) return false;
    if (monthInfo.year < maxEndDate.year) return true;
    if (monthInfo.year > maxEndDate.year) return false;
    return monthInfo.month <= maxEndDate.month;
  });
};

// Dynamicky generovat měsíce na základě vygenerovaných týdnů
const generateMonths = (weeksList: string[]): { name: string; weeks: string[] }[] => {
  const monthsMap = new Map<string, string[]>();
  
  weeksList.forEach(week => {
    const monthInfo = getMonthForWeek(week);
    if (monthInfo) {
      const monthKey = `${monthInfo.name} ${monthInfo.year}`;
      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, []);
      }
      monthsMap.get(monthKey)!.push(week);
    }
  });
  
  return Array.from(monthsMap.entries()).map(([name, weeks]) => ({ name, weeks }));
};

const getProjectBadgeStyle = (projekt: string) => {
  // Departed engineer
  if (projekt === 'DEPARTED') return 'bg-gray-200 text-red-500 border-gray-300 dark:bg-gray-800 dark:text-red-400 dark:border-gray-700';
  
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

const REGIME_ACTIVITIES = ['DOVOLENÁ', 'NEMOC', 'OVER'];

// Short month names for compact display
const shortMonthNames: Record<string, string> = {
  'leden': 'Led', 'únor': 'Úno', 'březen': 'Bře', 'duben': 'Dub',
  'květen': 'Kvě', 'červen': 'Čvn', 'červenec': 'Čvc', 'srpen': 'Srp',
  'září': 'Zář', 'říjen': 'Říj', 'listopad': 'Lis', 'prosinec': 'Pro'
};

const getShortMonthName = (fullName: string): string => {
  const parts = fullName.split(' ');
  const month = parts[0].toLowerCase();
  const year = parts[1]?.slice(-2) || '';
  return `${shortMonthNames[month] || parts[0]} ${year}`;
};

// Customer view constants - which projects are visible for each customer prefix
const CUSTOMER_VISIBLE_PROJECTS: Record<string, string[]> = {
  'ST': ['FREE', 'OVER', 'DOVOLENÁ', 'NEMOC']
};

const isProjectVisibleForCustomer = (project: string, customerPrefix: string | undefined): boolean => {
  if (!customerPrefix) return true; // Normal view - everything visible
  
  const alwaysVisible = CUSTOMER_VISIBLE_PROJECTS[customerPrefix] || [];
  return project.startsWith(`${customerPrefix}_`) || alwaysVisible.includes(project);
};

interface ProjectAssignmentMatrixProps {
  defaultViewMode?: 'weeks' | 'months';
  defaultPrograms?: string[];
  defaultFilterMode?: 'program' | 'custom';
  defaultCustomViewId?: string;
  defaultSelectedEngineers?: string[]; // Hardcoded list of engineers (for public pages without DB access)
  customerViewMode?: string; // Customer prefix (e.g., "ST") for customer-specific view
  maxEndDate?: { month: number; year: number }; // Limit the view to a specific end date
}

export const ProjectAssignmentMatrix = ({ 
  defaultViewMode = 'months',
  defaultPrograms = ['RAIL', 'MACH'],
  defaultFilterMode = 'custom',
  defaultCustomViewId,
  defaultSelectedEngineers,
  customerViewMode,
  maxEndDate
}: ProjectAssignmentMatrixProps) => {
  const { planningData, engineers } = usePlanning();
  const [viewMode, setViewMode] = useState<'weeks' | 'months'>(defaultViewMode);
  const [filterSpolecnost, setFilterSpolecnost] = useState<string[]>(['Všichni']);
  const [filterProgram, setFilterProgram] = useState<string[]>(defaultPrograms);
  const [weekFilters, setWeekFilters] = useState<{ [week: string]: string[] }>({});
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  
  // Project allocation dialog state
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  
  // Custom engineer views
  const [filterMode, setFilterMode] = useState<'program' | 'custom'>(defaultFilterMode);
  const [selectedCustomEngineers, setSelectedCustomEngineers] = useState<string[]>([]);
  const [customViewName, setCustomViewName] = useState('');
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null);
  const { customViews, saveView, deleteView, isLoading: isLoadingViews } = useCustomEngineerViews();

  // Filter weeks and months based on maxEndDate
  const weeks = useMemo(() => filterWeeksByMaxDate(allWeeks, maxEndDate), [maxEndDate]);
  const months = useMemo(() => generateMonths(weeks), [weeks]);

  // Auto-load default selected engineers (hardcoded list for public pages)
  useEffect(() => {
    if (defaultSelectedEngineers && defaultSelectedEngineers.length > 0 && selectedCustomEngineers.length === 0) {
      setSelectedCustomEngineers(defaultSelectedEngineers);
    }
  }, [defaultSelectedEngineers]);

  // Auto-load default custom view when views are loaded (for logged-in users)
  useEffect(() => {
    if (!defaultSelectedEngineers && defaultCustomViewId && customViews.length > 0 && !selectedViewId) {
      const view = customViews.find(v => v.id === defaultCustomViewId);
      if (view) {
        setSelectedCustomEngineers(view.engineers);
        setSelectedViewId(defaultCustomViewId);
      }
    }
  }, [defaultCustomViewId, customViews, selectedViewId, defaultSelectedEngineers]);

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

  // Map normalized name → end_date for departure checks
  const endDateMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    engineers.forEach(e => {
      map[normalizeName(e.display_name)] = e.end_date || null;
    });
    return map;
  }, [engineers]);

  // Dynamic project mappings based on projectsData
  const projektInfo = useMemo(() => {
    const info: { [key: string]: { zakaznik: string, pm: string, program: string } } = {};
    
    projects.forEach(project => {
      const customer = customers.find(c => c.id === project.customerId);
      const pm = projectManagers.find(p => p.id === project.projectManagerId);
      const program = programs.find(pr => pr.id === project.programId);
      
      info[project.code] = {
        zakaznik: customer?.name || 'NA',
        pm: pm?.name || 'NA',
        program: program?.code || 'NA'
      };
    });
    
    return info;
  }, []);

  // Dynamic filter arrays based on projectsData
  const programyList = useMemo(() => {
    const programCodes = programs.map(p => p.code);
    return ['Všichni', ...programCodes];
  }, []);


  // Get unique projects for a specific week
  const getProjectsForWeek = (week: string): string[] => {
    const projects = new Set<string>();
    Object.keys(matrixData).forEach(engineer => {
      const projectData = matrixData[engineer][week];
      if (projectData?.projekt) {
        projects.add(projectData.projekt);
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
    const matrix: { [engineer: string]: { [week: string]: { projekt: string; isTentative: boolean; hours: number } } } = {};
    
    engineerKeys.forEach(engineerKey => {
      matrix[engineerKey] = {};
      const engEndDate = endDateMap[engineerKey] || null;
      weeks.forEach(week => {
        // Check departure
        if (engEndDate && isEngineerDepartedForWeek(engEndDate, week)) {
          matrix[engineerKey][week] = {
            projekt: 'DEPARTED',
            isTentative: false,
            hours: 0
          };
          return;
        }
        const entry = planningData.find(e => normalizeName(e.konstrukter) === engineerKey && e.cw === week);
        // Default to 'DOVOLENÁ' for CW52, otherwise 'FREE' if no entry exists
        matrix[engineerKey][week] = {
          projekt: entry?.projekt || (week.includes('CW52') ? 'DOVOLENÁ' : 'FREE'),
          isTentative: entry?.is_tentative || false,
          hours: typeof entry?.mhTyden === 'number' ? entry.mhTyden : 0
        };
      });
    });
    
    return matrix;
  }, [planningData, engineers, weeks, endDateMap]);

// Create monthly aggregated data
  const monthlyData = useMemo(() => {
    const engineerKeys = Array.from(new Set([
      ...engineers.map(e => normalizeName(e.display_name)),
      ...planningData.map(entry => normalizeName(entry.konstrukter))
    ]));
    const monthlyMatrix: { [engineer: string]: { [month: string]: { projects: string[], totalHours: number, dominantProject: string } } } = {};
    
    engineerKeys.forEach(engineerKey => {
      monthlyMatrix[engineerKey] = {};
      const engEndDate = endDateMap[engineerKey] || null;
      months.forEach(month => {
        const monthProjects: { [project: string]: number } = {};
        let totalHours = 0;
        
        month.weeks.forEach(week => {
          // Check departure
          if (engEndDate && isEngineerDepartedForWeek(engEndDate, week)) {
            monthProjects['DEPARTED'] = (monthProjects['DEPARTED'] || 0) + 0;
            return;
          }
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
  }, [planningData, endDateMap]);

  // Get display data based on view mode
  const displayData = viewMode === 'weeks' ? matrixData : monthlyData;

  // All engineers list for custom selection - must be after displayData
  const allEngineersList = useMemo(() => {
    const allNames = Object.keys(displayData)
      .map(key => displayNameMap[key] || key)
      .sort((a, b) => a.localeCompare(b, 'cs'));
    return allNames;
  }, [displayData, displayNameMap]);

  // Toggle custom engineer selection
  const toggleCustomEngineer = (engineer: string) => {
    setSelectedCustomEngineers(prev => 
      prev.includes(engineer) 
        ? prev.filter(e => e !== engineer)
        : [...prev, engineer]
    );
    setSelectedViewId(null); // Clear selected view when manually editing
  };

  // Load a saved custom view
  const loadCustomView = (viewId: string) => {
    const view = customViews.find(v => v.id === viewId);
    if (view) {
      setSelectedCustomEngineers(view.engineers);
      setSelectedViewId(viewId);
      setFilterMode('custom');
    }
  };

  // Save current selection as a new view
  const handleSaveView = async () => {
    if (!customViewName.trim() || selectedCustomEngineers.length === 0) return;
    
    const success = await saveView(customViewName.trim(), selectedCustomEngineers);
    if (success) {
      setCustomViewName('');
    }
  };

  // Delete a custom view
  const handleDeleteView = async (viewId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteView(viewId);
    if (selectedViewId === viewId) {
      setSelectedViewId(null);
      setSelectedCustomEngineers([]);
    }
  };

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
            const engineerProject = matrixData[engineer][week]?.projekt;
            return projects.includes(engineerProject);
          });
        });
      }
    }
    
    if (viewMode === 'weeks') {
      
      // Filter by program OR custom selection
      if (filterMode === 'custom') {
        // Custom selection - filter by selected engineers
        if (selectedCustomEngineers.length > 0) {
          engineers = engineers.filter(engineer => {
            const displayName = displayNameMap[engineer] || engineer;
            return selectedCustomEngineers.includes(displayName);
          });
        }
      } else if (!filterProgram.includes('Všichni')) {
        engineers = engineers.filter(engineer => {
          return weeks.some(week => {
            const project = matrixData[engineer][week]?.projekt;
            // Non-project states (FREE, DOVOLENÁ, NEMOC, OVER) are considered as NA program
            const nonProjectStates = ['FREE', 'DOVOLENÁ', 'NEMOC', 'OVER'];
            if (nonProjectStates.includes(project)) {
              return filterProgram.includes('NA');
            }
            return projektInfo[project]?.program && filterProgram.includes(projektInfo[project].program);
          });
        });
      }
    } else {
      // Monthly view filters
      
      // Filter by program OR custom selection
      if (filterMode === 'custom') {
        // Custom selection - filter by selected engineers
        if (selectedCustomEngineers.length > 0) {
          engineers = engineers.filter(engineer => {
            const displayName = displayNameMap[engineer] || engineer;
            return selectedCustomEngineers.includes(displayName);
          });
        }
      } else if (!filterProgram.includes('Všichni')) {
        engineers = engineers.filter(engineer => {
          return months.some(month => {
            const monthData = monthlyData[engineer][month.name];
            return monthData.projects.some(project => {
              // Non-project states (FREE, DOVOLENÁ, NEMOC, OVER) are considered as NA program
              const nonProjectStates = ['FREE', 'DOVOLENÁ', 'NEMOC', 'OVER'];
              if (nonProjectStates.includes(project)) {
                return filterProgram.includes('NA');
              }
              return projektInfo[project]?.program && filterProgram.includes(projektInfo[project].program);
            });
          });
        });
      }
    }
    
    return engineers.sort();
  }, [displayData, matrixData, monthlyData, viewMode, filterSpolecnost, filterProgram, weekFilters, displayNameMap, filterMode, selectedCustomEngineers]);

  // Helper: Get engineers allocated to a project in a specific week with details (respects current filters)
  const getEngineersForProjectInWeek = useCallback((projectName: string, week: string): { name: string; isTentative: boolean; hours: number }[] => {
    return filteredEngineers.filter(engineer => {
      const projectData = matrixData[engineer][week];
      return projectData?.projekt === projectName;
    }).map(engineer => {
      const projectData = matrixData[engineer][week];
      return {
        name: displayNameMap[engineer] || engineer,
        isTentative: projectData?.isTentative || false,
        hours: projectData?.hours || 0
      };
    });
  }, [matrixData, displayNameMap, filteredEngineers]);

  // Helper: Get engineers allocated to a project in a specific month with details (respects current filters)
  const getEngineersForProjectInMonth = useCallback((projectName: string, monthName: string, monthWeeks: string[]): { name: string; isTentative: boolean; hours: number; isPartial: boolean }[] => {
    return filteredEngineers.filter(engineer => {
      const monthData = monthlyData[engineer][monthName];
      return monthData?.projects.includes(projectName);
    }).map(engineer => {
      // Calculate total hours and check tentative status across all weeks in the month
      let totalHours = 0;
      let isTentative = false;
      let weeksOnProject = 0;
      
      monthWeeks.forEach(week => {
        const projectData = matrixData[engineer]?.[week];
        if (projectData?.projekt === projectName) {
          totalHours += projectData.hours || 0;
          if (projectData.isTentative) isTentative = true;
          weeksOnProject++;
        }
      });
      
      return {
        name: displayNameMap[engineer] || engineer,
        isTentative,
        hours: totalHours,
        isPartial: weeksOnProject < monthWeeks.length // Not on project for all weeks in month
      };
    });
  }, [monthlyData, matrixData, displayNameMap, filteredEngineers]);

  // Get all allocations for a specific project across all weeks (for dialog)
  const getAllocationsForProject = useCallback((projectName: string): AllocationEntry[] => {
    const allocations: AllocationEntry[] = [];
    const alternativeActivities = ['DOVOLENÁ', 'NEMOC', 'OVER'];
    const regimeProjects = ['FREE', 'DOVOLENÁ', 'NEMOC', 'OVER'];
    
    // First pass: find engineers with at least one allocation on this project
    const engineersOnProject = new Set<string>();
    filteredEngineers.forEach(engineer => {
      weeks.forEach(week => {
        const projectData = matrixData[engineer][week];
        if (projectData?.projekt === projectName && projectData.hours > 0) {
          engineersOnProject.add(engineer);
        }
      });
    });

    // For FREE project: also find engineers with partial capacity (<40h on non-regime projects)
    if (projectName === 'FREE') {
      filteredEngineers.forEach(engineer => {
        weeks.forEach(week => {
          const projectData = matrixData[engineer][week];
          if (projectData?.projekt && !regimeProjects.includes(projectData.projekt) && projectData.hours > 0 && projectData.hours < 30) {
            engineersOnProject.add(engineer);
          }
        });
      });
    }
    
    // Second pass: for these engineers, add entries for all weeks
    engineersOnProject.forEach(engineer => {
      weeks.forEach(week => {
        const projectData = matrixData[engineer][week];
        if (projectData?.projekt === projectName && projectData.hours > 0) {
          allocations.push({
            engineer: displayNameMap[engineer] || engineer,
            week,
            hours: projectData.hours,
            isTentative: projectData.isTentative || false
          });
        } else if (projectName === 'FREE' && projectData?.projekt && !regimeProjects.includes(projectData.projekt) && projectData.hours > 0 && projectData.hours < 30) {
          // Add partial free capacity entry
          allocations.push({
            engineer: displayNameMap[engineer] || engineer,
            week,
            hours: 40 - projectData.hours,
            isTentative: false,
            isPartialFree: true
          });
        } else if (projectData?.projekt && alternativeActivities.includes(projectData.projekt)) {
          // Add alternative activity entry (vacation, sick leave, overtime)
          allocations.push({
            engineer: displayNameMap[engineer] || engineer,
            week,
            hours: 0,
            isTentative: false,
            alternativeActivity: projectData.projekt
          });
        }
      });
    });
    
    return allocations;
  }, [matrixData, displayNameMap, filteredEngineers, weeks]);

  // Handle project click to open allocation dialog
  const handleProjectClick = useCallback((projectName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProject(projectName);
    setProjectDialogOpen(true);
  }, []);

  return (
    <TooltipProvider delayDuration={200}>
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              {customerViewMode ? 'Přehled kapacit' : 'Matice plánování projektů'}
            </CardTitle>
            <div className="flex items-center gap-2">
              {!customerViewMode && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setHistoryDialogOpen(true)}
                  className="gap-2"
                >
                  <History className="h-4 w-4" />
                  Historie změn
                </Button>
              )}
              {!customerViewMode && (
                <>
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
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters - hidden in customer view */}
          {!customerViewMode && (
          <div className="grid grid-cols-2 gap-4 mb-6">
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
              <label className="text-sm font-medium mb-2 block">Program / Vlastní</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {filterMode === 'custom' 
                      ? (selectedViewId 
                          ? `📁 ${customViews.find(v => v.id === selectedViewId)?.name || 'Vlastní'}` 
                          : `Vlastní (${selectedCustomEngineers.length})`)
                      : getFilterDisplayText(filterProgram)}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-2">
                    {/* Standard programs */}
                    <div className="text-xs font-medium text-muted-foreground mb-1 px-2">Programy</div>
                    {programyList.map(program => (
                      <div key={program} className="flex items-center space-x-2 py-1.5 px-2 rounded hover:bg-muted/50">
                        <Checkbox
                          id={`program-${program}`}
                          checked={filterMode === 'program' && isFilterActive(filterProgram, program)}
                          onCheckedChange={() => {
                            setFilterMode('program');
                            setSelectedViewId(null);
                            toggleFilterValue(filterProgram, program, setFilterProgram);
                          }}
                        />
                        <label htmlFor={`program-${program}`} className="text-sm cursor-pointer flex-1">
                          {program}
                        </label>
                      </div>
                    ))}
                    
                    <Separator className="my-2" />
                    
                    {/* Custom option */}
                    <div className="flex items-center space-x-2 py-1.5 px-2 rounded hover:bg-muted/50">
                      <Checkbox
                        id="program-custom"
                        checked={filterMode === 'custom'}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilterMode('custom');
                          } else {
                            setFilterMode('program');
                            setSelectedCustomEngineers([]);
                            setSelectedViewId(null);
                          }
                        }}
                      />
                      <label htmlFor="program-custom" className="text-sm cursor-pointer flex-1 flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Vlastní výběr konstruktérů
                      </label>
                    </div>
                    
                    {/* Custom selection panel */}
                    {filterMode === 'custom' && (
                      <div className="mt-2 pt-2 border-t border-border">
                        {/* Saved views dropdown */}
                        {customViews.length > 0 && (
                          <div className="mb-3 px-2">
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Uložené pohledy:</label>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {customViews.map(view => (
                                <div 
                                  key={view.id}
                                  onClick={() => loadCustomView(view.id)}
                                  className={`flex items-center justify-between py-1.5 px-2 rounded cursor-pointer text-sm ${
                                    selectedViewId === view.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                                  }`}
                                >
                                  <span className="truncate flex-1">
                                    📁 {view.name} ({view.engineers.length})
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                    onClick={(e) => handleDeleteView(view.id, e)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Engineer selection */}
                        <div className="px-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-medium text-muted-foreground">Konstruktéři:</label>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-5 text-xs px-1"
                                onClick={() => setSelectedCustomEngineers(allEngineersList)}
                              >
                                Vše
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-5 text-xs px-1"
                                onClick={() => {
                                  setSelectedCustomEngineers([]);
                                  setSelectedViewId(null);
                                }}
                              >
                                Nic
                              </Button>
                            </div>
                          </div>
                          <ScrollArea className="h-48 border rounded p-1">
                            {allEngineersList.map(engineer => (
                              <div 
                                key={engineer} 
                                className="flex items-center space-x-2 py-1 px-2 hover:bg-muted/50 rounded"
                              >
                                <Checkbox
                                  id={`custom-engineer-${engineer}`}
                                  checked={selectedCustomEngineers.includes(engineer)}
                                  onCheckedChange={() => toggleCustomEngineer(engineer)}
                                />
                                <label 
                                  htmlFor={`custom-engineer-${engineer}`} 
                                  className="text-xs cursor-pointer flex-1 truncate"
                                >
                                  {engineer}
                                </label>
                              </div>
                            ))}
                          </ScrollArea>
                        </div>
                        
                        {/* Save view */}
                        <div className="mt-3 px-2 flex gap-2">
                          <Input 
                            placeholder="Název pohledu..."
                            value={customViewName}
                            onChange={(e) => setCustomViewName(e.target.value)}
                            className="text-sm h-8"
                          />
                          <Button 
                            size="sm" 
                            className="h-8 px-3"
                            onClick={handleSaveView} 
                            disabled={!customViewName.trim() || selectedCustomEngineers.length === 0}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Uložit
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          )}

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
                    <th className="border-2 border-border p-1 bg-background text-left sticky left-0 sticky top-0 z-30 min-w-[140px] font-semibold text-xs">
                      Konstruktér
                    </th>
                    {months.map((month, monthIndex) => (
                      <th 
                        key={month.name} 
                        className={`border-2 border-border p-1 bg-background text-center font-bold text-xs min-w-[70px] sticky top-0 z-20 ${
                          monthIndex > 0 ? 'border-l-4 border-l-primary/50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          <span className="text-primary">{getShortMonthName(month.name)}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody>
                {filteredEngineers.map((engineer, index) => (
                  <tr key={engineer} className={`transition-colors hover:bg-muted/20 ${index % 2 === 1 ? 'bg-muted/30' : 'bg-background'}`}>
                    <td className="border border-border p-1 font-semibold sticky left-0 bg-inherit z-10 text-foreground text-xs">
                      {displayNameMap[engineer] || engineer}
                    </td>
                    {viewMode === 'weeks' ? (
                      months.map((month, monthIndex) => 
                        month.weeks.map((week, weekIndex) => {
                          const projectData = matrixData[engineer][week];
                          const project = projectData?.projekt;
                          const isTentative = projectData?.isTentative;
                          const hours = projectData?.hours || 0;
                          const isLowCapacity = hours > 0 && hours <= 35;
                          return (
                            <td 
                              key={week} 
                              className={`border border-border p-1 text-center ${
                                monthIndex > 0 && weekIndex === 0 ? 'border-l-4 border-l-primary/50' : ''
                              }`}
                            >
                            {project === 'DEPARTED' ? (
                                <div className="text-xs px-1.5 py-0.5 w-full justify-center font-medium rounded-md inline-flex items-center cursor-not-allowed bg-gray-200 dark:bg-gray-800">
                                  <X className="h-3.5 w-3.5 text-red-500" />
                                </div>
                              ) : project && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div 
                                      onClick={(e) => handleProjectClick(project, e)}
                                      className={`text-xs px-1.5 py-0.5 w-full justify-center font-medium shadow-sm hover:shadow-md transition-all duration-200 rounded-md inline-flex items-center cursor-pointer ${getProjectBadgeStyle(project)} ${
                                        isTentative ? 'border-[3px] border-dashed !border-yellow-400' : (isLowCapacity ? 'border-[3px] border-dashed !border-red-500' : '')
                                      }`}
                                    >
                                      <span className="truncate max-w-[65px]" title={project}>
                                        {project}
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-[350px]">
                                    {(() => {
                                      const engineers = getEngineersForProjectInWeek(project, week);
                                      const tentativeCount = engineers.filter(e => e.isTentative).length;
                                      const partialCount = engineers.filter(e => e.hours > 0 && e.hours < 35).length;
                                      const fullCount = engineers.filter(e => e.hours >= 35).length;
                                      const isFreeProject = project === 'FREE';
                                      const totalHours = engineers.reduce((sum, e) => sum + e.hours, 0);
                                      return (
                                        <div className="text-sm">
                                          <div className="font-semibold mb-1">{project} - {week}</div>
                                          <div className="text-xs text-muted-foreground mb-2 space-y-0.5">
                                            <div>{isFreeProject ? 'Volných:' : 'Alokováno:'} {engineers.length} konstruktérů</div>
                                            <div className="text-blue-400">📊 Celkem: {totalHours}h</div>
                                            {fullCount > 0 && (
                                              <div className="text-green-500">● {isFreeProject ? 'Volné kapacity' : 'Plně vytížení'}: {fullCount}</div>
                                            )}
                                            {partialCount > 0 && (
                                              <div className="text-orange-400">◐ Částečně: {partialCount}</div>
                                            )}
                                            {tentativeCount > 0 && (
                                              <div className="text-yellow-400">⚠ Předběžně: {tentativeCount}</div>
                                            )}
                                          </div>
                                          <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto">
                                            {engineers.map(eng => (
                                              <div key={eng.name} className="text-xs flex items-center gap-1.5">
                                                <span className={eng.isTentative ? 'text-yellow-400' : ''}>{eng.name}</span>
                                                {eng.hours >= 35 ? (
                                                  <span className="text-green-500 text-[10px]">{isFreeProject ? '(volný)' : '(plně)'}</span>
                                                ) : eng.hours > 0 && (
                                                  <span className="text-orange-400 text-[10px]">({eng.hours}h)</span>
                                                )}
                                                {eng.isTentative && (
                                                  <span className="text-yellow-400 text-[10px]">(předběžně)</span>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </TooltipContent>
                                </Tooltip>
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
                             className={`border border-border p-0.5 text-center align-top ${
                               monthIndex > 0 ? 'border-l-4 border-l-primary/50' : ''
                             }`}
                           >
                              {hasProjects && (
                                <div className="flex flex-col gap-1">
                                  {/* Main project */}
                                  {(() => {
                                    const mainProject = sortedProjects[0];
                                    
                                    // DEPARTED — show ✕ icon
                                    if (mainProject === 'DEPARTED') {
                                      return (
                                        <div className="text-xs px-1.5 py-0.5 w-full justify-center font-medium rounded-md inline-flex items-center cursor-not-allowed bg-gray-200 dark:bg-gray-800">
                                          <X className="h-3.5 w-3.5 text-red-500" />
                                        </div>
                                      );
                                    }
                                    
                                    const showText = isProjectVisibleForCustomer(mainProject, customerViewMode);
                                    
                                    const badgeContent = (
                                      <div 
                                        onClick={customerViewMode ? undefined : (e) => handleProjectClick(mainProject, e)}
                                        className={`text-xs px-1.5 py-0.5 w-full justify-center font-medium shadow-sm ${!customerViewMode ? 'hover:shadow-md cursor-pointer' : ''} transition-all duration-200 rounded-md inline-flex items-center ${getProjectBadgeStyle(mainProject)}`}
                                      >
                                        {showText ? (
                                          <span className="truncate max-w-[55px]" title={mainProject}>
                                            {mainProject}
                                          </span>
                                        ) : (
                                          <span className="opacity-0">-</span>
                                        )}
                                      </div>
                                    );
                                    
                                    // In customer view, no tooltip
                                    if (customerViewMode) {
                                      return badgeContent;
                                    }
                                    
                                    // Normal view with tooltip
                                    return (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          {badgeContent}
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-[350px]">
                                          {(() => {
                                            const engineers = getEngineersForProjectInMonth(mainProject, month.name, month.weeks);
                                            const tentativeCount = engineers.filter(e => e.isTentative).length;
                                            const avgHoursPerWeek = month.weeks.length > 0 ? engineers.map(e => e.hours / month.weeks.length) : [];
                                            const fullCount = engineers.filter((e, i) => avgHoursPerWeek[i] >= 35).length;
                                            const partialCount = engineers.filter((e, i) => avgHoursPerWeek[i] > 0 && avgHoursPerWeek[i] < 35).length;
                                            const totalHours = engineers.reduce((sum, e) => sum + e.hours, 0);
                                            const avgHoursPerWeekTotal = month.weeks.length > 0 ? Math.round(totalHours / month.weeks.length) : totalHours;
                                            const isFreeProject = mainProject === 'FREE';
                                            return (
                                              <div className="text-sm">
                                                <div className="font-semibold mb-1">{mainProject} - {month.name}</div>
                                                <div className="text-xs text-muted-foreground mb-2 space-y-0.5">
                                                  <div>{isFreeProject ? 'Volných:' : 'Alokováno:'} {engineers.length} konstruktérů</div>
                                                  <div className="text-blue-400">📊 Celkem: {totalHours}h ({avgHoursPerWeekTotal}h/týden)</div>
                                                  {fullCount > 0 && (
                                                    <div className="text-green-500">● {isFreeProject ? 'Volné kapacity' : 'Plně vytížení'}: {fullCount}</div>
                                                  )}
                                                  {partialCount > 0 && (
                                                    <div className="text-orange-400">◐ Částečně: {partialCount}</div>
                                                  )}
                                                  {tentativeCount > 0 && (
                                                    <div className="text-yellow-400">⚠ Předběžně: {tentativeCount}</div>
                                                  )}
                                                </div>
                                                <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto">
                                                  {engineers.map((eng, i) => {
                                                    const avgHours = avgHoursPerWeek[i] || 0;
                                                    return (
                                                      <div key={eng.name} className="text-xs flex items-center gap-1.5">
                                                        <span className={eng.isTentative ? 'text-yellow-400' : ''}>{eng.name}</span>
                                                        {avgHours >= 35 ? (
                                                          <span className="text-green-500 text-[10px]">(plně)</span>
                                                        ) : avgHours > 0 && (
                                                          <span className="text-orange-400 text-[10px]">({Math.round(avgHours)}h/t)</span>
                                                        )}
                                                        {eng.isTentative && (
                                                          <span className="text-yellow-400 text-[10px]">(předběžně)</span>
                                                        )}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            );
                                          })()}
                                        </TooltipContent>
                                      </Tooltip>
                                    );
                                  })()}
                                  
                                  {/* Additional projects */}
                                  {sortedProjects.slice(1).map((project, index) => {
                                    const showText = isProjectVisibleForCustomer(project, customerViewMode);
                                    
                                    const badgeContent = (
                                      <div 
                                        onClick={customerViewMode ? undefined : (e) => handleProjectClick(project, e)}
                                        className={`text-xs px-1 py-0.5 w-full justify-center font-normal opacity-75 rounded-sm inline-flex items-center ${!customerViewMode ? 'cursor-pointer' : ''} ${getProjectBadgeStyle(project)}`}
                                      >
                                        {showText ? (
                                          <span className="truncate max-w-[85px] text-xs" title={project}>
                                            {project}
                                          </span>
                                        ) : (
                                          <span className="opacity-0">-</span>
                                        )}
                                      </div>
                                    );
                                    
                                    // In customer view, no tooltip
                                    if (customerViewMode) {
                                      return <React.Fragment key={index}>{badgeContent}</React.Fragment>;
                                    }
                                    
                                    // Normal view with tooltip
                                    return (
                                      <Tooltip key={index}>
                                        <TooltipTrigger asChild>
                                          {badgeContent}
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-[350px]">
                                          {(() => {
                                            const engineers = getEngineersForProjectInMonth(project, month.name, month.weeks);
                                            const tentativeCount = engineers.filter(e => e.isTentative).length;
                                            const avgHoursPerWeek = month.weeks.length > 0 ? engineers.map(e => e.hours / month.weeks.length) : [];
                                            const fullCount = engineers.filter((e, i) => avgHoursPerWeek[i] >= 35).length;
                                            const partialCount = engineers.filter((e, i) => avgHoursPerWeek[i] > 0 && avgHoursPerWeek[i] < 35).length;
                                            const totalHours = engineers.reduce((sum, e) => sum + e.hours, 0);
                                            const avgHoursPerWeekTotal = month.weeks.length > 0 ? Math.round(totalHours / month.weeks.length) : totalHours;
                                            const isFreeProject = project === 'FREE';
                                            return (
                                              <div className="text-sm">
                                                <div className="font-semibold mb-1">{project} - {month.name}</div>
                                                <div className="text-xs text-muted-foreground mb-2 space-y-0.5">
                                                  <div>{isFreeProject ? 'Volných:' : 'Alokováno:'} {engineers.length} konstruktérů</div>
                                                  <div className="text-blue-400">📊 Celkem: {totalHours}h ({avgHoursPerWeekTotal}h/týden)</div>
                                                  {fullCount > 0 && (
                                                    <div className="text-green-500">● {isFreeProject ? 'Volné kapacity' : 'Plně vytížení'}: {fullCount}</div>
                                                  )}
                                                  {partialCount > 0 && (
                                                    <div className="text-orange-400">◐ Částečně: {partialCount}</div>
                                                  )}
                                                  {tentativeCount > 0 && (
                                                    <div className="text-yellow-400">⚠ Předběžně: {tentativeCount}</div>
                                                  )}
                                                </div>
                                                <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto">
                                                  {engineers.map((eng, i) => {
                                                    const avgHours = avgHoursPerWeek[i] || 0;
                                                    return (
                                                      <div key={eng.name} className="text-xs flex items-center gap-1.5">
                                                        <span className={eng.isTentative ? 'text-yellow-400' : ''}>{eng.name}</span>
                                                        {avgHours >= 35 ? (
                                                          <span className="text-green-500 text-[10px]">(plně)</span>
                                                        ) : avgHours > 0 && (
                                                          <span className="text-orange-400 text-[10px]">({Math.round(avgHours)}h/t)</span>
                                                        )}
                                                        {eng.isTentative && (
                                                          <span className="text-yellow-400 text-[10px]">(předběžně)</span>
                                                        )}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            );
                                          })()}
                                        </TooltipContent>
                                      </Tooltip>
                                    );
                                  })}
                                </div>
                              )}
                           </td>
                        );
                      })
                    )}
                  </tr>
                ))}
                {/* Summary row for free capacity */}
                <tr className="bg-primary/5 border-t-2 border-primary/30">
                  <td className="border border-border p-2 font-bold sticky left-0 bg-primary/5 z-10 text-foreground text-sm">
                    Volné kapacity min.
                  </td>
                  {viewMode === 'weeks' ? (
                    months.map((month, monthIndex) => 
                      month.weeks.map((week, weekIndex) => {
                        // Count FREE engineers for this week
                        const freeCount = filteredEngineers.filter(engineer => {
                          const projectData = matrixData[engineer][week];
                          return projectData?.projekt === 'FREE';
                        }).length;
                        
                        return (
                          <td 
                            key={week} 
                            className={`border border-border p-1 text-center font-semibold ${
                              monthIndex > 0 && weekIndex === 0 ? 'border-l-4 border-l-primary/50' : ''
                            }`}
                          >
                            <div className="text-sm text-foreground">
                              {freeCount}
                            </div>
                          </td>
                        );
                      })
                    )
                  ) : (
                    months.map((month, monthIndex) => {
                      // Count engineers with FREE as dominant project for this month
                      const freeCount = filteredEngineers.filter(engineer => {
                        const monthData = monthlyData[engineer][month.name];
                        return monthData?.dominantProject === 'FREE';
                      }).length;
                      
                      return (
                        <td 
                          key={month.name} 
                          className={`border border-border p-1.5 text-center font-semibold ${
                            monthIndex > 0 ? 'border-l-4 border-l-primary/50' : ''
                          }`}
                        >
                          <div className="text-sm text-foreground">
                            {freeCount}
                          </div>
                        </td>
                      );
                    })
                  )}
                </tr>
                {/* Summary row for max free capacity (FREE + tentative) - hide in customer view */}
                {!customerViewMode && (
                <tr className="bg-primary/5 border-t border-primary/20">
                  <td className="border border-border p-2 font-bold sticky left-0 bg-primary/5 z-10 text-foreground text-sm">
                    Volné kapacity max.
                  </td>
                  {viewMode === 'weeks' ? (
                    months.map((month, monthIndex) => 
                      month.weeks.map((week, weekIndex) => {
                        // Count FREE engineers + tentative engineers for this week
                        const freeMaxCount = filteredEngineers.filter(engineer => {
                          const projectData = matrixData[engineer][week];
                          return projectData?.projekt === 'FREE' || projectData?.isTentative === true;
                        }).length;
                        
                        return (
                          <td 
                            key={week} 
                            className={`border border-border p-1 text-center font-semibold ${
                              monthIndex > 0 && weekIndex === 0 ? 'border-l-4 border-l-primary/50' : ''
                            }`}
                          >
                            <div className="text-sm text-foreground">
                              {freeMaxCount}
                            </div>
                          </td>
                        );
                      })
                    )
                  ) : (
                    months.map((month, monthIndex) => {
                      // Count engineers with FREE or tentative as dominant project for this month
                      const freeMaxCount = filteredEngineers.filter(engineer => {
                        const monthData = monthlyData[engineer][month.name];
                        // Check if dominant project is FREE or if any week in month is tentative
                        if (monthData?.dominantProject === 'FREE') return true;
                        
                        // Check if any week in this month has tentative planning
                        return month.weeks.some(week => {
                          const projectData = matrixData[engineer][week];
                          return projectData?.isTentative === true;
                        });
                      }).length;
                      
                      return (
                        <td 
                          key={month.name} 
                          className={`border border-border p-1.5 text-center font-semibold ${
                            monthIndex > 0 ? 'border-l-4 border-l-primary/50' : ''
                          }`}
                        >
                          <div className="text-sm text-foreground">
                            {freeMaxCount}
                          </div>
                        </td>
                      );
                    })
                  )}
                </tr>
                )}
                {/* Summary row for project hours - hide in customer view */}
                {!customerViewMode && (
                <tr className="bg-secondary/10 border-t-2 border-secondary/30">
                  <td className="border border-border p-2 font-bold sticky left-0 bg-secondary/10 z-10 text-foreground text-sm">
                    Počet hodin
                  </td>
                  {viewMode === 'weeks' ? (
                    months.map((month, monthIndex) => 
                      month.weeks.map((week, weekIndex) => {
                        // Sum project hours for this week (excluding FREE, DOVOLENÁ, OVER)
                        const totalHours = filteredEngineers.reduce((sum, engineer) => {
                          const projectData = matrixData[engineer][week];
                          const project = projectData?.projekt;
                          const hours = projectData?.hours || 0;
                          if (project === 'FREE' || project === 'DOVOLENÁ' || project === 'OVER') {
                            return sum;
                          }
                          return sum + hours;
                        }, 0);
                        
                        return (
                          <td 
                            key={week} 
                            className={`border border-border p-1 text-center font-semibold ${
                              monthIndex > 0 && weekIndex === 0 ? 'border-l-4 border-l-primary/50' : ''
                            }`}
                          >
                            <div className="text-sm text-foreground">
                              {totalHours}h
                            </div>
                          </td>
                        );
                      })
                    )
                  ) : (
                    months.map((month, monthIndex) => {
                      // Parse month info
                      const monthMapLocal: { [key: string]: number } = {
                        'leden': 1, 'únor': 2, 'březen': 3, 'duben': 4, 'květen': 5, 'červen': 6,
                        'červenec': 7, 'srpen': 8, 'září': 9, 'říjen': 10, 'listopad': 11, 'prosinec': 12
                      };
                      const [mName, yStr] = month.name.toLowerCase().split(' ');
                      const mNum = monthMapLocal[mName];
                      const mYear = parseInt(yStr);
                      
                      // Proportional hours: for each week, split hours into this month
                      let totalHours = 0;
                      month.weeks.forEach(week => {
                        const cwMatch = week.match(/CW(\d+)-(\d+)/);
                        if (!cwMatch) return;
                        const cwNum = parseInt(cwMatch[1]);
                        const wYear = parseInt(cwMatch[2]);
                        const weekMonday = getISOWeekMonday(cwNum, wYear);
                        
                        filteredEngineers.forEach(engineer => {
                          const projectData = matrixData[engineer][week];
                          const project = projectData?.projekt;
                          const hours = projectData?.hours || 0;
                          if (project === 'FREE' || project === 'DOVOLENÁ' || project === 'OVER') return;
                          
                          const isSlovak = getEngineerCompany(displayNameMap[engineer] || engineer) === 'MB Idea';
                          const daysInMonth = getWorkingDaysInWeekForMonth(weekMonday, mYear, mNum, isSlovak);
                          const totalWeekDays = getWorkingDaysInCW(cwNum, wYear, isSlovak);
                          const proportion = totalWeekDays > 0 ? daysInMonth / totalWeekDays : 0;
                          totalHours += hours * proportion;
                        });
                      });
                      
                      return (
                        <td 
                          key={month.name} 
                          className={`border border-border p-1.5 text-center font-semibold ${
                            monthIndex > 0 ? 'border-l-4 border-l-primary/50' : ''
                          }`}
                        >
                          <div className="text-sm text-foreground">
                            {Math.round(totalHours)}h
                          </div>
                        </td>
                      );
                    })
                  )}
                </tr>
                )}
                {/* Summary row for FTE - hide in customer view */}
                {!customerViewMode && (
                <tr className="bg-secondary/10 border-t border-secondary/20">
                  <td className="border border-border p-2 font-bold sticky left-0 bg-secondary/10 z-10 text-foreground text-sm">
                    Celkem FTE
                  </td>
                  {viewMode === 'weeks' ? (
                    months.map((month, monthIndex) => 
                      month.weeks.map((week, weekIndex) => {
                        const totalHours = filteredEngineers.reduce((sum, engineer) => {
                          const projectData = matrixData[engineer][week];
                          const project = projectData?.projekt;
                          const hours = projectData?.hours || 0;
                          if (project === 'FREE' || project === 'DOVOLENÁ' || project === 'OVER') {
                            return sum;
                          }
                          return sum + hours;
                        }, 0);
                        const cwMatch = week.match(/CW(\d+)/);
                        const cwNum = cwMatch ? parseInt(cwMatch[1]) : 0;
                        const weekYear = parseInt(week.split('-').pop() || String(new Date().getFullYear()));
                        const workingDays = cwNum > 0 ? getWorkingDaysInCW(cwNum, weekYear) : 5;
                        const fte = (totalHours / (workingDays * 8)).toFixed(1);
                        return (
                          <td 
                            key={week} 
                            className={`border border-border p-1 text-center font-semibold ${
                              monthIndex > 0 && weekIndex === 0 ? 'border-l-4 border-l-primary/50' : ''
                            }`}
                          >
                            <div className="text-sm text-foreground">
                              {fte}
                            </div>
                          </td>
                        );
                      })
                    )
                  ) : (
                    months.map((month, monthIndex) => {
                      const monthMapLocal: { [key: string]: number } = {
                        'leden': 1, 'únor': 2, 'březen': 3, 'duben': 4, 'květen': 5, 'červen': 6,
                        'červenec': 7, 'srpen': 8, 'září': 9, 'říjen': 10, 'listopad': 11, 'prosinec': 12
                      };
                      const [mName, yStr] = month.name.toLowerCase().split(' ');
                      const mNum = monthMapLocal[mName];
                      const mYear = parseInt(yStr);
                      
                      // Proportional hours
                      let totalHours = 0;
                      let totalCapacity = 0;
                      
                      filteredEngineers.forEach(engineer => {
                        const isSlovak = getEngineerCompany(displayNameMap[engineer] || engineer) === 'MB Idea';
                        const workingDays = getWorkingDaysInMonth(mYear, mNum, isSlovak);
                        totalCapacity += workingDays * 8;
                      });
                      
                      month.weeks.forEach(week => {
                        const cwMatch = week.match(/CW(\d+)-(\d+)/);
                        if (!cwMatch) return;
                        const cwNum = parseInt(cwMatch[1]);
                        const wYear = parseInt(cwMatch[2]);
                        const weekMonday = getISOWeekMonday(cwNum, wYear);
                        
                        filteredEngineers.forEach(engineer => {
                          const projectData = matrixData[engineer][week];
                          const project = projectData?.projekt;
                          const hours = projectData?.hours || 0;
                          if (project === 'FREE' || project === 'DOVOLENÁ' || project === 'OVER') return;
                          
                          const isSlovak = getEngineerCompany(displayNameMap[engineer] || engineer) === 'MB Idea';
                          const daysInMonth = getWorkingDaysInWeekForMonth(weekMonday, mYear, mNum, isSlovak);
                          const totalWeekDays = getWorkingDaysInCW(cwNum, wYear, isSlovak);
                          const proportion = totalWeekDays > 0 ? daysInMonth / totalWeekDays : 0;
                          totalHours += hours * proportion;
                        });
                      });
                      
                      const fte = totalCapacity > 0 ? (totalHours / totalCapacity * filteredEngineers.length).toFixed(1) : '0.0';
                      
                      return (
                        <td 
                          key={month.name} 
                          className={`border border-border p-1.5 text-center font-semibold ${
                            monthIndex > 0 ? 'border-l-4 border-l-primary/50' : ''
                          }`}
                        >
                          <div className="text-sm text-foreground">
                            {fte}
                          </div>
                        </td>
                      );
                    })
                  )}
                </tr>
                )}
                {/* Summary row for utilization percentage - hide in customer view */}
                {!customerViewMode && (
                <tr className="bg-accent/10 border-t-2 border-accent/30">
                  <td className="border border-border p-2 font-bold sticky left-0 bg-accent/10 z-10 text-foreground text-sm">
                    Vytížení
                  </td>
                  {viewMode === 'weeks' ? (
                    months.map((month, monthIndex) => 
                      month.weeks.map((week, weekIndex) => {
                        // Calculate utilization percentage
                        const maxCapacity = filteredEngineers.length * 40;
                        const actualHours = filteredEngineers.reduce((sum, engineer) => {
                          const projectData = matrixData[engineer][week];
                          const project = projectData?.projekt;
                          const hours = projectData?.hours || 0;
                          // Don't count FREE, DOVOLENÁ, OVER
                          if (project === 'FREE' || project === 'DOVOLENÁ' || project === 'OVER') {
                            return sum;
                          }
                          return sum + hours;
                        }, 0);
                        const utilization = maxCapacity > 0 ? Math.round((actualHours / maxCapacity) * 100) : 0;
                        
                        return (
                          <td 
                            key={week} 
                            className={`border border-border p-1 text-center font-semibold ${
                              monthIndex > 0 && weekIndex === 0 ? 'border-l-4 border-l-primary/50' : ''
                            }`}
                          >
                            <div className="text-sm text-foreground">
                              {utilization}%
                            </div>
                          </td>
                        );
                      })
                    )
                  ) : (
                    months.map((month, monthIndex) => {
                      // Parse month to get year and month number
                      const monthMap: { [key: string]: number } = {
                        'leden': 1, 'únor': 2, 'březen': 3, 'duben': 4, 'květen': 5, 'červen': 6,
                        'červenec': 7, 'srpen': 8, 'září': 9, 'říjen': 10, 'listopad': 11, 'prosinec': 12
                      };
                      const [monthName, yearStr] = month.name.toLowerCase().split(' ');
                      const monthNum = monthMap[monthName];
                      const year = parseInt(yearStr);
                      
                      // Calculate proportional hours and capacity
                      let totalMaxCapacity = 0;
                      let totalActualHours = 0;
                      
                      filteredEngineers.forEach(engineer => {
                        const engineerCompany = getEngineerCompany(engineer);
                        const isSlovak = engineerCompany === 'MB Idea';
                        
                        // Calculate engineer's total capacity for the month
                        const workingDays = getWorkingDaysFromMonthName(month.name, isSlovak);
                        totalMaxCapacity += workingDays * 8; // 8 hours per day
                        
                        // Sum proportional hours from each week
                        month.weeks.forEach(week => {
                          const projectData = matrixData[engineer][week];
                          const project = projectData?.projekt;
                          const weeklyHours = projectData?.hours || 0;
                          
                          // Skip FREE, DOVOLENÁ, OVER
                          if (project === 'FREE' || project === 'DOVOLENÁ' || project === 'OVER') {
                            return;
                          }
                          
                          // Get week_monday from planning data
                          const planningEntry = planningData.find(
                            p => normalizeName(p.konstrukter) === normalizeName(engineer) && p.cw === week
                          );
                          
                          if (planningEntry?.week_monday) {
                            const weekMonday = new Date(planningEntry.week_monday);
                            
                            // Calculate how many working days from this week fall into this month
                            const daysInMonth = getWorkingDaysInWeekForMonth(weekMonday, year, monthNum, isSlovak);
                            
                            // Proportionally allocate weekly hours
                            // Assume 5 working days per week
                            const proportion = daysInMonth / 5;
                            totalActualHours += weeklyHours * proportion;
                          }
                        });
                      });
                      
                      const utilization = totalMaxCapacity > 0 
                        ? Math.round((totalActualHours / totalMaxCapacity) * 100) 
                        : 0;
                      
                      
                      return (
                        <td 
                          key={month.name} 
                          className={`border border-border p-1.5 text-center font-semibold ${
                            monthIndex > 0 ? 'border-l-4 border-l-primary/50' : ''
                          }`}
                          >
                            <div className="text-sm text-foreground">
                              {utilization}%
                            </div>
                          </td>
                      );
                    })
                  )}
                </tr>
                )}
                {/* Legend row - hide in customer view */}
                {!customerViewMode && (
                <tr className="bg-muted/30 border-t border-border">
                  <td className="border border-border p-2 font-medium sticky left-0 bg-muted/30 z-10 text-foreground text-xs">
                    Legenda:
                  </td>
                  <td 
                    colSpan={viewMode === 'weeks' ? months.reduce((sum, m) => sum + m.weeks.length, 0) : months.length}
                    className="border border-border p-2"
                  >
                    <div className="flex items-center gap-6 flex-wrap text-xs">
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-primary/20 text-primary rounded-md">
                          Projekt
                        </div>
                        <span className="text-muted-foreground">Plně vytížen</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-primary/20 text-primary rounded-md border-[3px] border-dashed border-red-500">
                          Projekt
                        </div>
                        <span className="text-muted-foreground">Částečně vytížen</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-primary/20 text-primary rounded-md border-[3px] border-dashed border-yellow-400">
                          Projekt
                        </div>
                        <span className="text-muted-foreground">Předběžně plánován</span>
                      </div>
                    </div>
                  </td>
                </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            Zobrazeno {filteredEngineers.length} konstruktérů
          </div>
        </CardContent>

        <PlanningHistoryDialog
          open={historyDialogOpen}
          onOpenChange={setHistoryDialogOpen}
          engineers={engineers}
          projects={projects.map(p => p.code)}
        />
        
        <ProjectAllocationDialog
          open={projectDialogOpen}
          onOpenChange={setProjectDialogOpen}
          projectName={selectedProject || ''}
          allocations={selectedProject ? getAllocationsForProject(selectedProject) : []}
          projectInfo={projects.find(p => p.code === selectedProject)}
          customers={customers}
          projectManagers={projectManagers}
          programs={programs}
          viewMode={viewMode}
        />
      </Card>
    </div>
    </TooltipProvider>
  );
};