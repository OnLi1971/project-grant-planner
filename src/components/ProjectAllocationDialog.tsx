import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Project, Customer, ProjectManager, Program } from '@/data/projectsData';

export interface AllocationEntry {
  engineer: string;
  week: string;
  hours: number;
  isTentative: boolean;
  alternativeActivity?: string; // 'DOVOLENÁ', 'NEMOC', 'OVER'
}

interface ProjectAllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  allocations: AllocationEntry[];
  projectInfo?: Project;
  customers?: Customer[];
  projectManagers?: ProjectManager[];
  programs?: Program[];
  viewMode?: 'weeks' | 'months';
}

// Week to month mapping
const monthWeekMapping: { [key: string]: { month: number; name: string } } = {
  '01': { month: 1, name: 'leden' }, '02': { month: 1, name: 'leden' }, '03': { month: 1, name: 'leden' }, '04': { month: 1, name: 'leden' }, '05': { month: 2, name: 'únor' },
  '06': { month: 2, name: 'únor' }, '07': { month: 2, name: 'únor' }, '08': { month: 2, name: 'únor' }, '09': { month: 3, name: 'březen' },
  '10': { month: 3, name: 'březen' }, '11': { month: 3, name: 'březen' }, '12': { month: 3, name: 'březen' }, '13': { month: 3, name: 'březen' }, '14': { month: 4, name: 'duben' },
  '15': { month: 4, name: 'duben' }, '16': { month: 4, name: 'duben' }, '17': { month: 4, name: 'duben' }, '18': { month: 5, name: 'květen' },
  '19': { month: 5, name: 'květen' }, '20': { month: 5, name: 'květen' }, '21': { month: 5, name: 'květen' }, '22': { month: 5, name: 'květen' }, '23': { month: 6, name: 'červen' },
  '24': { month: 6, name: 'červen' }, '25': { month: 6, name: 'červen' }, '26': { month: 6, name: 'červen' }, '27': { month: 7, name: 'červenec' },
  '28': { month: 7, name: 'červenec' }, '29': { month: 7, name: 'červenec' }, '30': { month: 7, name: 'červenec' }, '31': { month: 8, name: 'srpen' },
  '32': { month: 8, name: 'srpen' }, '33': { month: 8, name: 'srpen' }, '34': { month: 8, name: 'srpen' }, '35': { month: 8, name: 'srpen' },
  '36': { month: 9, name: 'září' }, '37': { month: 9, name: 'září' }, '38': { month: 9, name: 'září' }, '39': { month: 9, name: 'září' },
  '40': { month: 10, name: 'říjen' }, '41': { month: 10, name: 'říjen' }, '42': { month: 10, name: 'říjen' }, '43': { month: 10, name: 'říjen' }, '44': { month: 10, name: 'říjen' },
  '45': { month: 11, name: 'listopad' }, '46': { month: 11, name: 'listopad' }, '47': { month: 11, name: 'listopad' }, '48': { month: 11, name: 'listopad' },
  '49': { month: 12, name: 'prosinec' }, '50': { month: 12, name: 'prosinec' }, '51': { month: 12, name: 'prosinec' }, '52': { month: 12, name: 'prosinec' }
};
// Helper functions for alternative activities
const getActivityLabel = (activity: string): string => {
  switch (activity) {
    case 'DOVOLENÁ': return 'DOV';
    case 'NEMOC': return 'NEM';
    case 'OVER': return 'OVR';
    default: return '-';
  }
};

const getActivityStyle = (activity: string): string => {
  switch (activity) {
    case 'DOVOLENÁ': return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400';
    case 'NEMOC': return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400';
    case 'OVER': return 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400';
    default: return '';
  }
};

export const ProjectAllocationDialog = ({
  open,
  onOpenChange,
  projectName,
  allocations,
  projectInfo,
  customers,
  projectManagers,
  programs,
  viewMode = 'weeks',
}: ProjectAllocationDialogProps) => {
  // Get unique weeks sorted chronologically
  const weeks = useMemo(() => {
    const uniqueWeeks = [...new Set(allocations.map(a => a.week))];
    return uniqueWeeks.sort((a, b) => {
      const [, cwA, yearA] = a.match(/CW(\d+)-(\d+)/) || [];
      const [, cwB, yearB] = b.match(/CW(\d+)-(\d+)/) || [];
      const yearDiff = parseInt(yearA) - parseInt(yearB);
      if (yearDiff !== 0) return yearDiff;
      return parseInt(cwA) - parseInt(cwB);
    });
  }, [allocations]);

  // Get unique months sorted chronologically (for monthly view)
  const monthsData = useMemo(() => {
    if (viewMode !== 'months') return { columns: [], weekToMonth: {} as Record<string, string> };
    
    const weekToMonth: Record<string, string> = {};
    const monthsMap = new Map<string, { name: string; weeks: string[]; order: number }>();
    
    weeks.forEach(week => {
      const match = week.match(/CW(\d+)-(\d+)/);
      if (match) {
        const cwNum = match[1];
        const year = match[2];
        const monthInfo = monthWeekMapping[cwNum];
        if (monthInfo) {
          const monthKey = `${monthInfo.name} ${year}`;
          weekToMonth[week] = monthKey;
          
          if (!monthsMap.has(monthKey)) {
            monthsMap.set(monthKey, { 
              name: monthKey, 
              weeks: [], 
              order: parseInt(year) * 100 + monthInfo.month 
            });
          }
          monthsMap.get(monthKey)!.weeks.push(week);
        }
      }
    });
    
    const columns = Array.from(monthsMap.values())
      .sort((a, b) => a.order - b.order)
      .map(m => m.name);
    
    return { columns, weekToMonth };
  }, [weeks, viewMode]);

  // Display columns based on view mode
  const displayColumns = viewMode === 'months' ? monthsData.columns : weeks;

  // Get unique engineers sorted alphabetically
  const engineers = useMemo(() => {
    const uniqueEngineers = [...new Set(allocations.map(a => a.engineer))];
    return uniqueEngineers.sort((a, b) => a.localeCompare(b, 'cs'));
  }, [allocations]);

  // Create allocation matrix for weekly view: { engineer: { week: { hours, isTentative, alternativeActivity } } }
  const weeklyAllocationMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, { hours: number; isTentative: boolean; alternativeActivity?: string }>> = {};
    
    engineers.forEach(eng => {
      matrix[eng] = {};
    });
    
    allocations.forEach(a => {
      if (!matrix[a.engineer]) matrix[a.engineer] = {};
      matrix[a.engineer][a.week] = { 
        hours: a.hours, 
        isTentative: a.isTentative,
        alternativeActivity: a.alternativeActivity 
      };
    });
    
    return matrix;
  }, [allocations, engineers]);

  // Create allocation matrix for monthly view: { engineer: { month: { hours, isTentative, weekCount, alternativeActivity } } }
  const monthlyAllocationMatrix = useMemo(() => {
    if (viewMode !== 'months') return {};
    
    const matrix: Record<string, Record<string, { hours: number; isTentative: boolean; weekCount: number; alternativeActivity?: string }>> = {};
    
    engineers.forEach(eng => {
      matrix[eng] = {};
      monthsData.columns.forEach(month => {
        matrix[eng][month] = { hours: 0, isTentative: false, weekCount: 0 };
      });
    });
    
    allocations.forEach(a => {
      const month = monthsData.weekToMonth[a.week];
      if (month && matrix[a.engineer]?.[month]) {
        matrix[a.engineer][month].hours += a.hours;
        matrix[a.engineer][month].weekCount += 1;
        if (a.isTentative) {
          matrix[a.engineer][month].isTentative = true;
        }
        // Track alternative activity if all entries in month are the same activity
        if (a.alternativeActivity) {
          matrix[a.engineer][month].alternativeActivity = a.alternativeActivity;
        }
      }
    });
    
    return matrix;
  }, [allocations, engineers, monthsData, viewMode]);

  // Month groups for weekly view header
  const monthGroups = useMemo(() => {
    if (viewMode !== 'weeks') return [];
    const groups: { name: string; colSpan: number }[] = [];
    weeks.forEach(week => {
      const match = week.match(/CW(\d+)-(\d+)/);
      if (match) {
        const monthInfo = monthWeekMapping[match[1]];
        const label = `${monthInfo?.name || '?'} ${match[2]}`;
        if (groups.length > 0 && groups[groups.length - 1].name === label) {
          groups[groups.length - 1].colSpan++;
        } else {
          groups.push({ name: label, colSpan: 1 });
        }
      }
    });
    return groups;
  }, [weeks, viewMode]);

  // Use appropriate matrix based on view mode
  const allocationMatrix = viewMode === 'months' ? monthlyAllocationMatrix : weeklyAllocationMatrix;

  // Calculate statistics
  const stats = useMemo(() => {
    const totalHours = allocations.reduce((sum, a) => sum + a.hours, 0);
    const tentativeAllocations = allocations.filter(a => a.isTentative).length;
    const finalAllocations = allocations.length - tentativeAllocations;
    const tentativeHours = allocations.filter(a => a.isTentative).reduce((sum, a) => sum + a.hours, 0);
    const finalHours = totalHours - tentativeHours;
    
    return {
      totalHours,
      uniqueEngineers: engineers.length,
      tentativeAllocations,
      finalAllocations,
      tentativeHours,
      finalHours,
      avgHoursPerEngineer: engineers.length > 0 ? Math.round(totalHours / engineers.length) : 0,
    };
  }, [allocations, engineers]);

  // Calculate row totals (per engineer)
  const rowTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    engineers.forEach(eng => {
      totals[eng] = displayColumns.reduce((sum, col) => {
        return sum + (allocationMatrix[eng]?.[col]?.hours || 0);
      }, 0);
    });
    return totals;
  }, [engineers, displayColumns, allocationMatrix]);

  // Calculate column totals (per column - week or month)
  const columnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    displayColumns.forEach(col => {
      totals[col] = engineers.reduce((sum, eng) => {
        return sum + (allocationMatrix[eng]?.[col]?.hours || 0);
      }, 0);
    });
    return totals;
  }, [engineers, displayColumns, allocationMatrix]);

  // Get project metadata
  const customer = customers?.find(c => c.id === projectInfo?.customerId);
  const pm = projectManagers?.find(p => p.id === projectInfo?.projectManagerId);
  const program = programs?.find(p => p.id === projectInfo?.programId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            {projectName}
            {projectInfo?.projectType && (
              <Badge variant="outline" className="text-[10px]">
                {projectInfo.projectType}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Project info */}
        {projectInfo && (
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground border-b pb-2">
            {customer && (
              <div>
                <span className="font-medium text-foreground">Zákazník:</span> {customer.name}
              </div>
            )}
            {program && (
              <div>
                <span className="font-medium text-foreground">Program:</span> {program.code}
              </div>
            )}
            {pm && (
              <div>
                <span className="font-medium text-foreground">PM:</span> {pm.name}
              </div>
            )}
            {projectInfo.averageHourlyRate && (
              <div>
                <span className="font-medium text-foreground">Hod. sazba:</span> {projectInfo.averageHourlyRate} Kč
              </div>
            )}
          </div>
        )}

        {/* Statistics cards */}
        <div className="grid grid-cols-3 gap-2 py-2">
          <Card className="bg-muted/30">
            <CardContent className="p-2 text-center">
              <div className="text-lg font-bold text-primary">{stats.totalHours}h</div>
              <div className="text-[10px] text-muted-foreground">Celkem hodin</div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10">
            <CardContent className="p-2 text-center">
              <div className="text-lg font-bold text-green-600">{stats.finalHours}h</div>
              <div className="text-[10px] text-muted-foreground">Finální ({stats.finalAllocations})</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-500/10">
            <CardContent className="p-2 text-center">
              <div className="text-lg font-bold text-yellow-600">{stats.tentativeHours}h</div>
              <div className="text-[10px] text-muted-foreground">Předběžně ({stats.tentativeAllocations})</div>
            </CardContent>
          </Card>
        </div>

        {/* Allocation table */}
        {allocations.length > 0 ? (
          <div className="flex-1 min-h-0 overflow-hidden border rounded-md" style={{ maxHeight: 'calc(80vh - 200px)' }}>
            <ScrollArea className="h-full">
              <div className="min-w-max pb-4">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    {viewMode === 'weeks' && (
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background z-20 min-w-[130px]" />
                        {monthGroups.map((group, idx) => (
                          <TableHead
                            key={`${group.name}-${idx}`}
                            colSpan={group.colSpan}
                            className="text-center text-[10px] font-semibold border-b py-1 px-0"
                          >
                            {group.name}
                          </TableHead>
                        ))}
                        <TableHead className="bg-muted/30 min-w-[50px]" />
                      </TableRow>
                    )}
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background z-20 min-w-[130px] font-semibold text-xs py-1.5 px-2">
                        Konstruktér
                      </TableHead>
                      {displayColumns.map(col => (
                        <TableHead key={col} className={`text-center ${viewMode === 'months' ? 'min-w-[80px]' : 'min-w-[50px]'} text-[10px] py-1.5 px-1`}>
                          {col.replace(/-\d{4}$/, '')}
                        </TableHead>
                      ))}
                      <TableHead className="text-center min-w-[50px] font-semibold bg-muted/30 text-xs py-1.5 px-1">
                        Celkem
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {engineers.map((engineer, index) => (
                      <TableRow key={engineer} className={index % 2 === 1 ? 'bg-muted/20' : ''}>
                        <TableCell className="sticky left-0 bg-inherit z-10 font-medium text-xs py-1 px-2">
                          {engineer}
                        </TableCell>
                        {displayColumns.map(col => {
                          const allocation = allocationMatrix[engineer]?.[col];
                          const hasAllocation = allocation && allocation.hours > 0;
                          // For monthly view, calculate average per week for coloring threshold
                          const weekCount = viewMode === 'months' && 'weekCount' in (allocation || {}) 
                            ? (allocation as { hours: number; isTentative: boolean; weekCount: number }).weekCount 
                            : 1;
                          const avgHoursPerWeek = hasAllocation ? allocation.hours / weekCount : 0;
                          const isFullyAllocated = avgHoursPerWeek >= 35;
                          
                          return (
                            <TableCell 
                              key={col} 
                              className={`text-center text-[11px] py-1 px-1 ${
                                hasAllocation 
                                  ? allocation.isTentative 
                                    ? 'bg-yellow-500/20' 
                                    : isFullyAllocated 
                                      ? 'bg-green-500/10' 
                                      : 'bg-orange-500/10'
                                  : ''
                              }`}
                            >
                              {hasAllocation ? (
                                <span className={`font-medium ${
                                  allocation.isTentative 
                                    ? 'text-yellow-600' 
                                    : isFullyAllocated 
                                      ? 'text-green-600' 
                                      : 'text-orange-600'
                                }`}>
                                  {allocation.hours}h
                                  {allocation.isTentative && <span className="text-[9px] ml-0.5">?</span>}
                                </span>
                              ) : allocation?.alternativeActivity ? (
                                <Badge 
                                  variant="outline" 
                                  className={`text-[9px] px-1 py-0 ${getActivityStyle(allocation.alternativeActivity)}`}
                                >
                                  {getActivityLabel(allocation.alternativeActivity)}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground/30">-</span>
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center font-bold bg-muted/30 text-xs py-1 px-1">
                          {rowTotals[engineer]}h
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Column totals row */}
                    <TableRow className="bg-muted/50 border-t-2">
                      <TableCell className="sticky left-0 bg-muted/50 z-10 font-bold text-xs py-1 px-2">
                        Celkem
                      </TableCell>
                      {displayColumns.map(col => (
                        <TableCell key={col} className="text-center font-bold text-xs py-1 px-1">
                          {columnTotals[col]}h
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-bold bg-primary/10 text-primary text-xs py-1 px-1">
                        {stats.totalHours}h
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-secondary/10">
                      <TableCell className="sticky left-0 bg-secondary/10 z-10 font-bold text-xs py-1 px-2">
                        Celkem FTE
                      </TableCell>
                      {displayColumns.map(col => (
                        <TableCell key={col} className="text-center font-bold text-xs py-1 px-1">
                          {(columnTotals[col] / (viewMode === 'months' ? 168 : 40)).toFixed(1)}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-bold bg-primary/10 text-primary text-xs py-1 px-1">
                        {(stats.totalHours / (viewMode === 'months' ? 168 : 40)).toFixed(1)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" className="h-3 bg-muted/50 [&>div]:bg-primary/60 [&>div]:hover:bg-primary/80" />
            </ScrollArea>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Žádné alokace pro tento projekt
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30"></div>
            <span>Plné vytížení (35+ h)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-500/20 border border-orange-500/30"></div>
            <span>Částečné vytížení</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500/30 border border-yellow-500/50"></div>
            <span>Předběžná rezervace (?)</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-blue-100 text-blue-700 border-blue-300">DOV</Badge>
            <span>Dovolená</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-red-100 text-red-700 border-red-300">NEM</Badge>
            <span>Nemoc</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-purple-100 text-purple-700 border-purple-300">OVR</Badge>
            <span>Režie/Overtime</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
